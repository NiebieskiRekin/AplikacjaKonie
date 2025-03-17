import APIClient from "@/frontend/lib/api-client";
import { useEffect, useState } from "react";
import { useParams, redirect } from "react-router";
import { BackendTypes } from "@aplikacja-konie/api-client";

function EditKonia() {
  const { id } = useParams();

  const [nazwa, setNazwa] = useState("");
  const [numerPrzyzyciowy, setNumerPrzyzyciowy] = useState("");
  const [numerChipa, setNumerChipa] = useState("");
  const [rocznikUrodzenia, setRocznikUrodzenia] = useState("");
  const [dataPrzybycia, setDataPrzybycia] = useState("");
  const [dataOdejscia, setDataOdejscia] = useState("");
  const [rodzajKonia, setRodzajKonia] = useState<BackendTypes.RodzajKonia>(
    BackendTypes.RodzajeKoni[0]
  );
  const [plec, setPlec] = useState<BackendTypes.Plec>(BackendTypes.Plcie[0]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const fetchHorseDetails = async () => {
      try {
        const response = await APIClient.konie[":id{[0-9]+}"].$get({
          param: { id: id! },
        });

        if (!response.ok) throw new Error("Błąd pobierania danych konia");

        const data = await response.json();
        setNazwa(data.nazwa);
        setNumerPrzyzyciowy(data.numerPrzyzyciowy);
        setNumerChipa(data.numerChipa);
        setRocznikUrodzenia((data.rocznikUrodzenia ?? 2025).toString());
        setDataPrzybycia(data.dataPrzybyciaDoStajni || "");
        setDataOdejscia(data.dataOdejsciaZeStajni || "");
        setRodzajKonia(data.rodzajKonia);
        setPlec(data.plec!);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchHorseDetails()
      .then(() => {})
      .catch(() => {});
  }, [id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !nazwa ||
      !numerPrzyzyciowy ||
      !numerChipa ||
      !rocznikUrodzenia ||
      !rodzajKonia ||
      !plec
    ) {
      setError("Wszystkie pola są wymagane.");
      return;
    }

    const requestData = {
      nazwa,
      numerPrzyzyciowy,
      numerChipa,
      rocznikUrodzenia: Number(rocznikUrodzenia),
      dataPrzybyciaDoStajni: dataPrzybycia,
      dataOdejsciaZeStajni: dataOdejscia,
      rodzajKonia,
      plec,
    };

    try {
      const response = await APIClient.konie[":id{[0-9]+}"].$put({
        param: { id: id! },
        json: requestData,
      });

      if (!response.ok) throw new Error("Błąd aktualizacji konia");

      await response.json();
      setSuccess("Dane konia zostały zaktualizowane!");
      setShowPopup(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    redirect(`/konie/${id}`);
  };

  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-6">
      <h2 className="mb-6 text-3xl font-bold text-white">Edytuj dane konia</h2>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-400">{success}</p>}

      <form
        onSubmit={() => handleSubmit}
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
