import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

type Event = {
  id: number;
  dataRozpoczecia: string;
  dataZdarzenia?: string; // rozrody
  opisZdarzenia?: string;
  dataZakonczenia?: string;
  weterynarz?: string;
  kowal?: string;
  choroba?: string;
  rodzajZdarzenia?: string;
  dataWaznosci?: string;
};

function HorseEventList({ type }: { type: string }) {
  const { id } = useParams(); // Pobieramy ID konia z URL
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`/api/wydarzenia/${id}/${type}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Błąd pobierania danych");
        setEvents(data);
        console.log(response);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    fetchEvents();
  }, [id, type]);


  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-green-800 to-brown-600 p-4 md:p-6">
      <h2 className="text-3xl font-bold text-white mb-6">📅 {type} dla konia {id}</h2>
      {error && <p className="text-red-600">{error}</p>}

      <button
        onClick={() => navigate(`/wydarzenia/add/${id}/${type}`)}
        className="mb-4 px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition"
      >
        ➕ Dodaj nowe wydarzenie
      </button>

      <div className="w-full max-w-5xl bg-white p-4 md:p-6 rounded-lg shadow-lg overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 min-w-[700px]">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 px-4 py-2">📅 Data Rozpoczęcia</th>
              {["choroby"].includes(type) && (
                <th className="border border-gray-300 px-4 py-2">⏳ Data zakończenia</th>
              )}
              {["zdarzenia_profilaktyczne", "podkucia"].includes(type) && (
                <th className="border border-gray-300 px-4 py-2">⏳ Data ważności</th>
              )}
              {["leczenia", "rozrody", "zdarzenia_profilaktyczne"].includes(type.toLowerCase()) && (
                <th className="border border-gray-300 px-4 py-2">👨‍⚕️ Weterynarz</th>
              )}
              {type.toLowerCase() === "podkucia" && (
                <th className="border border-gray-300 px-4 py-2">🧲 Kowal</th>
              )}
              {type.toLowerCase() === "leczenia" && (
                <th className="border border-gray-300 px-4 py-2">🤒 Choroba</th>
              )}
              {["rozrody", "zdarzenia_profilaktyczne"].includes(type.toLowerCase()) && (
                <th className="border border-gray-300 px-4 py-2">📋 Rodzaj zdarzenia</th>
              )}
              {["rozrody", "zdarzenia_profilaktyczne", "choroby", "leczenia"].includes(type.toLowerCase()) && (
                <th className="border border-gray-300 px-4 py-2">📝 Opis</th>
              )}
            </tr>
          </thead>
          <tbody>
            {events.length > 0 ? (
              events.map((event) => (
                <tr key={event.id} className="text-center hover:bg-gray-100 transition">
                  <td className="border border-gray-300 px-4 py-2">
                    {["choroby"].includes(type)
                      ? event.dataRozpoczecia
                      : ["rozrody", "podkucia", "leczenia", "zdarzenia_profilaktyczne"].includes(type)
                      ? event.dataZdarzenia || "Brak danych"
                      : "Brak informacji"}
                  </td>
                  {["choroby"].includes(type) && (
                    <td className="border border-gray-300 px-4 py-2">{event.dataZakonczenia || "Brak danych"}</td>
                  )}
                  {["zdarzenia_profilaktyczne", "podkucia"].includes(type) && (
                    <td className="border border-gray-300 px-4 py-2">{event.dataWaznosci || "Brak danych"}</td>
                  )}
                  {["leczenia", "rozrody", "zdarzenia_profilaktyczne"].includes(type) && (
                    <td className="border border-gray-300 px-4 py-2">{event.weterynarz || "Brak danych"}</td>
                  )}
                  {type === "podkucia" && (
                    <td className="border border-gray-300 px-4 py-2">{event.kowal || "Brak danych"}</td>
                  )}
                  {type === "leczenia" && (
                    <td className="border border-gray-300 px-4 py-2">{event.choroba || "Brak danych"}</td>
                  )}
                  {["rozrody", "zdarzenia_profilaktyczne"].includes(type) && (
                    <td className="border border-gray-300 px-4 py-2">{event.rodzajZdarzenia || "Brak danych"}</td>
                  )}
                  {["rozrody", "zdarzenia_profilaktyczne", "choroby", "leczenia"].includes(type) && (
                    <td className="border border-gray-300 px-4 py-2">{event.opisZdarzenia || "Brak danych"}</td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-gray-600 py-4 text-center">
                  Brak wydarzeń
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HorseEventList;