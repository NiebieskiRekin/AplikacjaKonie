import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { APIClient } from "../../lib/api-client";
import formatApiError from "../../lib/format-api-error";
import type { ErrorSchema } from "@aplikacja-konie/api-client";
import { konie_plec_enum } from "../../types/types";

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
        console.log(data);
        throw new Error(data?.error || "Błąd przy dodawaniu konia");
      }

      const responseData = await response.json();

      // Handle Image Upload if file exists
      if (file && responseData.image_uuid) {
        // Get Signed URL
        const response_image_url_upload = await APIClient.api.images.upload[
          ":filename"
        ].$get({
          param: { filename: responseData.image_uuid.id },
          query: { contentType: file.type },
        });

        if (!response_image_url_upload.ok)
          throw new Error(
            "Błąd przy generowaniu odnośnika do przesłania zdjęcia"
          );

        const image_url_upload = await response_image_url_upload.json();

        // Upload to bucket
        const response_uploaded_image = await fetch(image_url_upload.url, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!response_uploaded_image.ok)
          throw new Error("Błąd przy przesyłaniu zdjęcia do chmury");
      }

      setSuccess("Koń został dodany!");
      setShowPopup(true);

      setNazwa("");
      setNumerPrzyzyciowy("");
      setNumerChipa("");
      setRocznikUrodzenia("2025");
      setDataPrzybycia("");
      setDataOdejscia("");
      setRodzajKonia("");
      setPlec("");
      setFile(null);
    } catch (err) {
      const message =
        (err instanceof Error && err.message) ||
        formatApiError(err as ErrorSchema) ||
        "Nieznany błąd";

      setError(message);
    } finally {
      setLoading(false);
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
          className="absolute left-0 flex items-center gap-2 rounded-lg bg-linear-to-r from-gray-500 to-gray-700 px-4 py-2 text-white transition hover:from-gray-600 hover:to-gray-800 sm:relative sm:mr-auto"
        >
          <ArrowLeft className="text-xl" />
        </button>

        <h2 className="absolute left-1/2 -translate-x-1/2 transform text-center text-3xl font-bold text-white">
          Dodaj nowego konia
        </h2>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-900/20 p-2 text-center font-bold text-red-400">
          {error}
        </p>
      )}
      {success && (
        <p className="mb-4 rounded-lg bg-green-900/20 p-2 text-center font-bold text-green-400">
          {success}
        </p>
      )}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
      >
        <div className="mb-4">
          <label className="mb-1 block font-semibold text-gray-700">
            Nazwa konia <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={nazwa}
            onChange={(e) => setNazwa(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-hidden"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="mb-4">
            <label className="mb-1 block font-semibold text-gray-700">
              Numer przyżyciowy
            </label>
            <input
              type="text"
              value={numerPrzyzyciowy}
              onChange={(e) => setNumerPrzyzyciowy(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-hidden"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block font-semibold text-gray-700">
              Numer chipa
            </label>
            <input
              type="text"
              value={numerChipa}
              onChange={(e) => setNumerChipa(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1 block font-semibold text-gray-700">
            Rocznik urodzenia <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={rocznikUrodzenia}
            onChange={(e) => setRocznikUrodzenia(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-hidden"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="mb-4">
            <label className="mb-1 block font-semibold text-gray-700">
              Data przybycia
            </label>
            <input
              type="date"
              value={dataPrzybycia}
              onChange={(e) => setDataPrzybycia(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-hidden"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block font-semibold text-gray-700">
              Data odejścia
            </label>
            <input
              type="date"
              value={dataOdejscia}
              onChange={(e) => setDataOdejscia(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1 block font-semibold text-gray-700">
            Rodzaj konia <span className="text-red-500">*</span>
          </label>
          <select
            value={rodzajKonia}
            onChange={(e) => setRodzajKonia(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-hidden"
            required
          >
            <option value="">Wybierz...</option>
            <option value="Konie hodowlane">Koń hodowlany</option>
            <option value="Konie rekreacyjne">Koń rekreacyjny</option>
            <option value="Źrebaki">Źrebak</option>
            <option value="Konie sportowe">Koń sportowy</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="mb-1 block font-semibold text-gray-700">
            Płeć <span className="text-red-500">*</span>
          </label>
          <select
            value={plec}
            onChange={(e) => setPlec(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-hidden"
            required
          >
            <option value="">Wybierz...</option>
            {Object.values(konie_plec_enum).map((value) => (
              <option value={value} key={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="mb-1 block font-semibold text-gray-700">
            Zdjęcie konia
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
            className="w-full rounded-lg border border-gray-300 p-2 file:mr-4 file:rounded-full file:border-0 file:bg-green-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-green-700 hover:file:bg-green-100"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-lg py-3 font-bold text-white shadow-md transition ${
            loading
              ? "cursor-not-allowed bg-gray-400"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Dodawanie..." : "Dodaj konia"}
        </button>
      </form>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-xl">
            <h3 className="mb-2 text-xl font-bold text-green-600">Sukces!</h3>
            <p className="mb-6 text-gray-600">
              Koń został pomyślnie dodany do bazy.
            </p>
            <button
              onClick={() => void handleClosePopup()}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
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
