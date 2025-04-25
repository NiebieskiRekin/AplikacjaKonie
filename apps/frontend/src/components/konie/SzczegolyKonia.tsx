import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { GoArrowRight, GoArrowLeft } from "react-icons/go";
import { IoMdCloseCircle } from "react-icons/io";
import { FaSpinner } from "react-icons/fa";
import { APIClient } from "@/frontend/lib/api-client";

type HorseDetails = {
  id: number;
  nazwa: string;
  numerPrzyzyciowy: string | null;
  numerChipa: string | null;
  rocznikUrodzenia: number | null;
  rodzajKonia: string;
  plec: string | null;
  dataPrzybyciaDoStajni: string | null;
  dataOdejsciaZeStajni: string | null;
  images_signed_urls: string[];
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

const default_img = "/horses/default.png";

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
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const imageDataCache = useRef<{ [url: string]: string }>({});
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingRemoveImage, setLoadingRemoveImage] = useState(false);
  const [showImagePopup, setShowImagePopup] = useState(false);

  const fetchHorseDetails = async () => {
    try {
      const response = await APIClient.api.konie[":id{[0-9]+}"].$get({
        param: { id: id! },
      });

      if (!response.ok) throw new Error("Błąd pobierania danych konia");

      const data = await response.json();

      setHorse(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    const fetchHorseEvents = async () => {
      try {
        // Pobieramy ostatnie 5 zdarzeń
        const response = await APIClient.api.konie[":id{[0-9]+}"].events.$get({
          param: { id: id! },
        });

        if (!response.ok) {
          const data = await response.json();
          console.log(data);
          throw new Error("Błąd pobierania zdarzeń");
        }

        const data = (await response.json()) as Event[];
        setEvents(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    const fetchActiveEvents = async () => {
      try {
        const response = await APIClient.api.konie[":id{[0-9]+}"][
          "active-events"
        ].$get({ param: { id: id! } });

        if (!response.ok) {
          throw new Error("Błąd pobierania aktywnych zdarzeń");
        } else {
          const data = await response.json();
          const formattedEvents: ActiveEvent[] = EVENT_TYPES.map((type) => {
            if (type === "Podkucie") {
              return {
                type,
                dataZdarzenia: data.podkucie?.dataZdarzenia || "Brak",
                dataWaznosci: data.podkucie?.dataWaznosci || "-",
              };
            } else {
              const profilaktyczneEvent = data.profilaktyczne.find(
                (e) => e.rodzajZdarzenia === type
              );
              return {
                type,
                dataZdarzenia: profilaktyczneEvent?.dataZdarzenia || "Brak",
                dataWaznosci: profilaktyczneEvent?.dataWaznosci || "-",
              };
            }
          });
          setActiveEvents(formattedEvents);
        }
      } catch (err) {
        setError((err as Error).message);
      }
    };

    Promise.allSettled([
      fetchActiveEvents(),
      fetchHorseDetails(),
      fetchHorseEvents(),
    ])
      .then(() => {})
      .catch(() => {});
  }, [id]); // TODO: specify missing dependency or use useCallback

  useEffect(() => {
    setIsImageLoaded(false);
    const loadImage = async () => {
      if (
        !horse ||
        !horse.images_signed_urls ||
        horse.images_signed_urls.length === 0
      ) {
        setIsImageLoaded(true);
        return;
      }

      const url = horse.images_signed_urls[currentImageIndex];
      if (imageDataCache.current[url]) {
        setIsImageLoaded(true);
        return;
      }

      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const dataUrl = await blobToDataURL(blob);
        imageDataCache.current[url] = dataUrl;
        setIsImageLoaded(true);
      } catch (err) {
        console.error("Błąd ładowania obrazu:", err);
      }
    };

    void loadImage();
  }, [currentImageIndex, horse]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!horse) return <p className="text-lg text-white">Ładowanie...</p>;

  const handleDeleteHorse = async () => {
    setLoadingDelete(true);
    try {
      const response = await APIClient.api.konie[":id{[0-9]+}"].$delete({
        param: { id: id! },
      });

      if (!response.ok) throw new Error("Nie udało się usunąć konia");

      setIsDeletePopupOpen(false);
      await navigate("/konie");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      horse.images_signed_urls &&
      prevIndex === horse.images_signed_urls.length - 1
        ? 0
        : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      horse.images_signed_urls && prevIndex === 0
        ? horse.images_signed_urls.length - 1
        : prevIndex - 1
    );
  };

  const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
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

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await APIClient.api.konie[":id{[0-9]+}"].upload.$post({
        param: { id: id! },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Błąd przesyłania zdjęcia");
      }

      const data = await response.json();
      const response_image_url_upload = await APIClient.api.images.upload[
        ":filename"
      ].$get({ param: { filename: data.image_uuid.id } });
      if (!response_image_url_upload.ok)
        throw new Error(
          "Błąd przy generowaniu odnośnika do przesłania zdjęcia"
        );
      const image_url_upload = await response_image_url_upload.json();

      const response_uploaded_image = await fetch(image_url_upload.url, {
        method: "PUT",
        body: file,
      });

      if (!response_uploaded_image.ok)
        throw new Error("Błąd przy przesyłaniu zdjęcia");

      setShowImagePopup(true);
      void (await fetchHorseDetails());
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleRemoveImage = async () => {
    if (
      !horse ||
      !horse.images_signed_urls ||
      horse.images_signed_urls.length === 0
    )
      return;

    const confirmed = confirm("Czy na pewno chcesz usunąć to zdjęcie?");
    if (!confirmed) return;

    const imageUrl = horse.images_signed_urls[currentImageIndex];

    setLoadingRemoveImage(true);
    try {
      const parts = imageUrl.split("/");
      const imageId = parts[parts.length - 1].split("?")[0]; // obcina query params
      console.log(parts);

      const response = await APIClient.api.konie[":id{[0-9]+}"][
        ":imageId{[A-Za-z0-9-]+}"
      ].$delete({ param: { id: id!, imageId: imageId } });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Błąd usuwania zdjęcia");
      }

      alert("Zdjęcie zostało usunięte!");
      void (await fetchHorseDetails());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingRemoveImage(false);
    }
  };

  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-6">
      <div className="relative mb-10 flex w-full max-w-7xl items-center justify-center sm:mb-6">
        <button
          onClick={() => void navigate("/konie")}
          className="absolute left-0 flex items-center gap-2 rounded-lg bg-gradient-to-r from-gray-500 to-gray-700 px-4 py-2 text-white transition sm:relative sm:mr-auto"
        >
          <GoArrowLeft className="text-xl" />
        </button>

        <h2 className="absolute left-1/2 -translate-x-1/2 transform text-center text-3xl font-bold text-white">
          {horse.nazwa}
        </h2>
      </div>
      <div className="flex w-full max-w-7xl flex-col gap-6 rounded-lg bg-white p-6 shadow-lg md:flex-row">
        <div className="flex-1">
          <h3 className="mb-4 text-xl font-bold text-green-900">
            🐎 Informacje o koniu
          </h3>

          <p className="text-gray-800">
            <strong>Numer przyżyciowy:</strong>{" "}
            {horse.numerPrzyzyciowy || "Nie podano"}
          </p>
          <p className="text-gray-800">
            <strong>Numer chipa:</strong> {horse.numerChipa || "Nie podano"}
          </p>
          <p className="text-gray-800">
            <strong>Rocznik urodzenia:</strong> {horse.rocznikUrodzenia}
          </p>
          <p className="text-gray-800">
            <strong>Rodzaj:</strong> {horse.rodzajKonia}
          </p>
          <p className="text-gray-800">
            <strong>Płeć:</strong>{" "}
            {horse.plec!.charAt(0).toUpperCase() + horse.plec!.slice(1)}
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
            onClick={() => void navigate(`/konie/${horse.id}/edit`)}
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
          {horse.images_signed_urls && horse.images_signed_urls.length > 1 && (
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
          {isImageLoaded ? (
            <img
              src={
                horse.images_signed_urls && horse.images_signed_urls.length > 0
                  ? (imageDataCache.current[
                      horse.images_signed_urls[currentImageIndex]
                    ] ?? default_img)
                  : default_img
              }
              alt={horse.nazwa}
              onClick={() => setIsImageModalOpen(true)}
              className="mb-4 h-64 w-64 cursor-pointer rounded-lg object-contain shadow-lg transition hover:scale-105"
            />
          ) : (
            <div className="mb-4 flex h-64 w-64 items-center justify-center rounded-lg bg-gray-200">
              <FaSpinner className="animate-spin text-4xl text-green-700" />
            </div>
          )}
          <div className="mt-2 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <label className="cursor-pointer rounded-lg bg-green-700 px-4 py-2 text-white transition hover:bg-green-800">
                ➕ Dodaj zdjęcie
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => void handleImageUpload(e)}
                />
              </label>
              {showImagePopup && (
                <div className="to-brown-600 fixed inset-0 flex items-center justify-center bg-gradient-to-br from-green-800">
                  <div className="rounded-lg bg-white p-6 text-center shadow-lg">
                    <p className="mb-4 text-lg font-bold text-green-600">
                      Zdjęcie dodane pomyślnie!
                    </p>
                    <button
                      onClick={() => setShowImagePopup(false)}
                      className="rounded-lg bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}

              {horse.images_signed_urls &&
                horse.images_signed_urls.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleRemoveImage()}
                    className={`flex h-10 w-10 items-center justify-center rounded-md transition ${
                      loadingRemoveImage
                        ? "cursor-not-allowed bg-red-400"
                        : "bg-red-600 hover:bg-red-700"
                    } text-white`}
                    title="Usuń zdjęcie"
                    disabled={loadingRemoveImage}
                  >
                    {loadingRemoveImage ? "..." : "🗑️"}
                  </button>
                )}
            </div>

            <button
              className="w-fit rounded-md bg-purple-600 px-6 py-2 text-white shadow-md transition hover:bg-purple-700"
              onClick={() => void navigate(`/konie/${horse.id}/stworz-raport`)}
            >
              📤 Stwórz raport
            </button>
          </div>
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
                src={
                  horse.images_signed_urls &&
                  horse.images_signed_urls.length > 0
                    ? horse.images_signed_urls[currentImageIndex]
                    : default_img
                }
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
                className={`rounded-lg px-4 py-2 text-white transition ${
                  loadingDelete
                    ? "cursor-not-allowed bg-red-400"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                onClick={() => void handleDeleteHorse()}
                disabled={loadingDelete}
              >
                {loadingDelete ? "Usuwanie..." : "Usuń"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-4">
        <Link
          to={`/wydarzenia/${id}/rozrody`}
          className="w-full rounded-lg bg-gradient-to-r from-green-500 to-green-700 px-4 py-2 font-semibold text-white shadow-md transition hover:from-green-600 hover:to-green-800 sm:w-auto sm:px-6 sm:py-3"
        >
          🐎 Rozrody
        </Link>
        <Link
          to={`/wydarzenia/${id}/choroby`}
          className="w-full rounded-lg bg-gradient-to-r from-red-500 to-red-700 px-4 py-2 font-semibold text-white shadow-md transition hover:from-red-600 hover:to-red-800 sm:w-auto sm:px-6 sm:py-3"
        >
          🤕 Choroby
        </Link>
        <Link
          to={`/wydarzenia/${id}/leczenia`}
          className="w-full rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-700 px-4 py-2 font-semibold text-white shadow-md transition hover:from-yellow-600 hover:to-yellow-800 sm:w-auto sm:px-6 sm:py-3"
        >
          💉 Leczenia
        </Link>
        <Link
          to={`/wydarzenia/${id}/profilaktyczne`}
          className="w-full rounded-lg bg-gradient-to-r from-fuchsia-500 to-fuchsia-700 px-4 py-2 font-semibold text-white shadow-md transition hover:from-fuchsia-600 hover:to-fuchsia-800 sm:w-auto sm:px-6 sm:py-3"
        >
          🏥 Zdarzenia profilaktyczne
        </Link>
        <Link
          to={`/wydarzenia/${id}/podkucia`}
          className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-2 font-semibold text-white shadow-md transition hover:from-blue-600 hover:to-blue-800 sm:w-auto sm:px-6 sm:py-3"
        >
          🧲 Podkucia
        </Link>
      </div>
    </div>
  );
}

export default KonieDetails;
