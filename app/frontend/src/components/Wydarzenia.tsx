import { useEffect, useState } from "react";

type Event = {
  horse: string;
  date: string;
  rodzajZdarzenia: string;
  dataWaznosci: string;
  osobaImieNazwisko: string;
  opisZdarzenia: string;
};

const ITEMS_PER_PAGE = 25;

function StajniaEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState("");
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState(""); 
  const [page, setPage] = useState(1); 

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/wydarzenia");

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Błąd pobierania wydarzeń");

        setEvents(data);
        setFilteredEvents(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    const filtered = events.filter(
      (event) =>
        event.horse.toLowerCase().includes(search.toLowerCase()) ||
        event.rodzajZdarzenia.toLowerCase().includes(search.toLowerCase()) ||
        event.osobaImieNazwisko.toLowerCase().includes(search.toLowerCase()) ||
        event.opisZdarzenia.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredEvents(filtered);
    setPage(1);
  }, [search, events]);

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentEvents = filteredEvents.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-green-800 to-brown-600 p-4 md:p-6">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">📅 Wydarzenia w stajni</h2>
      {error && <p className="text-red-600">{error}</p>}

      <div className="mb-4 flex flex-wrap justify-center gap-2 sm:gap-4 w-full max-w-5xl">
        <button
          onClick={() => (window.location.href = "/wydarzenia/add/podkucie")}
          className="px-4 py-2 sm:px-6 sm:py-3 text-white font-semibold rounded-lg shadow-md bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 transition w-full sm:w-auto"
        >
          ➕ Podkucia
        </button>
        <button
          onClick={() => (window.location.href = "/wydarzenia/add/dentysta")}
          className="px-4 py-2 sm:px-6 sm:py-3 text-white font-semibold rounded-lg shadow-md bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition w-full sm:w-auto"
        >
          ➕ Dentysta
        </button>
        <button
          onClick={() => (window.location.href = "/wydarzenia/add/podanie-witamin")}
          className="px-4 py-2 sm:px-6 sm:py-3 text-white font-semibold rounded-lg shadow-md bg-gradient-to-r from-yellow-500 to-yellow-700 hover:from-yellow-600 hover:to-yellow-800 transition w-full sm:w-auto"
        >
          ➕ Podanie Witamin
        </button>
        <button
          onClick={() => (window.location.href = "/wydarzenia/add/szczepienia")}
          className="px-4 py-2 sm:px-6 sm:py-3 text-white font-semibold rounded-lg shadow-md bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 transition w-full sm:w-auto"
        >
          ➕ Szczepienia
        </button>
        <button
          onClick={() => (window.location.href = "/wydarzenia/add/odrobaczanie")}
          className="px-4 py-2 sm:px-6 sm:py-3 text-white font-semibold rounded-lg shadow-md bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 transition w-full sm:w-auto"
        >
          ➕ Odrobaczanie
        </button>
      </div>

      <div className="w-full max-w-4xl mb-4">
        <input
          type="text"
          placeholder="Wyszukaj zdarzenie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 rounded-lg shadow-md border border-gray-300 focus:ring focus:ring-green-500"
        />
      </div>

      <div className="w-full max-w-5xl bg-white p-4 md:p-6 rounded-lg shadow-lg overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 min-w-[700px]">
          <thead>
            <tr className="bg-gray-200">
                <th className="border border-gray-300 px-2 md:px-4 py-2">📅 Data</th>
              <th className="border border-gray-300 px-2 md:px-4 py-2">🐎 Koń</th>
              <th className="border border-gray-300 px-2 md:px-4 py-2">🔍 Rodzaj zdarzenia</th>
              <th className="border border-gray-300 px-2 md:px-4 py-2">⏳ Ważne do</th>
              <th className="border border-gray-300 px-2 md:px-4 py-2">👤 Weterynarz / Kowal</th>
              <th className="border border-gray-300 px-2 md:px-4 py-2">📝 Opis</th>
            </tr>
          </thead>
          <tbody>
            {currentEvents.length > 0 ? (
              currentEvents.map((event, index) => (
                <tr key={index} className="text-center hover:bg-gray-100 transition">
                  <td className="border border-gray-300 px-2 md:px-4 py-2">{event.date}</td>
                  <td className="border border-gray-300 px-2 md:px-4 py-2">{event.horse}</td>
                  <td className="border border-gray-300 px-2 md:px-4 py-2">{event.rodzajZdarzenia}</td>
                  <td className="border border-gray-300 px-2 md:px-4 py-2">{event.dataWaznosci}</td>
                  <td className="border border-gray-300 px-2 md:px-4 py-2">{event.osobaImieNazwisko}</td>
                  <td className="border border-gray-300 px-2 md:px-4 py-2">{event.opisZdarzenia}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-gray-600 py-4">
                  Brak wydarzeń
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center mt-6 gap-4">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 transition disabled:opacity-50"
        >
          ⬅ Poprzednia
        </button>
        <span className="text-white">Strona {page} z {Math.ceil(filteredEvents.length / ITEMS_PER_PAGE)}</span>
        <button
          onClick={() => setPage((prev) => (prev * ITEMS_PER_PAGE < filteredEvents.length ? prev + 1 : prev))}
          disabled={page * ITEMS_PER_PAGE >= filteredEvents.length}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 transition disabled:opacity-50"
        >
          Następna ➡
        </button>
      </div>
    </div>
  );
}

export default StajniaEvents;