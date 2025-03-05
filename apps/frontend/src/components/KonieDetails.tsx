import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { GoArrowRight, GoArrowLeft } from "react-icons/go";
import { IoMdCloseCircle } from "react-icons/io";

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
  imageUrls?: string[];
};

type Event = {
  type: string;
  date: string;
  description: string;
};

type ActiveEvent = {
  type: string;
  dataZdarzenia: string;
  dataWaznosci?: string;
};

const EVENT_TYPES = [
  "Podkucie",
  "Odrobaczanie",
  "Podanie suplementów",
  "Szczepienie",
  "Dentysta",
];

function KonieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [horse, setHorse] = useState<HorseDetails | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState("");
  const [activeEvents, setActiveEvents] = useState<ActiveEvent[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);

  useEffect(() => {
    const fetchHorseDetails = async () => {
      try {
        const response = await fetch(`/api/konie/${id}`);

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Błąd pobierania danych konia");

        // tutaj będziesz trzeba pobierać wszystkie zdjęcia dla danego konia z db
        setHorse({
          ...data,
          imageUrls: [`/horses/${data.id}-1.jpg`, `/horses/${data.id}-2.jpg`],
        });
      } catch (err) {
        setError((err as Error).message);
      }
    };

    const fetchHorseEvents = async () => {
      try {
        // Pobieramy ostatnie 5 zdarzeń
        const response = await fetch(`/api/konie/${id}/events`);

        const data = await response.json();
        console.log(data);
        if (!response.ok)
          throw new Error(data.error || "Błąd pobierania zdarzeń");

        setEvents(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    const fetchActiveEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Brak tokena. Zaloguj się.");

        const response = await fetch(`/api/konie/${id}/active-events`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Błąd pobierania aktywnych zdarzeń");

        const formattedEvents: ActiveEvent[] = EVENT_TYPES.map((type) => {
          if (type === "Podkucie") {
            return {
              type,
              dataZdarzenia: data.podkucie?.dataZdarzenia || "Brak",
              dataWaznosci: data.podkucie?.dataWaznosci || "-",
            };
          } else {
            const profilaktyczneEvent = data.profilaktyczne.find(
              (e: any) => e.rodzajZdarzenia === type
            );
            return {
              type,
              dataZdarzenia: profilaktyczneEvent?.dataZdarzenia || "Brak",
              dataWaznosci: profilaktyczneEvent?.dataWaznosci || "-",
            };
          }
        });

        setActiveEvents(formattedEvents);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchActiveEvents();
    fetchHorseDetails();
    fetchHorseEvents();
  }, [id]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!horse) return <p className="text-lg text-white">Ładowanie...</p>;

  const handleDeleteHorse = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/konie/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Nie udało się usunąć konia");

      setIsDeletePopupOpen(false);
      navigate("/konie");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      horse.imageUrls && prevIndex === horse.imageUrls.length - 1
        ? 0
        : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      horse.imageUrls && prevIndex === 0
        ? horse.imageUrls.length - 1
        : prevIndex - 1
    );
  };

  const getDateColor = (dataWaznosci: string) => {
    if (dataWaznosci === "-" || dataWaznosci === "Brak") {
      return "text-red-600 font-bold";
    }

    const today = new Date();
    const expirationDate = new Date(dataWaznosci);
    const differenceInDays = Math.ceil(
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (differenceInDays <= 0) {
      return "text-red-600 font-bold";
    } else if (differenceInDays <= 7) {
      return "text-yellow-600 font-bold";
    } else {
      return "text-green-600 font-bold";
    }
  };

  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-6">
      <h2 className="mb-6 text-3xl font-bold text-white">{horse.nazwa}</h2>

      <div className="flex w-full max-w-7xl flex-col gap-6 rounded-lg bg-white p-6 shadow-lg md:flex-row">
        <div className="flex-1">
          <h3 className="mb-4 text-xl font-bold text-green-900">
            🐎 Informacje o koniu
          </h3>

          <p className="text-gray-800">
            <strong>Numer przyżyciowy:</strong> {horse.numerPrzyzyciowy}
          </p>
          <p className="text-gray-800">
            <strong>Numer chipa:</strong> {horse.numerChipa}
          </p>
          <p className="text-gray-800">
            <strong>Rocznik urodzenia:</strong> {horse.rocznikUrodzenia}
          </p>
          <p className="text-gray-800">
            <strong>Rodzaj:</strong> {horse.rodzajKonia}
          </p>
          <p className="text-gray-800">
            <strong>Płeć:</strong> {horse.plec}
          </p>
          <p className="text-gray-800">
            <strong>Data przybycia do stajni:</strong>{" "}
            {horse.dataPrzybyciaDoStajni || "Brak danych"}
          </p>
          <p className="text-gray-800">
            <strong>Data odejścia ze stajni:</strong>{" "}
            {horse.dataOdejsciaZeStajni || "Koń nadal w hodowli"}
          </p>

          <button
            className="mt-4 block w-full rounded-lg bg-yellow-600 px-6 py-3 text-white shadow-md transition hover:bg-yellow-700"
            onClick={() => navigate(`/konie/${horse.id}/edit`)}
          >
            ✏️ Edytuj dane
          </button>

          <button
            className="mt-4 block w-full rounded-lg bg-blue-600 px-6 py-3 text-white shadow-md transition hover:bg-blue-700"
            onClick={() => setIsModalOpen(true)}
          >
            📅 Ostatnie zdarzenia
          </button>

          <button
            className="mt-4 block w-full rounded-lg bg-red-600 px-6 py-3 text-white shadow-md transition hover:bg-red-700"
            onClick={() => setIsDeletePopupOpen(true)}
          >
            🗑️ Usuń konia
          </button>
        </div>

        <div className="relative flex flex-1 flex-col items-center">
          {horse.imageUrls && horse.imageUrls.length > 1 && (
            <>
              <button
                className="bg-opacity-50 hover:bg-opacity-75 absolute top-1/2 left-3 -translate-y-1/2 transform rounded-full bg-green-700 px-2 py-1 text-3xl font-bold text-white transition"
                onClick={prevImage}
              >
                <GoArrowLeft />
              </button>
              <button
                className="bg-opacity-50 hover:bg-opacity-75 absolute top-1/2 right-3 -translate-y-1/2 transform rounded-full bg-green-700 px-2 py-1 text-3xl font-bold text-white transition"
                onClick={nextImage}
              >
                <GoArrowRight />
              </button>
            </>
          )}
          <img
            src={horse.imageUrls?.[currentImageIndex]}
            alt={horse.nazwa}
            onError={(e) => (e.currentTarget.src = "/horses/default.jpg")}
            onClick={() => setIsImageModalOpen(true)}
            className="mb-4 h-64 w-64 cursor-pointer rounded-lg object-contain shadow-lg transition hover:scale-105"
          />
          <label className="cursor-pointer rounded-lg bg-green-700 px-4 py-2 text-white transition hover:bg-green-800">
            ➕ Dodaj zdjęcie
            <input type="file" className="hidden" />
          </label>
        </div>

        {isImageModalOpen && (
          <div className="bg-opacity-80 fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
            <div className="relative flex w-full max-w-3xl flex-col items-center">
              <button
                className="absolute top-4 right-4 rounded-full bg-red-600 px-4 py-2 text-lg font-bold text-white"
                onClick={() => setIsImageModalOpen(false)}
              >
                <IoMdCloseCircle />
              </button>
              <img
                src={horse.imageUrls?.[currentImageIndex]}
                alt="Powiększone zdjęcie"
                className="h-auto max-h-[90vh] w-full rounded-lg object-contain"
              />
            </div>
          </div>
        )}

        <div className="flex-1">
          <h3 className="mb-4 text-xl font-bold text-blue-700">
            ✅ Aktywne zdarzenia
          </h3>
          <ul className="rounded-lg bg-gray-100 p-4 shadow-md">
            {activeEvents.length > 0 ? (
              activeEvents.map((event, index) => (
                <li key={index} className="border-b py-2">
                  <strong>{event.type}:</strong>
                  <br />
                  <span className={getDateColor(event.dataWaznosci || "")}>
                    Ważne do {event.dataWaznosci}
                  </span>
                </li>
              ))
            ) : (
              <p className="text-gray-600">Brak aktywnych zdarzeń</p>
            )}
          </ul>
        </div>
      </div>

      {isModalOpen && (
        <div className="bg-opacity-30 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-xl font-bold text-red-700">
              📅 Ostatnie zdarzenia
            </h3>
            <ul className="rounded-lg bg-gray-100 p-4 shadow-md">
              {events.length > 0 ? (
                events.map((event, index) => (
                  <li key={index} className="border-b py-2">
                    {event.date} - {event.type}: {event.description}
                  </li>
                ))
              ) : (
                <p className="text-gray-600">Brak zdarzeń</p>
              )}
            </ul>
            <button
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
              onClick={() => setIsModalOpen(false)}
            >
              Zamknij
            </button>
          </div>
        </div>
      )}

      {isDeletePopupOpen && (
        <div className="bg-opacity-10 fixed inset-0 flex items-center justify-center backdrop-blur-sm">
          <div className="rounded-lg bg-white p-6 text-center shadow-lg">
            <p className="mb-4 text-lg font-bold text-red-600">
              Czy na pewno chcesz usunąć konia?
            </p>
            <p className="text-gray-700">Ta operacja jest nieodwracalna.</p>

            <div className="mt-6 flex gap-4">
              <button
                className="rounded-lg bg-gray-400 px-4 py-2 text-white transition hover:bg-gray-500"
                onClick={() => setIsDeletePopupOpen(false)}
              >
                Anuluj
              </button>
              <button
                className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
                onClick={handleDeleteHorse}
              >
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-4">
        <button className="w-full rounded-lg bg-green-600 px-4 py-2 text-white shadow-md transition hover:bg-green-700 sm:w-auto sm:px-6 sm:py-3">
          🐎 Rozrody
        </button>
        <button className="w-full rounded-lg bg-red-600 px-4 py-2 text-white shadow-md transition hover:bg-red-700 sm:w-auto sm:px-6 sm:py-3">
          🤕 Choroby
        </button>
        <button className="w-full rounded-lg bg-amber-600 px-4 py-2 text-white shadow-md transition hover:bg-amber-700 sm:w-auto sm:px-6 sm:py-3">
          💉 Leczenia
        </button>
        <button className="w-full rounded-lg bg-fuchsia-600 px-4 py-2 text-white shadow-md transition hover:bg-fuchsia-700 sm:w-auto sm:px-6 sm:py-3">
          🏥 Zdarzenia profilaktyczne
        </button>
        <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white shadow-md transition hover:bg-blue-700 sm:w-auto sm:px-6 sm:py-3">
          🧲 Podkucia
        </button>
      </div>
    </div>
  );
}

export default KonieDetails;
