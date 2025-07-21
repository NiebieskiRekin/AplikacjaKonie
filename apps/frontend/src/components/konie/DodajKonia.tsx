import { APIClient } from "@/frontend/lib/api-client";
import formatApiError from "@/frontend/lib/format-api-error";
import type { ErrorSchema } from "@aplikacja-konie/api-client";
import { useState } from "react";
import { useNavigate } from "react-router";
import { konie_plec_enum } from "@/frontend/types/types";
import { GoArrowLeft } from "react-icons/go";

function AddKonia() {
  const navigate = useNavigate();

  const [nazwa, setNazwa] = useState("");
  const [numerPrzyzyciowy, setNumerPrzyzyciowy] = useState("");
  const [numerChipa, setNumerChipa] = useState("");
  const [rocznikUrodzenia, setRocznikUrodzenia] = useState("2025");
  const [dataPrzybycia, setDataPrzybycia] = useState("");
  const [dataOdejscia, setDataOdejscia] = useState("");
  const [rodzajKonia, setRodzajKonia] = useState("");
  const [plec, setPlec] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!nazwa || !rocznikUrodzenia || !rodzajKonia || !plec) {
      setError(
        "Obowiązkowe pola to: nazwa, rocznik urodzenia, rodzaj konia, płeć."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await APIClient.api.konie.$post({
        form: {
          nazwa,
          numerPrzyzyciowy,
          numerChipa,
          rocznikUrodzenia,
          dataPrzybyciaDoStajni: dataPrzybycia,
          dataOdejsciaZeStajni: dataOdejscia,
          rodzajKonia,
          plec,
          file: (file !== null).toString(),
        },
      });

      if (!response.ok) {
        const data = await response.json();
        setError("Wystąpił błąd.");
        console.log(data);
        throw new Error(data?.error || "Błąd przy dodawaniu konia");
      }

      setSuccess("Koń został dodany!");
      setShowPopup(true);
      setNazwa("");
      setNumerPrzyzyciowy("");
      setNumerChipa("");
      setRocznikUrodzenia("");
      setDataPrzybycia("");
      setDataOdejscia("");
      setRodzajKonia("");
      setPlec("");
      // setFile(null);

      if (response.status == 200 && file) {
        const data = await response.json();
        const response_image_url_upload = await APIClient.api.images.upload[
          ":filename"
        ].$get({
          param: { filename: data.image_uuid.id },
        });

        if (!response_image_url_upload.ok)
          throw new Error(data.message || "Błąd przy przesyłaniu zdjęcia");

        const image_url_upload = await response_image_url_upload.json();
        const response_uploaded_image = await fetch(image_url_upload.url, {
          method: "PUT",
          body: file,
        });

        if (!response_uploaded_image.ok)
          throw new Error("Błąd przy przesyłaniu zdjęcia");
      }
    } catch (err) {
      setLoading(false);
      const message =
        (err instanceof Error && err.message) ||
        formatApiError(err as ErrorSchema) ||
        "Nieznany błąd";

      setError(message);

      if (message.includes("TypeError") || message.includes("NetworkError")) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    }
  };

  const handleClosePopup = async () => {
    setShowPopup(false);
    await navigate("/konie");
  };

  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-6">
      <div className="relative mb-10 flex w-full max-w-7xl items-center justify-center sm:mb-6">
        <button
          onClick={() => void navigate(`/konie`)}
          className="absolute left-0 flex items-center gap-2 rounded-lg bg-gradient-to-r from-gray-500 to-gray-700 px-4 py-2 text-white transition sm:relative sm:mr-auto"
        >
          <GoArrowLeft className="text-xl" />
        </button>

        <h2 className="absolute left-1/2 -translate-x-1/2 transform text-center text-3xl font-bold text-white">
          Dodaj nowego konia
        </h2>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-400">{success}</p>}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-96 rounded-lg bg-white p-6 shadow-md"
      >
        <label className="mb-2 block">
          Nazwa konia:
          <input
            type="text"
            value={nazwa}
            onChange={(e) => setNazwa(e.target.value)}
            className="w-full rounded-lg border p-2"
          />
        </label>

        <label className="mb-2 block">
          Numer przyżyciowy:
          <input
            type="text"
            value={numerPrzyzyciowy}
            onChange={(e) => setNumerPrzyzyciowy(e.target.value)}
            className="w-full rounded-lg border p-2"
          />
        </label>

        <label className="mb-2 block">
          Numer chipa:
          <input
            type="text"
            value={numerChipa}
            onChange={(e) => setNumerChipa(e.target.value)}
            className="w-full rounded-lg border p-2"
          />
        </label>

        <label className="mb-2 block">
          Rocznik urodzenia:
          <input
            type="number"
            value={rocznikUrodzenia}
            onChange={(e) => setRocznikUrodzenia(e.target.value)}
            className="w-full rounded-lg border p-2"
          />
        </label>

        <label className="mb-2 block">
          Data przybycia do stajni:
          <input
            type="date"
            value={dataPrzybycia}
            onChange={(e) => setDataPrzybycia(e.target.value)}
            className="w-full rounded-lg border p-2"
          />
        </label>

        <label className="mb-2 block">
          Data odejścia ze stajni:
          <input
            type="date"
            value={dataOdejscia}
            onChange={(e) => setDataOdejscia(e.target.value)}
            className="w-full rounded-lg border p-2"
          />
        </label>

        <label className="mb-2 block">
          Rodzaj konia:
          <select
            value={rodzajKonia}
            onChange={(e) => setRodzajKonia(e.target.value)}
            className="w-full rounded-lg border p-2"
          >
            <option value="">Wybierz...</option>
            <option value="Konie hodowlane">Koń hodowlany</option>
            <option value="Konie rekreacyjne">Koń rekreacyjny</option>
            <option value="Źrebaki">Źrebak</option>
            <option value="Konie sportowe">Koń sportowy</option>
          </select>
        </label>

        <label className="mb-2 block">
          Płeć:
          <select
            value={plec}
            onChange={(e) => setPlec(e.target.value)}
            className="w-full rounded-lg border p-2"
          >
            <option value="">Wybierz...</option>
            {Object.values(konie_plec_enum).map((value) => (
              <option value={value} key={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label className="mb-4 block">
          Zdjęcie konia:
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full p-2"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-lg py-2 text-white transition ${
            loading
              ? "cursor-not-allowed bg-gray-400"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Dodawanie..." : "Dodaj konia"}
        </button>
      </form>

      {showPopup && (
        <div className="to-brown-600 fixed inset-0 flex items-center justify-center bg-gradient-to-br from-green-800">
          <div className="rounded-lg bg-white p-6 text-center shadow-lg">
            <p className="mb-4 text-lg font-bold text-green-600">
              Koń został dodany!
            </p>
            <button
              onClick={() => void handleClosePopup()}
              className="rounded-lg bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddKonia;
