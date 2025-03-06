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

    useEffect(() => {
        let calculatedValidity = "";

        if (type === "szczepienia") {
            calculatedValidity = "6 miesięcy - Sportowe\n12 miesięcy - Pozostałe";
        } else if (type === "dentysta") {
            calculatedValidity = "6 miesięcy - Sportowe i Rekreacyjne\n12 miesięcy - Źrebaki i Hodowlane";
        } else if (type === "podanie-witamin" || type === "odrobaczanie") {
            calculatedValidity = "6 miesięcy";
        } else if (type === "podkucie") {
            calculatedValidity = "6 tygodni - Sportowe i Rekreacyjne\n12 tygodni - Hodowlane i Źrebaki";
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
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Brak tokena. Zaloguj się.");

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
        <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-green-800 to-brown-600 p-6">
            <h2 className="text-3xl font-bold text-white mb-6">
                ➕ Dodaj {eventTypes[type as keyof typeof eventTypes] || "Zdarzenie"}
            </h2>
            {error && <p className="text-red-600">{error}</p>}

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <label className="block text-gray-700 mb-2">🐴 Wybierz konie:</label>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 mb-4">
                    <button type="button" className="px-4 py-2 text-white font-semibold rounded-lg shadow-md bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition w-full sm:w-auto" onClick={handleSelectAllHorses}>
                        Wszystkie konie
                    </button>
                    {Array.from(new Set(horses.map((h) => h.rodzajKonia))).map((rodzaj) => (
                        <button
                            key={rodzaj}
                            type="button"
                            className="px-4 py-2 text-white font-semibold rounded-lg shadow-md w-full sm:w-auto transition"
                            style={{
                                background: `linear-gradient(90deg, ${getButtonColor(rodzaj)[0]}, ${getButtonColor(rodzaj)[1]})`,
                              }}
                            onClick={() => handleSelectByType(rodzaj)}
                        >
                            {rodzaj}
                        </button>
                    ))}
                </div>

                <div className="relative mb-4">
                    <button
                        type="button"
                        className="w-full bg-gray-200 px-4 py-2 rounded-lg shadow"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        {selectedHorses.length > 0
                            ? `Wybrano ${selectedHorses.length} koni`
                            : "Kliknij, aby wybrać konie"}
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute w-full bg-white border mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                            {horses.map((horse) => (
                                <div key={horse.id} className="flex items-center gap-2 p-2">
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
                                    <label htmlFor={`horse-${horse.id}`} className="text-gray-700">
                                        {horse.nazwa} ({singularHorseTypes[horse.rodzajKonia] || horse.rodzajKonia})
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
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
                    }}
                />

                <label className="block text-gray-700">⏳ Ważne przez:</label>
                <p className="text-gray-700 font-semibold">
                    {(validityText ?? "").split("\n").map((line, index) => (
                        <span key={index} className="block">{line}</span>
                    ))}
                </p>

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