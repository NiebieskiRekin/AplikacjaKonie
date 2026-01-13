import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { APIClient } from "@/frontend/lib/api-client";
import { GoArrowLeft } from "react-icons/go";

type EventFormProps = {
  id: string;
  type: string;
  eventId?: string; // Tylko w przypadku edycji
  eventTypes: Record<
    string,
    {
      title: string;
      fields: string[];
      apiEndpoint: string;
      eventOptions?: string[];
    }
  >;
  formAction: (formData: string) => Promise<void>;
  edit: boolean;
};

// Pobiera wszystkich weterynarzy lub kowali
const fetchPeople = async (type: string) => {
  if (type === "choroby") return []; // zeby bezsensownie nie pobierało
  try {
    let response;
    if (type === "podkucia") {
      response = await APIClient.api.kowale.$get();
    } else {
      response = await APIClient.api.weterynarze.$get();
    }
    if (response.status === 401 || response.status === 500) {
      const data = await response.json();
      throw new Error(data.error);
    } else {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    throw new Error((err as Error).message);
  }
};

// Pobiera info o chorobach dla konia w `leczeniu`
const fetchChoroba = async (id: string, type: string) => {
  if (type === "leczenia") {
    try {
      const response = (await APIClient.api.konie[":id{[0-9]+}"][
        ":type{[A-Za-z_]+}"
      ].$get({
        param: { id: id, type: "choroby" },
      })) as any;
      if (response.status == 200) {
        const data = await response.json();
        return data;
      } else {
        const data = await response.json();
        throw new Error(data.error || "Błąd pobierania danych");
      }
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }
  return [];
};

// Pobiera typ konia, żeby mogło ustawić odpowiednią datę ważności
const fetchHorseType = async (id: string) => {
  try {
    const response = await APIClient.api.konie[":id{[0-9]+}"].$get({
      param: { id: id },
    });
    if (response.status == 200) {
      const data = await response.json();
      return data.rodzajKonia;
    } else {
      const data = await response.json();
      throw new Error(data.error || "Błąd pobierania danych");
    }
  } catch (err) {
    throw new Error((err as Error).message);
  }
};

// Funkcja ustalająca odpowiednią datę ważności
const getExpirationDate = (eventType: string, horseType: string) => {
  const baseDate = new Date();
  const expirationRules: Record<string, number> = {
    Szczepienie: horseType === "Konie sportowe" ? 180 : 365, // +6 miesięcy dla koni sportowych, +1 rok dla innych
    Odrobaczanie: 180, // +6 miesięcy
    "Podanie suplementów": 180, // +6 miesięcy
    Dentysta:
      horseType === "Konie sportowe" || horseType === "Konie rekreacyjne"
        ? 180
        : 365, // +6 miesięcy dla koni sportowych i rekreacyjnych, +1 rok dla innych
  };

  let daysToAdd = 365;
  if (expirationRules[eventType]) {
    daysToAdd = expirationRules[eventType];
  } else if (eventType === "podkucia") {
    daysToAdd =
      horseType === "Konie sportowe" || horseType === "Konie rekreacyjne"
        ? 42
        : 84;
  }
  baseDate.setDate(baseDate.getDate() + daysToAdd);

  return baseDate.toISOString().split("T")[0];
};

const BaseHorseEventForm = ({
  id,
  type,
  eventId,
  eventTypes,
  formAction,
  edit,
}: EventFormProps) => {
  const [formData, setFormData] = useState<{
    [key: string]: string | number | number[] | null;
  }>({ kon: id || "" });
  const [people, setPeople] = useState<{ id: number; imieINazwisko: string }[]>(
    []
  );
  const [choroba, setChoroba] = useState<
    { id: number; opisZdarzenia: string }[]
  >([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [horseType, setHorseType] = useState<string>("");
  const navigate = useNavigate();
  const displayType =
    type === "zdarzenia_profilaktyczne" ? "profilaktyczne" : type;

  useEffect(() => {
    // Pobiera dane wydarzenia, jeśli edytujemy
    const fetchEventData = async (
      peopleData: { id: number; imieINazwisko: string }[],
      chorobaData: { id: number; opisZdarzenia: string }[]
    ) => {
      try {
        const response = await APIClient.api.wydarzenia[":type{[A-Za-z_-]+}"][
          ":id{[0-9]+}"
        ].$get({ param: { id: eventId!, type: eventTypes[type].apiEndpoint } });

        if (response.status === 200) {
          const data = await response.json();
          const eventData = data[0];

          if ("weterynarz" in eventData) {
            const vet = peopleData.find(
              (person) => person.imieINazwisko === eventData.weterynarz
            );
            if (vet) eventData.weterynarz = vet.id.toString();
          }

          if ("kowal" in eventData) {
            const kow = peopleData.find(
              (person) => person.imieINazwisko === eventData.kowal
            );
            if (kow) eventData.kowal = kow.id.toString();
          }

          if ("choroba" in eventData) {
            const chor = chorobaData.find(
              (choroba) => choroba.opisZdarzenia === eventData.choroba
            );
            if (chor) eventData.choroba = chor.id.toString();
          }

          setFormData(eventData);
        } else {
          const data = await response.json();
          throw new Error(data.error || "Błąd pobierania danych");
        }
      } catch (err) {
        setError((err as Error).message);
      }
    };

    // Ustalanie daty zdarzenia na dzisiejszą
    const fetchData = async () => {
      try {
        if (!formData.dataZdarzenia) {
          setFormData((prev) => ({
            ...prev,
            dataZdarzenia: new Date().toISOString().split("T")[0],
          }));
        }
        if (!formData.dataRozpoczecia) {
          setFormData((prev) => ({
            ...prev,
            dataRozpoczecia: new Date().toISOString().split("T")[0],
          }));
        }

        if (edit) {
          setFormData((prev) => ({
            ...prev,
            dataZdarzenia: new Date().toISOString().split("T")[0],
          }));
        }

        const peopleData = await fetchPeople(type);
        const chorobaData = await fetchChoroba(id, type);
        const HorseType = await fetchHorseType(id);

        const chr = chorobaData.map((v: { _id: any; opisZdarzenia: any }) => {
          return { id: v._id, opisZdarzenia: v.opisZdarzenia || "" };
        });
        setPeople(peopleData);
        setChoroba(chr);
        setHorseType(HorseType);

        if (edit && eventId) {
          await fetchEventData(peopleData, chr);
        }
      } catch (err) {
        setError((err as Error).message);
      }
    };

    void fetchData();
  }, [type, id, eventId, edit, eventTypes]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value };
      if (name === "rodzajZdarzenia" && type === "zdarzenia_profilaktyczne") {
        updatedData.dataWaznosci = getExpirationDate(type, horseType);
      }

      return updatedData;
    });
  };

  useEffect(() => {
    if (type === "zdarzenia_profilaktyczne" && formData.rodzajZdarzenia) {
      const expirationDate = getExpirationDate(
        formData.rodzajZdarzenia as string,
        horseType
      );
      setFormData((prev) => ({
        ...prev,
        dataWaznosci: expirationDate,
      }));
    }
  }, [formData.rodzajZdarzenia, type, horseType]);

  useEffect(() => {
    if (type === "podkucia" && !formData.dataWaznosci) {
      const expirationDate = getExpirationDate("podkucia", horseType);
      setFormData((prev) => ({
        ...prev,
        dataWaznosci: expirationDate,
      }));
    }
  }, [formData.kon, type, horseType, formData.dataWaznosci]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Odpowiednie formatowanie danych do wysyłki
      const formattedData = { ...formData };
      if (formattedData.kon) formattedData.kon = Number(formattedData.kon);
      if (formattedData.weterynarz)
        formattedData.weterynarz = Number(formattedData.weterynarz);
      if (formattedData.kowal)
        formattedData.kowal = Number(formattedData.kowal);
      if (formattedData.choroba)
        formattedData.choroba = Number(formattedData.choroba);
      if (
        formattedData.kon &&
        (type === "zdarzenia_profilaktyczne" || type === "podkucia")
      )
        formattedData.konieId = [Number(formattedData.kon)];

      if (type === "rozrody") {
        if (!formattedData.weterynarz) {
          setError("Wybierz weterynarza!");
          return;
        }
        if (!formattedData.rodzajZdarzenia) {
          setError("Wybierz rodzaj zdarzenia!");
          return;
        }
      }
      if (type === "leczenia") {
        if (!formattedData.weterynarz) {
          setError("Wybierz weterynarza!");
          return;
        }
        if (!formattedData.choroba) {
          setError("Wybierz chorobę!");
          return;
        }
      }
      if (type === "zdarzenia_profilaktyczne") {
        if (!formattedData.rodzajZdarzenia) {
          setError("Wybierz rodzaj zdarzenia!");
          return;
        }
        if (!formattedData.weterynarz) {
          setError("Wybierz weterynarza!");
          return;
        }
      }
      if (type === "podkucia") {
        if (!formattedData.kowal) {
          setError("Wybierz kowala!");
          return;
        }
      }

      await formAction(JSON.stringify(formattedData));
      setSuccess("Zdarzenie zostało zaktualizowane!");
      const redirectType =
        type === "zdarzenia_profilaktyczne" ? "profilaktyczne" : type;
      setTimeout(
        () => void navigate(`/wydarzenia/${id}/${redirectType}`),
        1500
      );
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const { title, fields, eventOptions } = eventTypes[type];

  const handleDelete = async () => {
    if (!eventId) return;

    const confirmed = window.confirm(
      "Czy na pewno chcesz usunąć to zdarzenie?"
    );
    if (!confirmed) return;

    try {
      const response = await APIClient.api.wydarzenia[":type{[A-Za-z_-]+}"][
        ":id{[0-9]+}"
      ].$delete({
        param: {
          type: eventTypes[type].apiEndpoint,
          id: eventId,
        },
      });

      if (response.status === 200) {
        navigate(`/wydarzenia/${id}/${displayType}`);
      } else {
        const data = await response.json();
        setError(data.error || "Nie udało się usunąć zdarzenia.");
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-6">
      <div className="relative mb-10 flex w-full max-w-7xl items-center justify-center sm:mb-6">
        <button
          onClick={() => void navigate(`/wydarzenia/${id}/${displayType}`)}
          className="absolute left-0 flex items-center gap-2 rounded-lg bg-linear-to-r from-gray-500 to-gray-700 px-4 py-2 text-white transition sm:relative sm:mr-auto"
        >
          <GoArrowLeft className="text-xl" />
        </button>

        <h2 className="absolute left-1/2 -translate-x-1/2 transform text-center text-3xl font-bold text-white">
          ✏ {title}
        </h2>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
      >
        {fields.includes("weterynarz") && (
          <>
            <label className="block text-gray-700">
              👨‍⚕️ Wybierz weterynarza:
            </label>
            <select
              name="weterynarz"
              className="mb-3 w-full rounded border p-2"
              value={formData.weterynarz?.toString() || ""}
              onChange={handleInputChange}
            >
              <option value="">-- Wybierz weterynarza --</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.imieINazwisko}
                </option>
              ))}
            </select>
          </>
        )}

        {fields.includes("kowal") && (
          <>
            <label className="block text-gray-700">🛠 Wybierz kowala:</label>
            <select
              name="kowal"
              className="mb-3 w-full rounded border p-2"
              value={formData.kowal?.toString() || ""}
              onChange={handleInputChange}
            >
              <option value="">-- Wybierz kowala --</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.imieINazwisko}
                </option>
              ))}
            </select>
          </>
        )}

        {fields.includes("choroba") && (
          <>
            <label className="block text-gray-700"> 🤒 Wybierz chorobę:</label>
            <select
              name="choroba"
              className="mb-3 w-full rounded border p-2"
              value={formData.choroba ? String(formData.choroba) : ""}
              onChange={handleInputChange}
            >
              <option value="">-- Wybierz chorobę --</option>
              {choroba.map((choroba) => (
                <option key={choroba.id} value={choroba.id}>
                  {choroba.opisZdarzenia}
                </option>
              ))}
            </select>
          </>
        )}

        {fields.includes("rodzajZdarzenia") && (
          <>
            <label className="block text-gray-700">📋 Rodzaj zdarzenia:</label>
            <select
              name="rodzajZdarzenia"
              className="mb-3 w-full rounded border p-2"
              value={formData.rodzajZdarzenia as string}
              onChange={handleInputChange}
            >
              <option value="">-- Wybierz rodzaj --</option>
              {eventOptions &&
                eventOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
            </select>
          </>
        )}

        {fields.includes("dataZdarzenia") && (
          <>
            <label className="block text-gray-700">📅 Data zdarzenia:</label>
            <input
              type="date"
              name="dataZdarzenia"
              className="mb-3 w-full rounded border p-2"
              value={(formData.dataZdarzenia as string) || ""}
              onChange={handleInputChange}
            />
          </>
        )}

        {fields.includes("dataRozpoczecia") && (
          <>
            <label className="block text-gray-700">📅 Data Rozpoczecia:</label>
            <input
              type="date"
              name="dataRozpoczecia"
              className="mb-3 w-full rounded border p-2"
              value={(formData.dataRozpoczecia as string) || ""}
              onChange={handleInputChange}
            />
          </>
        )}

        {fields.includes("dataZakonczenia") && (
          <>
            <label className="block text-gray-700">📅 Data Zakonczenia:</label>
            <input
              type="date"
              name="dataZakonczenia"
              className="mb-3 w-full rounded border p-2"
              value={(formData.dataZakonczenia as string) || ""}
              onChange={handleInputChange}
            />
          </>
        )}

        {fields.includes("dataWaznosci") && (
          <>
            <label className="block text-gray-700">⏳ Data ważności:</label>
            <input
              type="date"
              name="dataWaznosci"
              className="mb-3 w-full rounded border p-2"
              value={(formData.dataWaznosci as string) || ""}
              onChange={handleInputChange}
            />
          </>
        )}

        {fields.includes("opisZdarzenia") && (
          <>
            <label className="block text-gray-700">📝 Opis zdarzenia:</label>
            <textarea
              name="opisZdarzenia"
              className="mb-3 w-full rounded border p-2"
              value={(formData.opisZdarzenia as string) || ""}
              onChange={handleInputChange}
            />
          </>
        )}

        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            type="submit"
            className="w-full flex-1 rounded-lg bg-green-600 py-3 text-white transition hover:bg-green-700 sm:w-auto"
          >
            {edit ? "💾 Zapisz zmiany" : "✅ Dodaj zdarzenie"}
          </button>

          {edit && (
            <button
              type="button"
              onClick={handleDelete}
              className="w-full flex-1 rounded-lg bg-red-600 py-3 text-white transition hover:bg-red-700 sm:w-auto"
            >
              🗑 Usuń zdarzenie
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default BaseHorseEventForm;
