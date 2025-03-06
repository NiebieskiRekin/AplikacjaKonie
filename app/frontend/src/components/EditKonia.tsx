import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";

function EditKonia() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nazwa, setNazwa] = useState("");
  const [numerPrzyzyciowy, setNumerPrzyzyciowy] = useState("");
  const [numerChipa, setNumerChipa] = useState("");
  const [rocznikUrodzenia, setRocznikUrodzenia] = useState("2025");
  const [dataPrzybycia, setDataPrzybycia] = useState("");
  const [dataOdejscia, setDataOdejscia] = useState("");
  const [rodzajKonia, setRodzajKonia] = useState("");
  const [plec, setPlec] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const fetchHorseDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Brak tokena. Zaloguj się.");

        const response = await fetch(`/api/konie/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Błąd pobierania danych konia");

        setNazwa(data.nazwa);
        setNumerPrzyzyciowy(data.numerPrzyzyciowy);
        setNumerChipa(data.numerChipa);
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

    if (!nazwa || !numerPrzyzyciowy || !numerChipa || !rocznikUrodzenia || !rodzajKonia || !plec) {
      setError("Wszystkie pola są wymagane.");
      return;
    }

    const requestData = JSON.stringify({
        nazwa,
        numerPrzyzyciowy,
        numerChipa,
        rocznikUrodzenia,
        dataPrzybycia,
        dataOdejscia,
        rodzajKonia,
        plec,
      });
      

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/konie/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: requestData, 
      });
      

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Błąd aktualizacji konia");

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
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-green-800 to-brown-600 p-6">
      <h2 className="text-3xl font-bold text-white mb-6">Edytuj dane konia</h2>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-400">{success}</p>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-96">
        <label className="block mb-2">
          Nazwa konia:
          <input
            type="text"
            value={nazwa}
            onChange={(e) => setNazwa(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </label>

        <label className="block mb-2">
          Numer przyżyciowy:
          <input
            type="text"
            value={numerPrzyzyciowy}
            onChange={(e) => setNumerPrzyzyciowy(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </label>

        <label className="block mb-2">
          Numer chipa:
          <input
            type="text"
            value={numerChipa}
            onChange={(e) => setNumerChipa(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </label>

        <label className="block mb-2">
          Rocznik urodzenia:
          <input
            type="number"
            value={rocznikUrodzenia}
            onChange={(e) => setRocznikUrodzenia(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </label>

        <label className="block mb-2">
          Data przybycia do stajni:
          <input
            type="date"
            value={dataPrzybycia}
            onChange={(e) => setDataPrzybycia(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </label>

        <label className="block mb-2">
          Data odejścia ze stajni:
          <input
            type="date"
            value={dataOdejscia}
            onChange={(e) => setDataOdejscia(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </label>

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
        >
          Zapisz zmiany
        </button>
      </form>

      {showPopup && (
        <div className="fixed inset-0  bg-opacity-30 backdrop-blur-lg flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <p className="text-green-600 text-lg font-bold mb-4">Dane konia zostały zaktualizowane!</p>
            <button
              onClick={handleClosePopup}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
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
