import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

type EventType = "rozrody" | "leczenia" | "choroby" | "zdarzenia_profilaktyczne" | "podkucia";

const eventTypes: Record<EventType, { title: string; fields: string[]; apiEndpoint: string; eventOptions?: string[] }> = {
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
    apiEndpoint: "zdarzenie-profilaktyczne",
    eventOptions: ["Szczepienia", "Odrobaczanie", "Podanie suplementów", "Dentysta"],
  },
  podkucia: {
    title: "Dodaj podkucie",
    fields: ["kon", "kowal", "dataZdarzenia", "dataWaznosci"],
    apiEndpoint: "podkucie",
  },
};
function AddHorseEvent() {
  const navigate = useNavigate();
  const { id, type } = useParams<{ id: string; type: EventType }>(); 
  const [horseType, setHorseType] = useState("");
  const [formData, setFormData] = useState<{ [key: string]: string | number | number[] | null}>({ kon: id || "" });
  const [people, setPeople] = useState<{ id: string; imieINazwisko: string }[]>([]); // Weterynarze/Kowale
  const [choroba, setChoroba] = useState<{ id: string; opisZdarzenia: string }[]>([]); // Choroby
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!type || !eventTypes[type]) {
      setError("Nieznany typ wydarzenia.");
      return;
    }

    if (!formData.dataZdarzenia) {
        setFormData((prev) => ({
          ...prev,
          dataZdarzenia: new Date().toISOString().split("T")[0], // Ustawienie wartości początkowej
        }));
      }

    const fetchPeople = async () => {
      try {
        const response = await fetch(type === "podkucia" ? "/api/kowale" : "/api/weterynarze"); // można to zoptymalizować, żeby np. dla choroby nie pobierać.
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Błąd pobierania danych");
        setPeople(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    const fetchChoroba = async () => {
        if (type === "leczenia") {
          try {
            const response = await fetch(`/api/konie/choroby/${id}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Błąd pobierania danych");
            setChoroba(data);
          } catch (err) {
            setError((err as Error).message);
          }
        }
      };

    const fetchHorseType = async () => {
        try {
            const response = await fetch(`/api/konie/${id}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Błąd pobierania danych");
            setHorseType(data.rodzajKonia);
        } catch (err) {
            setError((err as Error).message);
        }
    };

    fetchPeople();
    fetchChoroba();
    fetchHorseType();
  }, [type, id]);

  const getExpirationDate = (eventType: string) => {
    const baseDate = new Date();
    const expirationRules: Record<string, number> = {
      "Szczepienia": horseType == "Konie sportowe" ? 180 : 365, // +6 miesięcy dla koni sportowych, +1 rok dla innych
      "Odrobaczanie": 180,       // +6 miesięcy
      "Podanie suplementów": 180, // +6 miesiące
      "Dentysta": horseType == "Konie sportowe" || horseType == "Konie rekreacyjne" ? 180 : 365, // +6 miesięcy dla koni sportowych i rekreacyjnych, +1 rok dla innych
    };

    let daysToAdd = 365; 
    if (type == "zdarzenia_profilaktyczne") {
        daysToAdd = expirationRules[eventType] || 365;
    } else if (type == "podkucia") {
        daysToAdd = horseType == "Konie sportowe" || horseType == "Konie rekreacyjne" ? 42 : 84;
    }
    baseDate.setDate(baseDate.getDate() + daysToAdd);
  
    return baseDate.toISOString().split("T")[0];
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value };

      if (name === "rodzajZdarzenia" && type === "zdarzenia_profilaktyczne") {
        updatedData.dataWaznosci = getExpirationDate(value);
      }

      return updatedData;
    });
  };

  useEffect(() => {
    if (type === "zdarzenia_profilaktyczne" && formData.rodzajZdarzenia) {
      setFormData((prev) => ({
        ...prev,
        dataWaznosci: getExpirationDate(formData.rodzajZdarzenia as string),
      }));
    }
  }, [formData.rodzajZdarzenia, type]);

  useEffect(() => {
    if (type === "podkucia" && !formData.dataWaznosci) {
      setFormData((prev) => ({
        ...prev,
        dataWaznosci: getExpirationDate(""),
      }));
    }
  }, [formData.kon, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!type || !eventTypes[type]) {
      return setError("Nieznany typ wydarzenia.");
    }
    const eventConfig = eventTypes[type];

    try {
        const formattedData = { ...formData };
        if (formattedData.kon) formattedData.kon = Number(formattedData.kon);
        if (formattedData.weterynarz) formattedData.weterynarz = Number(formattedData.weterynarz);
        if (formattedData.kowal) formattedData.kowal = Number(formattedData.kowal);
        if (formattedData.choroba) formattedData.choroba = Number(formattedData.choroba);
        if (formattedData.dataZakonczenia) formattedData.dataZakonczenia = null;
        if (formattedData.dataZdarzenia) formattedData.dataZdarzenia = new Date().toISOString().split("T")[0];
        if (formattedData.kon && (type === "zdarzenia_profilaktyczne" || type === "podkucia")) formattedData.konieId = [Number(formattedData.kon)];

      const response = await fetch(`/api/wydarzenia/${eventConfig.apiEndpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Błąd dodawania wydarzenia");

      setSuccess("Zdarzenie zostało dodane!");
      const redirectType = type === "zdarzenia_profilaktyczne" ? "profilaktyczne" : type;
      setTimeout(() => navigate(`/wydarzenia/${id}/${redirectType}`), 1500); // Przekierowanie
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!type || !eventTypes[type]) {
    return <p className="text-red-600">Nieznany typ wydarzenia.</p>;
  }

  const { title, fields, eventOptions } = eventTypes[type];

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-green-800 to-brown-600 p-6">
      <h2 className="text-3xl font-bold text-white mb-6">➕ {title}</h2>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        {fields.includes("weterynarz") && (
          <>
            <label className="block text-gray-700">👨‍⚕️ Wybierz weterynarza:</label>
            <select
              name="weterynarz"
              className="w-full p-2 border rounded mb-3"
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
}

export default AddHorseEvent;
