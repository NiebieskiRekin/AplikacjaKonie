import { APIClient } from "@/frontend/lib/api-client";
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

  const [sortConfig, setSortConfig] = useState<{
    key: keyof Event | null;
    direction: "asc" | "desc";
  }>({
    key: null,
    direction: "asc",
  });

  // const [filters, setFilters] = useState({
  //   horse: "",
  //   date: "",
  //   rodzajZdarzenia: "",
  //   dataWaznosci: "",
  //   osobaImieNazwisko: "",
  //   opisZdarzenia: "",
  // });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await APIClient.api.wydarzenia.$get();

        if (response.ok) {
          const data = (await response.json()) as Event[];
          setEvents(data);
          setFilteredEvents(data);
        } else {
          throw new Error("Błąd pobierania wydarzeń");
        }
      } catch (err) {
        setError((err as Error).message);
      }
    };

    void fetchEvents();
  }, []);

  const handleSort = (key: keyof Event) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    const sortedData = [...filteredEvents].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredEvents(sortedData);
    setSortConfig({ key, direction });
  };

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

  const getRowClass = (dataWaznosci: string) => {
    if (!dataWaznosci) return "";

    const today = new Date();
    const expirationDate = new Date(dataWaznosci);
    const differenceInDays = Math.ceil(
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (differenceInDays <= 0) return "text-red-500 font-bold";
    if (differenceInDays <= 7) return "text-yellow-400";
    return "";
  };

  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-4 md:p-6">
      <h2 className="mb-6 text-center text-3xl font-bold text-white">
        📅 Wydarzenia w stajni
      </h2>
      {error && <p className="text-red-600">{error}</p>}

      <div className="mb-4 flex w-full max-w-5xl flex-wrap justify-center gap-2 sm:gap-4">
        <button
          onClick={() => (window.location.href = "/wydarzenia/add/podkucie")}
          className="w-full rounded-lg bg-gradient-to-r from-green-500 to-green-700 px-4 py-2 font-semibold text-white shadow-md transition hover:from-green-600 hover:to-green-800 sm:w-auto sm:px-6 sm:py-3"
        >
          ➕ Podkucia
        </button>
        <button
          onClick={() => (window.location.href = "/wydarzenia/add/dentysta")}
          className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-2 font-semibold text-white shadow-md transition hover:from-blue-600 hover:to-blue-800 sm:w-auto sm:px-6 sm:py-3"
        >
          ➕ Dentysta
        </button>
        <button
          onClick={() =>
            (window.location.href = "/wydarzenia/add/podanie-witamin")
          }
          className="w-full rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-700 px-4 py-2 font-semibold text-white shadow-md transition hover:from-yellow-600 hover:to-yellow-800 sm:w-auto sm:px-6 sm:py-3"
        >
          ➕ Podanie Suplementów
        </button>
        <button
          onClick={() => (window.location.href = "/wydarzenia/add/szczepienia")}
          className="w-full rounded-lg bg-gradient-to-r from-red-500 to-red-700 px-4 py-2 font-semibold text-white shadow-md transition hover:from-red-600 hover:to-red-800 sm:w-auto sm:px-6 sm:py-3"
        >
          ➕ Szczepienia
        </button>
        <button
          onClick={() =>
            (window.location.href = "/wydarzenia/add/odrobaczanie")
          }
          className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-purple-700 px-4 py-2 font-semibold text-white shadow-md transition hover:from-purple-600 hover:to-purple-800 sm:w-auto sm:px-6 sm:py-3"
        >
          ➕ Odrobaczanie
        </button>
      </div>

      <div className="mb-4 w-full max-w-4xl">
        <input
          type="text"
          placeholder="Wyszukaj zdarzenie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 shadow-md focus:ring focus:ring-green-500"
        />
      </div>

      <div className="w-full max-w-7xl overflow-x-auto rounded-lg bg-white p-4 shadow-lg md:p-6">
        <table className="w-full min-w-[700px] border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              {[
                { key: "date", label: "📅 Data" },
                { key: "horse", label: "🐎 Koń" },
                { key: "rodzajZdarzenia", label: "🔍 Rodzaj zdarzenia" },
                { key: "dataWaznosci", label: "⏳ Ważne do" },
                { key: "osobaImieNazwisko", label: "👤 Weterynarz / Kowal" },
                { key: "opisZdarzenia", label: "📝 Opis" },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="cursor-pointer border border-gray-300 px-2 py-2 hover:bg-gray-300 md:px-4"
                  onClick={() => handleSort(key as keyof Event)}
                >
                  {label}{" "}
                  {sortConfig.key === key
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : "⇅"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentEvents.length > 0 ? (
              currentEvents.map((event, index) => (
                <tr
                  key={index}
                  className={`text-center transition hover:bg-gray-100 ${getRowClass(event.dataWaznosci)}`}
                >
                  <td className="border border-gray-300 px-2 py-2 md:px-4">
                    {event.date}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 md:px-4">
                    {event.horse}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 md:px-4">
                    {event.rodzajZdarzenia}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 md:px-4">
                    {event.dataWaznosci}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 md:px-4">
                    {event.osobaImieNazwisko}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 md:px-4">
                    {event.opisZdarzenia}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-4 text-gray-600">
                  Brak wydarzeń
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="rounded-lg bg-gray-600 px-4 py-2 text-white shadow-md transition hover:bg-gray-700 disabled:opacity-50"
        >
          ⬅ Poprzednia
        </button>
        <span className="text-white">
          Strona {page} z {Math.ceil(filteredEvents.length / ITEMS_PER_PAGE)}
        </span>
        <button
          onClick={() =>
            setPage((prev) =>
              prev * ITEMS_PER_PAGE < filteredEvents.length ? prev + 1 : prev
            )
          }
          disabled={page * ITEMS_PER_PAGE >= filteredEvents.length}
          className="rounded-lg bg-gray-600 px-4 py-2 text-white shadow-md transition hover:bg-gray-700 disabled:opacity-50"
        >
          Następna ➡
        </button>
      </div>
    </div>
  );
}

export default StajniaEvents;
