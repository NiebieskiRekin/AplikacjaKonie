import { useState } from "react";
import { useNavigate } from "react-router";
import { konie_plec_enum } from '../types/types';

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !nazwa ||
      !rocznikUrodzenia ||
      !rodzajKonia ||
      !plec
    ) {
      setError("Wszystkie pola są wymagane.");
      return;
    }

    const formData = new FormData();
    formData.append("nazwa", nazwa);
    if (numerPrzyzyciowy) {
      formData.append("numerPrzyzyciowy", numerPrzyzyciowy);
    }
    if (numerChipa) {  
    formData.append("numerChipa", numerChipa);
    }
    formData.append("rocznikUrodzenia", rocznikUrodzenia);
    formData.append("dataPrzybyciaDoStajni", dataPrzybycia);
    formData.append("dataOdejsciaZeStajni", dataOdejscia);
    formData.append("rodzajKonia", rodzajKonia);
    formData.append("plec", plec);

    // formData.append("file", file);

    try {
      const response = await fetch("/api/konie", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Błąd dodawania konia");

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


      if (file){
        const response_image_url_upload = await fetch(`/api/images/upload/${data.image_uuid.id!}`);
        if (!response_image_url_upload.ok) throw new Error(data.error || "Błąd przy przesyłaniu zdjęcia");
        const imaage_url_upload = await response_image_url_upload.json();
        const response_uploaded_image = await fetch(imaage_url_upload.url, {
          method: "PUT",
          body: file
        });
        if (!response_uploaded_image.ok) throw new Error(data.error || "Błąd przy przesyłaniu zdjęcia");
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    navigate("/konie");
  };

  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-6">
      <h2 className="mb-6 text-3xl font-bold text-white">Dodaj nowego konia</h2>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-400">{success}</p>}

      <form
        onSubmit={handleSubmit}
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
            {Object.values(konie_plec_enum).map(value => (
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
          className="w-full rounded-lg bg-green-600 py-2 text-white transition hover:bg-green-700"
        >
          Dodaj konia
        </button>
      </form>

      {showPopup && (
        <div className="to-brown-600 fixed inset-0 flex items-center justify-center bg-gradient-to-br from-green-800">
          <div className="rounded-lg bg-white p-6 text-center shadow-lg">
            <p className="mb-4 text-lg font-bold text-green-600">
              Koń został dodany!
            </p>
            <button
              onClick={handleClosePopup}
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
