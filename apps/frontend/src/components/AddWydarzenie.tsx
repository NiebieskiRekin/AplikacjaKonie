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
  Źrebaki: "Źrebak",
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
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [validityText, setValidityText] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // 🔽 Stan dla rozwijanej listy

  useEffect(() => {
    if (type === "szczepienia") {
      setDescription("grypa-tężec");
    }
  }, [type]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const horsesRes = await fetch("/api/konie/wydarzenia");
        const horsesData = await horsesRes.json();
        if (!horsesRes.ok)
          throw new Error(horsesData.error || "Błąd pobierania koni");

        setHorses(horsesData);

        const peopleType = type === "podkucie" ? "kowale" : "weterynarze";
        const peopleRes = await fetch(`/api/${peopleType}`);
        const peopleData = await peopleRes.json();
        if (!peopleRes.ok)
          throw new Error(peopleData.error || "Błąd pobierania osób");

        setPeople(peopleData);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchData();
  }, [type]);

  useEffect(() => {
    let calculatedValidity = "";

    if (type === "szczepienia") {
      calculatedValidity = "6 miesięcy - Sportowe\n12 miesięcy - Pozostałe";
    } else if (type === "dentysta") {
      calculatedValidity =
        "6 miesięcy - Sportowe i Rekreacyjne\n12 miesięcy - Źrebaki i Hodowlane";
    } else if (type === "podanie-witamin" || type === "odrobaczanie") {
      calculatedValidity = "6 miesięcy";
    } else if (type === "podkucie") {
      calculatedValidity =
        "6 tygodni - Sportowe i Rekreacyjne\n12 tygodni - Hodowlane i Źrebaki";
    }

    setValidityText(calculatedValidity);
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
      const payload = {
        konieId: selectedHorses,
        dataZdarzenia: date,
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

      const correctedType =
        type && singularTypes[type] ? singularTypes[type] : type;

      const response = await fetch(`/api/wydarzenia/${correctedType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Błąd dodawania zdarzenia");

      alert("Zdarzenie zostało dodane!");
      navigate("/wydarzenia");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const getButtonColor = (rodzaj: string): [string, string] => {
    switch (rodzaj) {
      case "Konie hodowlane":
        return ["#ff8c00", "#ff4500"];
      case "Konie rekreacyjne":
        return ["#1e90ff", "#0066cc"];
      case "Źrebaki":
        return ["#32cd32", "#008000"];
      case "Konie sportowe":
        return ["#ff1493", "#c71585"];
      default:
        return ["#808080", "#505050"];
    }
  };

  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-6">
      <h2 className="mb-6 text-3xl font-bold text-white">
        ➕ Dodaj {eventTypes[type as keyof typeof eventTypes] || "Zdarzenie"}
      </h2>
      {error && <p className="text-red-600">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
      >
        <label className="mb-2 block text-gray-700">🐴 Wybierz konie:</label>
        <div className="mb-4 flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4">
          <button
            type="button"
            className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-2 font-semibold text-white shadow-md transition hover:from-blue-600 hover:to-blue-800 sm:w-auto"
            onClick={handleSelectAllHorses}
          >
            Wszystkie konie
          </button>
          {Array.from(new Set(horses.map((h) => h.rodzajKonia))).map(
            (rodzaj) => (
              <button
                key={rodzaj}
                type="button"
                className="w-full rounded-lg px-4 py-2 font-semibold text-white shadow-md transition sm:w-auto"
                style={{
                  background: `linear-gradient(90deg, ${getButtonColor(rodzaj)[0]}, ${getButtonColor(rodzaj)[1]})`,
                }}
                onClick={() => handleSelectByType(rodzaj)}
              >
                {rodzaj}
              </button>
            )
          )}
        </div>

        <div className="relative mb-4">
          <button
            type="button"
            className="w-full rounded-lg bg-gray-200 px-4 py-2 shadow"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {selectedHorses.length > 0
              ? `Liczba wybranych Koni: ${selectedHorses.length}`
              : "Kliknij, aby wybrać konie"}
          </button>

          {isDropdownOpen && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
              {horses.map((horse) => (
                <div key={horse.id} className="flex items-center gap-2 p-2">
                  <input
                    type="checkbox"
                    id={`horse-${horse.id}`}
                    checked={selectedHorses.includes(horse.id)}
                    onChange={() =>
                      setSelectedHorses((prev) =>
                        prev.includes(horse.id)
                          ? prev.filter((id) => id !== horse.id)
                          : [...prev, horse.id]
                      )
                    }
                  />
                  <label
                    htmlFor={`horse-${horse.id}`}
                    className="text-gray-700"
                  >
                    {horse.nazwa} (
                    {singularHorseTypes[horse.rodzajKonia] || horse.rodzajKonia}
                    )
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wybór weterynarza lub kowala */}
        <label className="block text-gray-700">
          {type === "podkucie"
            ? "🛠 Wybierz kowala:"
            : "👨‍⚕️ Wybierz weterynarza:"}
        </label>
        <select
          className="mb-3 w-full rounded border p-2"
          value={selectedPerson}
          onChange={(e) => setSelectedPerson(e.target.value)}
        >
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
          className="mb-3 w-full rounded border p-2"
          value={date}
          onChange={(e) => {
            const newDate = e.target.value;
            setDate(newDate);
          }}
        />

        <label className="block text-gray-700">⏳ Ważne przez:</label>
        <p className="font-semibold text-gray-700">
          {(validityText ?? "").split("\n").map((line, index) => (
            <span key={index} className="block">
              {line}
            </span>
          ))}
        </p>

        {type !== "podkucie" && (
          <>
            <label className="block text-gray-700">📝 Opis zdarzenia:</label>
            <textarea
              className="mb-3 w-full rounded border p-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </>
        )}

        <button
          type="submit"
          className={`w-full rounded-lg py-3 text-white transition ${
            selectedHorses.length > 0
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={selectedHorses.length <= 0}
        >
          ✅ Dodaj zdarzenie
        </button>
      </form>
    </div>
  );
}

export default AddEvent;
