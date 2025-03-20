import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";

function EditKonia() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nazwa, setNazwa] = useState("");
  const [numerPrzyzyciowy, setNumerPrzyzyciowy] = useState("");
  const [numerChipa, setNumerChipa] = useState("");
  const [rocznikUrodzenia, setRocznikUrodzenia] = useState("2025");
  const [dataPrzybyciaDoStajni, setDataPrzybycia] = useState("");
  const [dataOdejsciaZeStajni, setDataOdejscia] = useState("");
  const [rodzajKonia, setRodzajKonia] = useState("");
  const [plec, setPlec] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const fetchHorseDetails = async () => {
      try {
        const response = await fetch(`/api/konie/${id}`);

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Błąd pobierania danych konia");

        setNazwa(data.nazwa);
        setNumerPrzyzyciowy(data.numerPrzyzyciowy || "");
        setNumerChipa(data.numerChipa || "");
        setRocznikUrodzenia(data.rocznikUrodzenia);
        setDataPrzybycia(data.dataPrzybyciaDoStajni || "");
        setDataOdejscia(data.dataOdejsciaZeStajni || "");
        setRodzajKonia(data.rodzajKonia);
        setPlec(data.plec);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchHorseDetails();
  }, [id]);

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

    const requestData = JSON.stringify({
      nazwa,
      numerPrzyzyciowy,
      numerChipa,
      rocznikUrodzenia,
      dataPrzybyciaDoStajni,
      dataOdejsciaZeStajni,
      rodzajKonia,
      plec,
    });

    try {
      const response = await fetch(`/api/konie/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestData,
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Błąd aktualizacji konia");

      setSuccess("Dane konia zostały zaktualizowane!");
      setShowPopup(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    navigate(`/konie/${id}`);
  };

  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-6">
      <h2 className="mb-6 text-3xl font-bold text-white">Edytuj dane konia</h2>

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
            value={dataPrzybyciaDoStajni}
            onChange={(e) => setDataPrzybycia(e.target.value)}
            className="w-full rounded-lg border p-2"
          />
        </label>

        <label className="mb-2 block">
          Data odejścia ze stajni:
          <input
            type="date"
            value={dataOdejsciaZeStajni}
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
            <option value="klacz">Klacz</option>
            <option value="ogier">Ogier</option>
            <option value="wałach">Wałach</option>
          </select>
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-green-600 py-2 text-white transition hover:bg-green-700"
        >
          Zapisz zmiany
        </button>
      </form>

      {showPopup && (
        <div className="bg-opacity-30 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg">
          <div className="rounded-lg bg-white p-6 text-center shadow-lg">
            <p className="mb-4 text-lg font-bold text-green-600">
              Dane konia zostały zaktualizowane!
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

export default EditKonia;
