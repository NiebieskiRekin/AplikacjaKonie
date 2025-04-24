import { APIClient } from "@/frontend/lib/api-client";
import type { BackendTypes } from "@aplikacja-konie/api-client";
import type { RodzajKonia } from "@aplikacja-konie/backend/schema";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { GoArrowLeft } from "react-icons/go";

const eventTypes = {
  podkucie: "Podkucie",
  odrobaczanie: "Odrobaczanie",
  "podanie-witamin": "Podanie suplementów",
  szczepienia: "Szczepienie",
  dentysta: "Dentysta",
};

type EventType = keyof typeof eventTypes;

const singularHorseTypes: Record<string, string> = {
  "Konie hodowlane": "Koń hodowlany",
  "Konie rekreacyjne": "Koń rekreacyjny",
  Źrebaki: "Źrebak",
  "Konie sportowe": "Koń sportowy",
};

type Horse = { id: number; nazwa: string; rodzajKonia: RodzajKonia };
type Person = { id: number; imieINazwisko: string };

function AddEvent() {
  const { type } = useParams();

  const [horses, setHorses] = useState<Horse[]>([]);
  const [selectedHorses, setSelectedHorses] = useState<number[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [validityText, setValidityText] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // 🔽 Stan dla rozwijanej listy
  const navigate = useNavigate();

  useEffect(() => {
    if (type === "szczepienia") {
      setDescription("grypa-tężec");
    }
  }, [type]);

  // TODO: why fetch all horses and people to just add an event???
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response1 = await APIClient.api.konie.$get();

        if (response1.ok) {
          const horsesData = await response1.json();
          setHorses(horsesData.data);
        } else {
          throw new Error("Błąd pobierania koni");
        }

        if (type === "podkucie") {
          const peopleRes = await APIClient.api.kowale.$get();
          if (peopleRes.ok) {
            const peopleData = await peopleRes.json();
            setPeople(peopleData);
          } else {
            const peopleData = await peopleRes.json();
            throw new Error(peopleData.error || "Błąd pobierania kowali");
          }
        } else {
          const peopleRes = await APIClient.api.weterynarze.$get();
          if (peopleRes.ok) {
            const peopleData = await peopleRes.json();
            setPeople(peopleData);
          } else {
            const peopleData = await peopleRes.json();
            throw new Error(peopleData.error || "Błąd pobierania weterynarzy");
          }
        }
      } catch (err) {
        setError((err as Error).message);
      }
    };

    void fetchData();
  }, [type]);

  useEffect(() => {
    let calculatedValidity = "";

    // TODO: refactor duration of events to another, external function
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
      if (type === "podkucia") {
        const payload = {
          konieId: selectedHorses,
          dataZdarzenia: date,
          kowal: Number(selectedPerson),
        };

        const response = await APIClient.api.wydarzenia.podkucie.$post({
          json: payload,
        });

        if (response.ok) {
          alert("Zdarzenie zostało dodane!");
          await navigate("/wydarzenia");
        } else {
          throw new Error("Błąd dodawania zdarzenia");
        }
      } else {
        const payload = {
          konieId: selectedHorses,
          dataZdarzenia: date,
          weterynarz: Number(selectedPerson),
          opisZdarzenia: description,
          rodzajZdarzenia: eventTypes[
            type as EventType
          ] as BackendTypes.RodzajZdarzeniaProfilaktycznego,
        };

        const response = await APIClient.api.wydarzenia[
          "zdarzenia_profilaktyczne"
        ].$post({ json: payload });

        if (response.ok) {
          alert("Zdarzenie zostało dodane!");
          await navigate("/wydarzenia");
        } else {
          throw new Error("Błąd dodawania zdarzenia");
        }
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const getButtonColor = (rodzaj: RodzajKonia): [string, string] => {
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
      <div className="relative mb-10 flex w-full max-w-7xl items-center justify-center sm:mb-6">
        <button
          onClick={() => void navigate(`/wydarzenia`)}
          className="absolute left-0 flex items-center gap-2 rounded-lg bg-gradient-to-r from-gray-500 to-gray-700 px-4 py-2 text-white transition sm:relative sm:mr-auto"
        >
          <GoArrowLeft className="text-xl" />
        </button>

        <h2 className="absolute left-1/2 -translate-x-1/2 transform text-center text-3xl font-bold text-white">
          ➕ Dodaj {eventTypes[type as keyof typeof eventTypes] || "Zdarzenie"}
        </h2>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <form
        onSubmit={(e) => void handleSubmit(e)}
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
              : "cursor-not-allowed bg-gray-400"
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
