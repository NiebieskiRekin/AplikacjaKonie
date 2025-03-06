import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
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

const EVENT_TYPES = ["Podkucie", "Odrobaczanie", "Podanie suplementów", "Szczepienie", "Dentysta"];

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
        if (!response.ok) throw new Error(data.error || "Błąd pobierania danych konia");

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
        if (!response.ok) throw new Error(data.error || "Błąd pobierania zdarzeń");

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
        if (!response.ok) throw new Error(data.error || "Błąd pobierania aktywnych zdarzeń");

        const formattedEvents: ActiveEvent[] = EVENT_TYPES.map((type) => {
          if (type === "Podkucie") {
            return {
              type,
              dataZdarzenia: data.podkucie?.dataZdarzenia || "Brak",
              dataWaznosci: data.podkucie?.dataWaznosci || "-",
            };
          } else {
            const profilaktyczneEvent = data.profilaktyczne.find((e: any) => e.rodzajZdarzenia === type);
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
  if (!horse) return <p className="text-white text-lg">Ładowanie...</p>;

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
      horse.imageUrls && prevIndex === horse.imageUrls.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      horse.imageUrls && prevIndex === 0 ? horse.imageUrls.length - 1 : prevIndex - 1
    );
  };

  const getDateColor = (dataWaznosci: string) => {
    if (dataWaznosci === "-" || dataWaznosci === "Brak") {
      return "text-red-600 font-bold";
    }

    const today = new Date();
    const expirationDate = new Date(dataWaznosci);
    const differenceInDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (differenceInDays <= 0) {
      return "text-red-600 font-bold";
    } else if (differenceInDays <= 7) {
      return "text-yellow-600 font-bold";
    } else {
      return "text-green-600 font-bold";
    }
  };

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
            className="mt-4 px-6 py-3 bg-yellow-600 text-white rounded-lg shadow-md hover:bg-yellow-700 transition block w-full"
            onClick={() => navigate(`/konie/${horse.id}/edit`)}
          >
            ✏️ Edytuj dane
          </button>

          <button
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition block w-full"
            onClick={() => setIsModalOpen(true)}
          >
            📅 Ostatnie zdarzenia
          </button>

          <button
            className="mt-4 px-6 py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition block w-full"
            onClick={() => setIsDeletePopupOpen(true)}
          >
            🗑️ Usuń konia
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center relative">
          {horse.imageUrls && horse.imageUrls.length > 1 && (
            <>
              <button
                className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-green-700 bg-opacity-50 text-white px-2 py-1 rounded-full text-3xl font-bold hover:bg-opacity-75 transition"
                onClick={prevImage}
              >
                <GoArrowLeft />
              </button>
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-green-700 bg-opacity-50 text-white px-2 py-1 rounded-full text-3xl font-bold hover:bg-opacity-75 transition"
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
            className="w-64 h-64 object-contain rounded-lg shadow-lg mb-4 cursor-pointer hover:scale-105 transition"
          />
          <label className="cursor-pointer bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition">
            ➕ Dodaj zdjęcie
            <input type="file" className="hidden" />
          </label>
        </div>

        {isImageModalOpen && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex justify-center items-center z-50">
            <div className="relative max-w-3xl w-full flex flex-col items-center">
              <button
                className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full text-lg font-bold"
                onClick={() => setIsImageModalOpen(false)}
              >
                <IoMdCloseCircle />
              </button>
              <img
                src={horse.imageUrls?.[currentImageIndex]}
                alt="Powiększone zdjęcie"
                className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
              />
            </div>
          </div>
        )}

        <div className="flex-1">
          <h3 className="text-xl font-bold text-blue-700 mb-4">✅ Aktywne zdarzenia</h3>
          <ul className="bg-gray-100 p-4 rounded-lg shadow-md">
            {activeEvents.length > 0 ? activeEvents.map((event, index) => (
              <li key={index} className="border-b py-2">
                <strong>{event.type}:</strong>
                <br />
                <span className={getDateColor(event.dataWaznosci || "")}>
                  Ważne do {event.dataWaznosci}
                </span>
              </li>
            )) : <p className="text-gray-600">Brak aktywnych zdarzeń</p>}
          </ul>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0  bg-opacity-30 backdrop-blur-lg flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold text-red-700 mb-4">📅 Ostatnie zdarzenia</h3>
            <ul className="bg-gray-100 p-4 rounded-lg shadow-md">
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
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              onClick={() => setIsModalOpen(false)}
            >
              Zamknij
            </button>
          </div>
        </div>
      )}

      {isDeletePopupOpen && (
        <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex justify-center items-center">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <p className="text-red-600 text-lg font-bold mb-4">Czy na pewno chcesz usunąć konia?</p>
            <p className="text-gray-700">Ta operacja jest nieodwracalna.</p>

            <div className="flex gap-4 mt-6">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition"
                onClick={() => setIsDeletePopupOpen(false)}
              >
                Anuluj
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                onClick={handleDeleteHorse}
              >
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-4">
        <Link
          to={`/wydarzenia/${id}/rozrody`}
          className="px-4 py-2 sm:px-6 sm:py-3 text-white font-semibold rounded-lg shadow-md bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 transition w-full sm:w-auto"
        >
          🐎 Rozrody
        </Link>
        <Link
          to={`/wydarzenia/${id}/choroby`}
          className="px-4 py-2 sm:px-6 sm:py-3 text-white font-semibold rounded-lg shadow-md bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 transition w-full sm:w-auto"
        >
          🤕 Choroby
        </Link>
        <Link
          to={`/wydarzenia/${id}/leczenia`}
          className="px-4 py-2 sm:px-6 sm:py-3 text-white font-semibold rounded-lg shadow-md bg-gradient-to-r from-yellow-500 to-yellow-700 hover:from-yellow-600 hover:to-yellow-800 transition w-full sm:w-auto"
        >
          💉 Leczenia
        </Link>
        <Link
          to={`/wydarzenia/${id}/profilaktyczne`}
          className="px-4 py-2 sm:px-6 sm:py-3 text-white font-semibold rounded-lg shadow-md bg-gradient-to-r from-fuchsia-500 to-fuchsia-700 hover:from-fuchsia-600 hover:to-fuchsia-800 transition w-full sm:w-auto"
        >
          🏥 Zdarzenia profilaktyczne
        </Link>
        <Link
          to={`/wydarzenia/${id}/podkucia`}
          className="px-4 py-2 sm:px-6 sm:py-3 text-white font-semibold rounded-lg shadow-md bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition w-full sm:w-auto"
        >
          🧲 Podkucia
        </Link>
      </div>
    </div>
  );
}

export default KonieDetails;
