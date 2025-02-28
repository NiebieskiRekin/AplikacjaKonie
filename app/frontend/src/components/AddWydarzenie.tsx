import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";

const eventTypes = {
  podkucie: "Podkucie",
  odrobaczanie: "Odrobaczanie",
  "podanie-witamin": "Podanie suplementów",
  szczepienia: "Szczepienie",
  dentysta: "Dentysta",
};

const singularHorseTypes: Record<string, string> = {
    "Konie hodowlane": "Koń hodowlany",
    "Konie rekreacyjne": "Koń rekreacyjny",
    "Źrebaki": "Źrebak",
    "Konie sportowe": "Koń sportowy",
  };

type Horse = { id: number; nazwa: string; rodzajKonia: string };
type Person = { id: number; imieINazwisko: string };

function AddEvent() {
  const { type } = useParams();
  const navigate = useNavigate();

  const [horses, setHorses] = useState<Horse[]>([]);
  const [selectedHorses, setSelectedHorses] = useState<number[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState("");
  const [date, setDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Brak tokena. Zaloguj się.");

        const horsesRes = await fetch("/api/konie", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const horsesData = await horsesRes.json();
        if (!horsesRes.ok) throw new Error(horsesData.error || "Błąd pobierania koni");

        setHorses(horsesData);

        const peopleType = type === "podkucie" ? "kowale" : "weterynarze";
        const peopleRes = await fetch(`/api/${peopleType}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const peopleData = await peopleRes.json();
        if (!peopleRes.ok) throw new Error(peopleData.error || "Błąd pobierania osób");

        setPeople(peopleData);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchData();
  }, [type]);

  const handleSelectAllHorses = () => {
    if (selectedHorses.length === horses.length) {
      setSelectedHorses([]);
    } else {
      setSelectedHorses(horses.map((horse) => horse.id));
    }
  };

  const handleSelectByType = (rodzajKonia: string) => {
    const selectedByType = horses
      .filter((horse) => horse.rodzajKonia === rodzajKonia)
      .map((horse) => horse.id);

    setSelectedHorses((prev) =>
      selectedByType.every((id) => prev.includes(id))
        ? prev.filter((id) => !selectedByType.includes(id))
        : [...prev, ...selectedByType]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Brak tokena. Zaloguj się.");

      const payload = {
        konie: selectedHorses,
        dataZdarzenia: date,
        dataWaznosci: validUntil || null,
        ...(type === "podkucie"
          ? { kowal: Number(selectedPerson) }
          : {
              weterynarz: Number(selectedPerson),
              opisZdarzenia: description,
              rodzajZdarzenia: eventTypes[type as keyof typeof eventTypes],
            }),
      };

      const singularTypes: Record<string, string> = {
        podkucia: "podkucie",
        "zdarzenie-profilaktyczne": "zdarzenie-profilaktyczne",
        dentysta: "zdarzenie-profilaktyczne",
        "podanie-witamin": "zdarzenie-profilaktyczne",
        szczepienia: "zdarzenie-profilaktyczne",
        odrobaczanie: "zdarzenie-profilaktyczne",
      };

      const correctedType = type && singularTypes[type] ? singularTypes[type] : type;

      const response = await fetch(`/api/wydarzenia/${correctedType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Błąd dodawania zdarzenia");

      alert("Zdarzenie zostało dodane!");
      navigate("/wydarzenia");
    } catch (err) {
      setError((err as Error).message);
    }
};


  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-green-800 to-brown-600 p-6">
      <h2 className="text-3xl font-bold text-white mb-6">
        ➕ Dodaj {eventTypes[type as keyof typeof eventTypes] || "Zdarzenie"}
      </h2>
      {error && <p className="text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        {/* Wybór koni */}
        <label className="block text-gray-700">🐴 Wybierz konie:</label>
            <div className="flex gap-2 mb-2">
            <button type="button" className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleSelectAllHorses}>
                Wszystkie konie
            </button>
            {Array.from(new Set(horses.map((h) => h.rodzajKonia))).map((rodzaj) => (
                <button
                key={rodzaj}
                type="button"
                className="bg-purple-600 text-white px-3 py-1 rounded"
                onClick={() => handleSelectByType(rodzaj)}
                >
                {rodzaj}
                </button>
            ))}
            </div>
            <div className="max-h-40 overflow-y-auto border p-2 mb-3">
                {horses.map((horse) => (
                    <div key={horse.id} className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id={`horse-${horse.id}`}
                        checked={selectedHorses.includes(horse.id)}
                        onChange={() =>
                        setSelectedHorses((prev) =>
                            prev.includes(horse.id) ? prev.filter((id) => id !== horse.id) : [...prev, horse.id]
                        )
                        }
                    />
                    <label htmlFor={`horse-${horse.id}`}>
                        {horse.nazwa} ({singularHorseTypes[horse.rodzajKonia] || horse.rodzajKonia})
                    </label>
                    </div>
                ))}
            </div>

        {/* Wybór weterynarza lub kowala */}
        <label className="block text-gray-700">
          {type === "podkucie" ? "🛠 Wybierz kowala:" : "👨‍⚕️ Wybierz weterynarza:"}
        </label>
        <select className="w-full p-2 border rounded mb-3" value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)}>
          <option value="">-- Wybierz osobę --</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.imieINazwisko}
            </option>
          ))}
        </select>

        <label className="block text-gray-700">📅 Data zdarzenia:</label>
        <input
        type="date"
        className="w-full p-2 border rounded mb-3"
        value={date}
        onChange={(e) => {
            const newDate = e.target.value;
            setDate(newDate);

            const calculatedDate = new Date(newDate);

            const selectedHorseTypes = horses
            .filter((horse) => selectedHorses.includes(horse.id))
            .map((horse) => horse.rodzajKonia);

            const allSportHorses = selectedHorseTypes.length > 0 && selectedHorseTypes.every((t) => t === "Konie sportowe");
            const hasRecreationalOrSportHorses = selectedHorseTypes.some((t) => t === "Konie rekreacyjne" || t === "Konie sportowe");

            if (type === "podanie-witamin" || type === "odrobaczanie") {
                calculatedDate.setMonth(calculatedDate.getMonth() + 6); // +6 miesięcy
            } else if (type === "dentysta") {
                calculatedDate.setFullYear(calculatedDate.getFullYear() + 1); // +1 rok
            } else if (type === "szczepienia") {
                if (allSportHorses) {
                    calculatedDate.setMonth(calculatedDate.getMonth() + 6); // +6 miesięcy dla koni sportowych
                } else {
                    calculatedDate.setFullYear(calculatedDate.getFullYear() + 1); // +1 rok dla innych koni
                }
            } else if (type === "podkucie") {
                if (hasRecreationalOrSportHorses) {
                    calculatedDate.setDate(calculatedDate.getDate() + 42); // +6 tygodni dla koni rekreacyjnych i sportowych
                } else {
                    calculatedDate.setDate(calculatedDate.getDate() + 84); // +12 tygodni dla pozostałych koni
                }
            }

            setValidUntil(calculatedDate.toISOString().split("T")[0]); // Format YYYY-MM-DD
        }}
        />

        <label className="block text-gray-700">⏳ Ważne do:</label>
        <input
        type="date"
        className="w-full p-2 border rounded mb-3"
        value={validUntil}
        onChange={(e) => setValidUntil(e.target.value)}
        />

        {type !== "podkucie" && (
          <>
            <label className="block text-gray-700">📝 Opis zdarzenia:</label>
            <textarea className="w-full p-2 border rounded mb-3" value={description} onChange={(e) => setDescription(e.target.value)} />
          </>
        )}

        <button type="submit" className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          ✅ Dodaj zdarzenie
        </button>
      </form>
    </div>
  );
}

export default AddEvent;