import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";

type HorseDetails = {
  id: number;
  nazwa: string;
  numerPrzyzyciowy: string;
  numerChipa: string;
  rocznikUrodzenia: number;
  rodzajKonia: string;
  plec: string;
  dataPrzybyciaDoStajni: string | null;
  dataOdejsciaZeStajni: string | null;
  imageUrl?: string;
};

type Event = {
  type: string;
  date: string;
  description: string;
};

function KonieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [horse, setHorse] = useState<HorseDetails | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHorseDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Brak tokena. Zaloguj się.");

        const response = await fetch(`/api/konie/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Błąd pobierania danych konia");

        setHorse({
          ...data,
          imageUrl: `/horses/${data.id}.jpg`,
        });
      } catch (err) {
        setError((err as Error).message);
      }
    };

    const fetchHorseEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Brak tokena. Zaloguj się.");

        // Pobieramy ostatnie 5 zdarzeń
        const response = await fetch(`/api/konie/${id}/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        console.log(data);
        if (!response.ok) throw new Error(data.error || "Błąd pobierania zdarzeń");

        setEvents(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchHorseDetails();
    fetchHorseEvents();
  }, [id]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!horse) return <p className="text-white text-lg">Ładowanie...</p>;

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-green-800 to-brown-600 p-6">
      <h2 className="text-3xl font-bold text-white mb-6">{horse.nazwa}</h2>

      <div className="w-full max-w-7xl bg-white p-6 rounded-lg shadow-lg flex flex-col md:flex-row gap-6">
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-green-900 mb-4">🐎 Informacje o koniu</h3>

          <p className="text-gray-800"><strong>Numer przyżyciowy:</strong> {horse.numerPrzyzyciowy}</p>
          <p className="text-gray-800"><strong>Numer chipa:</strong> {horse.numerChipa}</p>
          <p className="text-gray-800"><strong>Rocznik urodzenia:</strong> {horse.rocznikUrodzenia}</p>
          <p className="text-gray-800"><strong>Rodzaj:</strong> {horse.rodzajKonia}</p>
          <p className="text-gray-800"><strong>Płeć:</strong> {horse.plec}</p>
          <p className="text-gray-800"><strong>Data przybycia do stajni:</strong> {horse.dataPrzybyciaDoStajni || "Brak danych"}</p>
          <p className="text-gray-800"><strong>Data odejścia ze stajni:</strong> {horse.dataOdejsciaZeStajni || "Koń nadal w hodowli"}</p>

          <button
            className="mt-4 px-6 py-3 bg-yellow-600 text-white rounded-lg shadow-md hover:bg-yellow-700 transition"
            onClick={() => navigate(`/konie/${horse.id}/edit`)}
          >
            ✏️ Edytuj dane
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center">
          <img
            src={horse.imageUrl}
            alt={horse.nazwa}
            onError={(e) => (e.currentTarget.src = "/horses/default.jpg")}
            className="w-64 h-64 object-contain rounded-lg shadow-lg mb-4"
          />
          <label className="cursor-pointer bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition">
            ➕ Dodaj zdjęcie
            <input type="file" className="hidden" />
          </label>
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-bold text-red-700 mb-4">📅 Ostatnie zdarzenia</h3>
          <ul className="bg-gray-100 p-4 rounded-lg shadow-md">
            {events.length > 0 ? (
              events.map((event, index) => (
                <li key={index} className="border-b py-2">
                  <span className="text-sm font-bold text-gray-700">{event.date} - {event.type}</span>
                  <p className="text-gray-600">
                  {event.type === "podkucie" && event.description
                    ? `Ważne do: `
                    : ""}
                    {event.description}</p>
                </li>
              ))
            ) : (
              <p className="text-gray-600">Brak zdarzeń</p>
            )}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <button className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition">
            🐎 Rozrody
        </button>
        <button className="px-6 py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition">
            🤕 Choroby
        </button>
        <button className="px-6 py-3 bg-amber-600 text-white rounded-lg shadow-md hover:bg-amber-700 transition">
            💉 Leczenia
        </button>
        <button className="px-6 py-3 bg-fuchsia-600 text-white rounded-lg shadow-md hover:bg-fuchsia-700 transition">
            🏥 Zdarzenia profilaktyczne
        </button>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition">
            🧲 Podkucia
        </button>
      </div>
    </div>
  );
}

export default KonieDetails;
