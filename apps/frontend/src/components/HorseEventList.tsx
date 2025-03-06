import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

type Event = {
  id: number;
  nazwaKonia: string;
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
        if (!response.ok)
          throw new Error(data.error || "Błąd pobierania danych");
        setEvents(data);
        console.log(response);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    fetchEvents();
  }, [id, type]);

  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-4 md:p-6">
      <h2 className="mb-6 text-3xl font-bold text-white">
        📅 {type.charAt(0).toUpperCase() + type.replace("_", " ").slice(1)}{" "}
        Konia:{" "}
        {events.length > 0
          ? events[0].nazwaKonia.charAt(0).toUpperCase() +
            events[0].nazwaKonia.slice(1)
          : "Brak danych"}
      </h2>
      {error && <p className="text-red-600">{error}</p>}

      <button
        onClick={() => navigate(`/wydarzenia/add/${id}/${type}`)}
        className="mb-4 rounded-lg bg-green-600 px-6 py-3 text-white shadow-md transition hover:bg-green-700"
      >
        ➕ Dodaj nowe wydarzenie
      </button>

      <div className="w-full max-w-5xl overflow-x-auto rounded-lg bg-white p-4 shadow-lg md:p-6">
        <table className="w-full min-w-[700px] border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 px-4 py-2">
                📅 Data Zdarzenia
              </th>
              {["choroby"].includes(type) && (
                <th className="border border-gray-300 px-4 py-2">
                  ⏳ Data zakończenia
                </th>
              )}
              {["zdarzenia_profilaktyczne", "podkucia"].includes(type) && (
                <th className="border border-gray-300 px-4 py-2">
                  ⏳ Data ważności
                </th>
              )}
              {["leczenia", "rozrody", "zdarzenia_profilaktyczne"].includes(
                type.toLowerCase()
              ) && (
                <th className="border border-gray-300 px-4 py-2">
                  👨‍⚕️ Weterynarz
                </th>
              )}
              {type.toLowerCase() === "podkucia" && (
                <th className="border border-gray-300 px-4 py-2">🧲 Kowal</th>
              )}
              {type.toLowerCase() === "leczenia" && (
                <th className="border border-gray-300 px-4 py-2">🤒 Choroba</th>
              )}
              {["rozrody", "zdarzenia_profilaktyczne"].includes(
                type.toLowerCase()
              ) && (
                <th className="border border-gray-300 px-4 py-2">
                  📋 Rodzaj zdarzenia
                </th>
              )}
              {[
                "rozrody",
                "zdarzenia_profilaktyczne",
                "choroby",
                "leczenia",
              ].includes(type.toLowerCase()) && (
                <th className="border border-gray-300 px-4 py-2">📝 Opis</th>
              )}
            </tr>
          </thead>
          <tbody>
            {events.length > 0 ? (
              events.map((event) => (
                <tr
                  key={event.id}
                  className="text-center transition hover:bg-gray-100"
                >
                  <td className="border border-gray-300 px-4 py-2">
                    {["choroby"].includes(type)
                      ? event.dataRozpoczecia
                      : [
                            "rozrody",
                            "podkucia",
                            "leczenia",
                            "zdarzenia_profilaktyczne",
                          ].includes(type)
                        ? event.dataZdarzenia || "Brak danych"
                        : "Brak informacji"}
                  </td>
                  {["choroby"].includes(type) && (
                    <td className="border border-gray-300 px-4 py-2">
                      {event.dataZakonczenia ? (
                        event.dataZakonczenia
                      ) : (
                        <span className="text-red-600 font-bold">Niewyleczona</span>
                      )}
                    </td>
                  )}
                  {["zdarzenia_profilaktyczne", "podkucia"].includes(type) && (
                    <td className="border border-gray-300 px-4 py-2">
                      {(() => {
                        const today = new Date();
                        const expirationDate = event.dataWaznosci ? new Date(event.dataWaznosci) : null;

                        let textColor = "text-green-600"; // Domyślnie zielony

                        if (!expirationDate || expirationDate <= today) {
                          textColor = "text-red-600 font-bold";
                        } else if (expirationDate && (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= 7) {
                          textColor = "text-orange-400 font-bold";
                        }

                        return <span className={textColor}>{event.dataWaznosci || "Brak danych"}</span>;
                      })()}
                    </td>
                  )}
                  {["leczenia", "rozrody", "zdarzenia_profilaktyczne"].includes(
                    type
                  ) && (
                    <td className="border border-gray-300 px-4 py-2">
                      {event.weterynarz || "Brak danych"}
                    </td>
                  )}
                  {type === "podkucia" && (
                    <td className="border border-gray-300 px-4 py-2">
                      {event.kowal || "Brak danych"}
                    </td>
                  )}
                  {type === "leczenia" && (
                    <td className="border border-gray-300 px-4 py-2">
                      {event.choroba || "Brak danych"}
                    </td>
                  )}
                  {["rozrody", "zdarzenia_profilaktyczne"].includes(type) && (
                    <td className="border border-gray-300 px-4 py-2">
                      {event.rodzajZdarzenia || "Brak danych"}
                    </td>
                  )}
                  {[
                    "rozrody",
                    "zdarzenia_profilaktyczne",
                    "choroby",
                    "leczenia",
                  ].includes(type) && (
                    <td className="border border-gray-300 px-4 py-2">
                      {event.opisZdarzenia || "Brak danych"}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-600">
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
