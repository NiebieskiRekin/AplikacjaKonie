import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export const eventTypes: Record<string, { title: string; fields: string[]; apiEndpoint: string; eventOptions?: string[] }> = {
    rozrody: {
      title: "Dodaj wydarzenie rozrodu",
      fields: ["kon", "weterynarz", "dataZdarzenia", "rodzajZdarzenia", "opisZdarzenia"],
      apiEndpoint: "rozrody",
      eventOptions: ["Inseminacja konia", "Sprawdzenie źrebności", "Wyźrebienie", "Inne"],
    },
    leczenia: {
      title: "Dodaj wydarzenie leczenia",
      fields: ["kon", "weterynarz", "dataZdarzenia", "choroba", "opisZdarzenia"],
      apiEndpoint: "leczenia",
    },
    choroby: {
      title: "Dodaj chorobę",
      fields: ["kon", "dataRozpoczecia", "dataZakonczenia", "opisZdarzenia"],
      apiEndpoint: "choroby",
    },
    zdarzenia_profilaktyczne: {
      title: "Dodaj zdarzenie profilaktyczne",
      fields: ["konieId", "weterynarz", "dataZdarzenia", "dataWaznosci", "rodzajZdarzenia", "opisZdarzenia"],
      apiEndpoint: "zdarzenia-profilaktyczne",
      eventOptions: ["Szczepienie", "Odrobaczanie", "Podanie suplementów", "Dentysta", "Inne"],
    },
    podkucia: {
      title: "Dodaj podkucie",
      fields: ["kon", "kowal", "dataZdarzenia", "dataWaznosci"],
      apiEndpoint: "podkucie",
    },
  };
  
type EventFormProps = {
  id: string;
  type: string;
  eventId?: string; // Tylko w przypadku edycji
  eventTypes: Record<string, { title: string; fields: string[]; apiEndpoint: string; eventOptions?: string[] }>;
  formAction: (formData: any) => Promise<void>;
  edit: boolean;
};

// Pobiera wszystkich weterynarzy lub kowali
const fetchPeople = async (type: string) => {
  if (type === "choroby") return []; // zeby bezsensownie nie pobierało 
  try {
    const response = await fetch(type === "podkucia" ? "/api/kowale" : "/api/weterynarze");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Błąd pobierania danych");
    return data;
  } catch (err) {
    throw new Error((err as Error).message);
  }
};

// Pobiera info o chorobach dla konia w `leczeniu`
const fetchChoroba = async (id: string, type: string) => {
  if (type === "leczenia") {
    try {
      const response = await fetch(`/api/konie/choroby/${id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Błąd pobierania danych");
      return data;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }
  return [];
};

// Pobiera typ konia, żeby mogło ustawić odpowiednią datę ważności
const fetchHorseType = async (id: string) => {
  try {
      const response = await fetch(`/api/konie/${id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Błąd pobierania danych");
      return data.rodzajKonia;
  } catch (err) {
    throw new Error((err as Error).message);
  }
};

// Funkcja ustalająca odpowiednią datę ważności
const getExpirationDate = (eventType: string, horseType: string) => {
  const baseDate = new Date();
  const expirationRules: Record<string, number> = {
    "Szczepienie": horseType === "Konie sportowe" ? 180 : 365, // +6 miesięcy dla koni sportowych, +1 rok dla innych
    "Odrobaczanie": 180,       // +6 miesięcy
    "Podanie suplementów": 180, // +6 miesięcy
    "Dentysta": horseType === "Konie sportowe" || horseType === "Konie rekreacyjne" ? 180 : 365, // +6 miesięcy dla koni sportowych i rekreacyjnych, +1 rok dla innych
  };
  console.log( horseType, expirationRules[eventType], eventType);
  let daysToAdd = 365;
  if (expirationRules[eventType]) {
    daysToAdd = expirationRules[eventType];
  } else if (eventType === "podkucia") {
    daysToAdd = horseType === "Konie sportowe" || horseType === "Konie rekreacyjne" ? 42 : 84;
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
  edit
}: EventFormProps) => {
  const [formData, setFormData] = useState<{ [key: string]: string | number | number[] | null}>({ kon: id || "" });
  const [people, setPeople] = useState<{ id: number; imieINazwisko: string }[]>([]);
  const [choroba, setChoroba] = useState<{ id: number; opisZdarzenia: string }[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const [horseType, setHorseType] = useState<string>("");

  useEffect(() => {  
    // Pobiera dane wydarzenia, jeśli edytujemy
    const fetchEventData = async (
      peopleData: { id: string; imieINazwisko: string }[],
      chorobaData: { id: string; opisZdarzenia: string }[]
    ) => {
      try {
        const response = await fetch(`/api/wydarzenia/${eventTypes[type].apiEndpoint}/${eventId}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Błąd pobierania danych");
        const eventData = data[0];
        
        // Tutaj x3 zabawa w id i wyświetlanie nazwy, i opowiednie co wysyłanie
        if (eventData.weterynarz) {
          const vet = peopleData.find(person => person.imieINazwisko === eventData.weterynarz);
          if (vet) eventData.vet = vet.id;
          eventData.weterynarz = eventData.vet;
        }
  
        if (eventData.kowal) {
          const kow = peopleData.find(person => person.imieINazwisko === eventData.kowal);
          if (kow) eventData.kow = kow.id;
          eventData.kowal = eventData.kow;
        }
  
        if (eventData.choroba) {
          const chor = chorobaData.find(choroba => choroba.opisZdarzenia === eventData.choroba);
          if (chor) eventData.choroba = chor.id;
          eventData.choroba = chor.id;
        }

        setFormData(eventData);
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
        // Nie wiem czemu to tu jest, chyba do usunięcia
        if (edit) {
          setFormData((prev) => ({
            ...prev,
            dataZdarzenia: new Date().toISOString().split("T")[0],
          }));
        }

        const peopleData = await fetchPeople(type);
        const chorobaData = await fetchChoroba(id, type);
        const HorseType = await fetchHorseType(id);

        setPeople(peopleData);
        setChoroba(chorobaData);
        setHorseType(HorseType);

        if (edit && eventId) {
          await fetchEventData(peopleData, chorobaData);
        }

      } catch (err) {
        setError((err as Error).message);
      }
    };
  
    fetchData();
  
  }, [type, id, eventId, edit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(name, value);
  
    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value };
      // Upgardes dataWaznosci when rodzajZdarzenia changes
      if (name === "rodzajZdarzenia" && type === "zdarzenia_profilaktyczne") {
        updatedData.dataWaznosci = getExpirationDate(type, horseType);
      }
  
      return updatedData;
    });
  };
  
  // Można chyba będzie to w jedno wrzucić, ale do testu 
  // + nie wiem czy dla zdarzen to potrzebne 
  useEffect(() => {
    if (type === "zdarzenia_profilaktyczne" && formData.rodzajZdarzenia) {
      const expirationDate = getExpirationDate(formData.rodzajZdarzenia as string, horseType);
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
  }, [formData.kon, type, horseType]);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
        // Odpowiednie formatowanie danych do wysyłki
        const formattedData = { ...formData };
        if (formattedData.kon) formattedData.kon = Number(formattedData.kon);
        if (formattedData.weterynarz) formattedData.weterynarz = Number(formattedData.weterynarz);
        if (formattedData.kowal) formattedData.kowal = Number(formattedData.kowal);
        if (formattedData.choroba) formattedData.choroba = Number(formattedData.choroba);
        if (formattedData.kon && (type === "zdarzenia_profilaktyczne" || type === "podkucia")) formattedData.konieId = [Number(formattedData.kon)];

      await formAction(formattedData);
      setSuccess("Zdarzenie zostało zaktualizowane!");
      const redirectType = type === "zdarzenia_profilaktyczne" ? "profilaktyczne" : type;
      setTimeout(() => navigate(`/wydarzenia/${id}/${redirectType}`), 1500);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const { title, fields, eventOptions } = eventTypes[type];

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-green-800 to-brown-600 p-6">
      <h2 className="text-3xl font-bold text-white mb-6">✏ {title}</h2>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        {fields.includes("weterynarz") && (
          <>
            <label className="block text-gray-700">👨‍⚕️ Wybierz weterynarza:</label>
            <select
              name="weterynarz"
              className="w-full p-2 border rounded mb-3"
              value={formData.weterynarz || ""}
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
              className="w-full p-2 border rounded mb-3"
              value={formData.kowal || ""}
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
              className="w-full p-2 border rounded mb-3"
              value={formData.choroba as string || ""}
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
              className="w-full p-2 border rounded mb-3"
              value = {formData.rodzajZdarzenia as string}
              onChange={handleInputChange}
            >
              <option value="">-- Wybierz rodzaj --</option>
              {eventOptions && eventOptions.map((type) => (
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
              className="w-full p-2 border rounded mb-3"
              value={formData.dataZdarzenia as string || ""}
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
              className="w-full p-2 border rounded mb-3"
              value={formData.dataRozpoczecia as string || ""}
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
              className="w-full p-2 border rounded mb-3"
              value={formData.dataZakonczenia as string || ""}
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
              className="w-full p-2 border rounded mb-3"
              value={formData.dataWaznosci as string || ""}
              onChange={handleInputChange}
            />
          </>
        )}

        {fields.includes("opisZdarzenia") && (
          <>
            <label className="block text-gray-700">📝 Opis zdarzenia:</label>
            <textarea
              name="opisZdarzenia"
              className="w-full p-2 border rounded mb-3"
              value={formData.opisZdarzenia as string || ""}
              onChange={handleInputChange}
            />
          </>
        )}

        <button
          type="submit"
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          ✅ Dodaj zdarzenie
        </button>
      </form>
    </div>
  );
}; 

export default BaseHorseEventForm;