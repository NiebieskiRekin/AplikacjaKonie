import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ArrowRight, ArrowLeft, XCircle } from "lucide-react";
import { APIClient } from "../../lib/api-client";
import { FaSmile, FaMeh, FaFrown } from "react-icons/fa";

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
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingRemoveImage, setLoadingRemoveImage] = useState(false);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [showConfirmDeleteImagePopup, setShowConfirmDeleteImagePopup] =
    useState(false);
  const [pendingDeleteImageId, setPendingDeleteImageId] = useState<
    string | null
  >(null);
  const [loadingImageUpload, setLoadingImageUpload] = useState(false);

  const fetchHorseDetails = async () => {
    try {
      const response = await APIClient.api.konie[":id{[0-9]+}"].$get({
        param: { id: id! },
      });

      if (!response.ok) throw new Error("Błąd pobierania danych konia");

      const data = await response.json();
      setHorse(data);
    } catch (err) {
      setError((err as Error).message || "Błąd pobierania danych konia");
    }
  };

  useEffect(() => {
    const fetchHorseEvents = async () => {
      try {
        const response = await APIClient.api.konie[":id{[0-9]+}"].events.$get({
          param: { id: id! },
        });

        if (!response.ok) throw new Error("Błąd pobierania zdarzeń");

        const data = (await response.json()) as Event[];
        setEvents(data);
      } catch (err) {
        setError((err as Error).message || "Błąd pobierania zdarzeń konia");
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
              const profilaktyczne = Array.isArray(data.profilaktyczne)
                ? data.profilaktyczne
                : [];
              const profilaktyczneEvent = profilaktyczne.find(
                (e: { rodzajZdarzenia: string }) => e.rodzajZdarzenia === type
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
        setError((err as Error).message || "Błąd pobierania aktywnych zdarzeń");
      }
    };

    void Promise.allSettled([
      fetchActiveEvents(),
      fetchHorseDetails(),
      fetchHorseEvents(),
    ]);
  }, [id]);

  // Reset loading state when index changes
  useEffect(() => {
    if (
      horse &&
      horse.images_signed_urls &&
      horse.images_signed_urls.length > 0
    ) {
      setIsImageLoaded(false);
    } else {
      setIsImageLoaded(true); // No image to load, so we are "done"
    }
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
      setLoadingDelete(false);
      setError((err as Error).message || "Błąd usuwania konia");
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

  const getDateStatus = (dataWaznosci: string) => {
    // Stan domyślny: Brak daty lub błąd (Smutna buźka)
    const fallback = {
      classes: "text-red-600 font-bold",
      icon: <FaFrown className="mr-1 inline" />,
    };

    if (dataWaznosci === "-" || dataWaznosci === "Brak") {
      return fallback;
    }

    const today = new Date();
    const expirationDate = new Date(dataWaznosci);
    const differenceInDays = Math.ceil(
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (differenceInDays <= 0) {
      // Po terminie - Smutna buźka
      return {
        classes: "text-red-600 font-bold",
        icon: <FaFrown className="mr-1 inline" />,
      };
    } else if (differenceInDays <= 7) {
      // Kończy się (do 7 dni) - Neutralna buźka
      return {
        classes: "text-yellow-600 font-bold",
        icon: <FaMeh className="mr-1 inline" />,
      };
    } else {
      // Dużo czasu - Uśmiechnięta buźka
      return {
        classes: "text-green-600 font-bold",
        icon: <FaSmile className="mr-1 inline" />,
      };
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError("Nie wybrano pliku.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Rozmiar zdjęcia przekracza 5MB.");
      return;
    }

    setLoadingImageUpload(true);

    // Don't send the file in FormData to the first endpoint.
    // We just trigger the intent to upload to get a UUID.
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
      ].$get({
        param: { filename: data.image_uuid.id },
        query: { contentType: file.type },
      });

      if (!response_image_url_upload.ok)
        throw new Error(
          "Błąd przy generowaniu odnośnika do przesłania zdjęcia"
        );

      const image_url_upload = await response_image_url_upload.json();
      const response_uploaded_image = await fetch(image_url_upload.url, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!response_uploaded_image.ok)
        throw new Error("Błąd przy przesyłaniu zdjęcia do chmury");

      setShowImagePopup(true);
      void (await fetchHorseDetails());
    } catch (err) {
      setError((err as Error).message || "Błąd przesyłania zdjęcia");
    } finally {
      setLoadingImageUpload(false);
    }
  };

  const handleRemoveImage = () => {
    if (
      !horse ||
      !horse.images_signed_urls ||
      horse.images_signed_urls.length === 0
    )
      return;

    const imageUrl = horse.images_signed_urls[currentImageIndex];
    const parts = imageUrl.split("/");
    const imageId = parts[parts.length - 1].split("?")[0];

    setPendingDeleteImageId(imageId);
    setShowConfirmDeleteImagePopup(true);
  };

  const confirmDeleteImage = async () => {
    if (!pendingDeleteImageId) return;

    setLoadingRemoveImage(true);
    try {
      const response = await APIClient.api.konie[":id{[0-9]+}"][
        ":imageId{[A-Za-z0-9-]+}"
      ].$delete({ param: { id: id!, imageId: pendingDeleteImageId } });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Błąd usuwania zdjęcia");
      }

      setShowConfirmDeleteImagePopup(false);
      setPendingDeleteImageId(null);
      void (await fetchHorseDetails());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingRemoveImage(false);
    }
  };

  const currentImageUrl =
    horse.images_signed_urls && horse.images_signed_urls.length > 0
      ? horse.images_signed_urls[currentImageIndex]
      : default_img;

  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-6">
      <div className="relative mb-10 flex w-full max-w-7xl items-center justify-center sm:mb-6">
        <button
          onClick={() => void navigate("/konie")}
          className="absolute left-0 flex items-center gap-2 rounded-lg bg-linear-to-r from-gray-500 to-gray-700 px-4 py-2 text-white transition sm:relative sm:mr-auto"
        >
          <ArrowLeft className="text-xl" />
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
            {horse?.plec
              ? horse.plec.charAt(0).toUpperCase() + horse.plec.slice(1)
              : "Brak danych"}
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
                <ArrowLeft />
              </button>
              <button
                className="bg-opacity-50 hover:bg-opacity-75 absolute top-1/2 right-3 -translate-y-1/2 transform rounded-full bg-green-700 px-2 py-1 text-3xl font-bold text-white transition"
                onClick={nextImage}
              >
                <ArrowRight />
              </button>
            </>
          )}
          <div className="relative mb-4 h-64 w-64 overflow-hidden rounded-lg bg-gray-100 shadow-lg">
            {!isImageLoaded && (
              <img
                src={default_img}
                alt="Loading..."
                className="absolute inset-0 h-full w-full object-contain opacity-50 blur-xs transition-all duration-300"
              />
            )}
            <img
              src={currentImageUrl}
              alt={horse.nazwa}
              onClick={() => setIsImageModalOpen(true)}
              onLoad={() => setIsImageLoaded(true)}
              onError={() => setIsImageLoaded(true)}
              className={`absolute inset-0 h-full w-full cursor-pointer object-contain transition-all duration-500 hover:scale-105 ${isImageLoaded ? "opacity-100" : "opacity-0"}`}
            />
          </div>

          <div className="mt-2 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <label
                className={`cursor-pointer rounded-lg px-4 py-2 text-white transition ${
                  loadingImageUpload
                    ? "cursor-not-allowed bg-green-400"
                    : "bg-green-700 hover:bg-green-800"
                }`}
              >
                {loadingImageUpload ? "Dodawanie..." : "➕ Dodaj zdjęcie"}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => void handleImageUpload(e)}
                  disabled={loadingImageUpload}
                  accept="image/png, image/jpeg, image/webp"
                />
              </label>
              {showImagePopup && (
                <div className="to-brown-600 fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-800">
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
                    onClick={() => handleRemoveImage()}
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

            {showConfirmDeleteImagePopup && (
              <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg">
                <div className="rounded-lg bg-white p-6 text-center shadow-lg">
                  <p className="mb-4 text-lg font-bold text-red-600">
                    Czy na pewno chcesz usunąć to zdjęcie?
                  </p>
                  <p className="text-gray-700">
                    Tej operacji nie można cofnąć.
                  </p>

                  <div className="mt-6 flex justify-center gap-4">
                    <button
                      onClick={() => {
                        setShowConfirmDeleteImagePopup(false);
                        setPendingDeleteImageId(null);
                      }}
                      className="rounded-lg bg-gray-400 px-4 py-2 text-white transition hover:bg-gray-500"
                    >
                      Anuluj
                    </button>
                    <button
                      onClick={() => void confirmDeleteImage()}
                      className={`rounded-lg px-4 py-2 text-white transition ${
                        loadingRemoveImage
                          ? "cursor-not-allowed bg-red-400"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                      disabled={loadingRemoveImage}
                    >
                      {loadingRemoveImage ? "Usuwanie..." : "Usuń"}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                className="absolute top-4 right-4 z-50 rounded-full bg-red-600 px-4 py-2 text-lg font-bold text-white hover:bg-red-700"
                onClick={() => setIsImageModalOpen(false)}
              >
                <XCircle />
              </button>
              <img
                src={currentImageUrl}
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
                  {(() => {
                    const status = getDateStatus(event.dataWaznosci || "");
                    return (
                      <span className={`flex items-center ${status.classes}`}>
                        {status.icon}
                        <span>Ważne do {event.dataWaznosci}</span>
                      </span>
                    );
                  })()}
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
            <ul className="max-h-[60vh] overflow-y-auto rounded-lg bg-gray-100 p-4 shadow-md">
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
        <div className="bg-opacity-10 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="rounded-lg bg-white p-6 text-center shadow-lg">
            <p className="mb-4 text-lg font-bold text-red-600">
              Czy na pewno chcesz usunąć konia?
            </p>
            <p className="text-gray-700">Ta operacja jest nieodwracalna.</p>

            <div className="mt-6 flex justify-center gap-4">
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
          className="w-full rounded-lg bg-linear-to-r from-green-500 to-green-700 px-4 py-2 font-semibold text-white shadow-md transition hover:from-green-600 hover:to-green-800 sm:w-auto sm:px-6 sm:py-3"
        >
          🐎 Rozrody
        </Link>
        <Link
          to={`/wydarzenia/${id}/choroby`}
          className="w-full rounded-lg bg-linear-to-r from-red-500 to-red-700 px-4 py-2 font-semibold text-white shadow-md transition hover:from-red-600 hover:to-red-800 sm:w-auto sm:px-6 sm:py-3"
        >
          🤕 Choroby
        </Link>
        <Link
          to={`/wydarzenia/${id}/leczenia`}
          className="w-full rounded-lg bg-linear-to-r from-yellow-500 to-yellow-700 px-4 py-2 font-semibold text-white shadow-md transition hover:from-yellow-600 hover:to-yellow-800 sm:w-auto sm:px-6 sm:py-3"
        >
          💉 Leczenia
        </Link>
        <Link
          to={`/wydarzenia/${id}/profilaktyczne`}
          className="w-full rounded-lg bg-linear-to-r from-fuchsia-500 to-fuchsia-700 px-4 py-2 font-semibold text-white shadow-md transition hover:from-fuchsia-600 hover:to-fuchsia-800 sm:w-auto sm:px-6 sm:py-3"
        >
          🏥 Zdarzenia profilaktyczne
        </Link>
        <Link
          to={`/wydarzenia/${id}/podkucia`}
          className="w-full rounded-lg bg-linear-to-r from-blue-500 to-blue-700 px-4 py-2 font-semibold text-white shadow-md transition hover:from-blue-600 hover:to-blue-800 sm:w-auto sm:px-6 sm:py-3"
        >
          🧲 Podkucia
        </Link>
      </div>
    </div>
  );
}

export default KonieDetails;
