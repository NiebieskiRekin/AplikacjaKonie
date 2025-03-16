import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

type EventType =
  | "rozrody"
  | "leczenia"
  | "choroby"
  | "zdarzenia_profilaktyczne"
  | "podkucia";

const eventTypes: Record<
  EventType,
  {
    title: string;
    fields: string[];
    apiEndpoint: string;
    eventOptions?: string[];
  }
> = {
  rozrody: {
    title: "Edytuj wydarzenie rozrodu",
    fields: [
      "kon",
      "weterynarz",
      "dataZdarzenia",
      "rodzajZdarzenia",
      "opisZdarzenia",
    ],
    apiEndpoint: "rozrody",
    eventOptions: [
      "Inseminacja konia",
      "Sprawdzenie źrebności",
      "Wyźrebienie",
      "Inne",
    ],
  },
  leczenia: {
    title: "Edytuj wydarzenie leczenia",
    fields: ["kon", "weterynarz", "dataZdarzenia", "choroba", "opisZdarzenia"],
    apiEndpoint: "leczenia",
  },
  choroby: {
    title: "Edytuj chorobę",
    fields: ["kon", "dataRozpoczecia", "dataZakonczenia", "opisZdarzenia"],
    apiEndpoint: "choroby",
  },
  zdarzenia_profilaktyczne: {
    title: "Edytuj zdarzenie profilaktyczne",
    fields: [
      "konieId",
      "weterynarz",
      "dataZdarzenia",
      "dataWaznosci",
      "rodzajZdarzenia",
      "opisZdarzenia",
    ],
    apiEndpoint: "profilaktyczne",
    eventOptions: [
      "Szczepienie",
      "Odrobaczanie",
      "Podanie suplementów",
      "Dentysta",
      "Inne",
    ],
  },
  podkucia: {
    title: "Edytuj podkucie",
    fields: ["kon", "kowal", "dataZdarzenia", "dataWaznosci"],
    apiEndpoint: "podkucie",
  },
};

function EditHorseEvent() {
  const navigate = useNavigate();
  const { id, type, eventId } = useParams<{
    id: string;
    type: EventType;
    eventId: string;
  }>();
  const [formData, setFormData] = useState<{
    [key: string]: string | number | number[] | null;
  }>({});
  const [people, setPeople] = useState<{ id: string; imieINazwisko: string }[]>(
    []
  );
  const [choroba, setChoroba] = useState<
    { id: string; opisZdarzenia: string }[]
  >([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!type || !eventTypes[type]) {
      setError("Nieznany typ wydarzenia.");
      return;
    }
    console.log(id, type, eventId);

    const fetchPeople = async () => {
      try {
        const response = await fetch(
          type === "podkucia" ? "/api/kowale" : "/api/weterynarze"
        );
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Błąd pobierania danych");
        setPeople(data);
        return data;
      } catch (err) {
        setError((err as Error).message);
        return [];
      }
    };

    const fetchChoroba = async () => {
      if (type === "leczenia") {
        try {
          const response = await fetch(`/api/konie/choroby/${id}`);
          const data = await response.json();
          if (!response.ok)
            throw new Error(data.error || "Błąd pobierania danych");
          setChoroba(data);
          return data;
        } catch (err) {
          setError((err as Error).message);
          return [];
        }
      }
    };

    const fetchEventData = async (
      peopleData: { id: string; imieINazwisko: string }[],
      chorobaData: { id: string; opisZdarzenia: string }[]
    ) => {
      try {
        const response = await fetch(
          `/api/wydarzenia/${eventTypes[type].apiEndpoint}/${eventId}`
        );
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Błąd pobierania danych");
        const eventData = data[0];
        if (eventData.weterynarz) {
          const vet = peopleData.find(
            (person) => person.imieINazwisko == eventData.weterynarz
          );
          if (vet) eventData.vet = vet.id;
        }
        if (eventData.kowal) {
          const kow = peopleData.find(
            (person) => person.imieINazwisko === eventData.kowal
          );
          if (kow) eventData.kow = kow.id;
        }
        if (eventData.choroba) {
          const chor = chorobaData.find(
            (choroba) => choroba.opisZdarzenia === eventData.choroba
          );
          if (chor) eventData.choroba = chor.id;
        }
        setFormData(eventData);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    const fetchData = async () => {
      const peopleData = await fetchPeople();
      const chorobaData = await fetchChoroba();
      await fetchEventData(peopleData, chorobaData);
    };

    fetchData();
  }, [type, id, eventId]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!type || !eventTypes[type]) {
      return setError("Nieznany typ wydarzenia.");
    }
    if (formData.weterynarz) {
      const vet = people.find(
        (person) => person.imieINazwisko == formData.weterynarz
      );
      if (vet) formData.weterynarz = vet.id;
    }
    if (formData.kowal) {
      const kow = people.find(
        (person) => person.imieINazwisko === formData.kowal
      );
      if (kow) formData.kowal = kow.id;
    }
    if (formData.choroba) {
      const chor = choroba.find(
        (choroba) => choroba.opisZdarzenia === formData.choroba
      );
      if (chor) formData.choroba = chor.id;
    }

    try {
      const response = await fetch(
        `/api/wydarzenia/${eventTypes[type].apiEndpoint}/${eventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Błąd aktualizacji wydarzenia");

      setSuccess("Zdarzenie zostało zaktualizowane!");
      setTimeout(() => navigate(`/wydarzenia/${id}/${type}`), 1500);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (eventId: number) => {
    if (!window.confirm("Czy na pewno chcesz usunąć to wydarzenie?")) return;

    try {
      const response = await fetch(`/api/wydarzenia/${type}/${eventId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Błąd usuwania wydarzenia");

      setSuccess("Wydarzenie zostało usunięte!");
      setTimeout(() => navigate(`/wydarzenia/${id}/${type}`), 1500);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!type || !eventTypes[type]) {
    return <p className="text-red-600">Nieznany typ wydarzenia.</p>;
  }

  const { title, fields, eventOptions } = eventTypes[type];

  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-6">
      <h2 className="mb-6 text-3xl font-bold text-white">✏ {title}</h2>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}

      <form
        onSubmit={handleSubmit}
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
              value={(formData.vet as string) || ""}
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
              value={(formData.kow as string) || ""}
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
              value={(formData.choroba as string) || ""}
              onChange={handleInputChange}
            >
              <option value="">-- Wybierz chrobę --</option>
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

        <button
          type="submit"
          className="w-full rounded-lg bg-gradient-to-r from-green-700 to-green-300 py-3 text-white shadow-lg transition hover:from-green-700 hover:to-green-800"
        >
          ✅ Zapisz zmiany
        </button>
        <button
          onClick={() => handleDelete(Number(eventId))}
          className="w-full rounded-lg bg-gradient-to-r from-red-300 to-red-700 py-3 text-white shadow-lg transition hover:from-red-700 hover:to-red-800"
        >
          ❌ Usuń wydarzenie
        </button>
      </form>
    </div>
  );
}

export default EditHorseEvent;
