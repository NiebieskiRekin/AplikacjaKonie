import { useState } from "react";

function AddKonia() {
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!nazwa || !numerPrzyzyciowy || !numerChipa || !rocznikUrodzenia || !rodzajKonia || !plec || !file) {
      setError("Wszystkie pola są wymagane.");
      return;
    }

    const formData = new FormData();
    formData.append("nazwa", nazwa);
    formData.append("numerPrzyzyciowy", numerPrzyzyciowy);
    formData.append("numerChipa", numerChipa);
    formData.append("rocznikUrodzenia", rocznikUrodzenia);
    formData.append("dataPrzybyciaDoStajni", dataPrzybycia);
    formData.append("dataOdejsciaZeStajni", dataOdejscia);
    formData.append("rodzajKonia", rodzajKonia);
    formData.append("plec", plec);
    formData.append("file", file);

    try {
      const response = await fetch("/api/konie", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Błąd dodawania konia");

      setSuccess("Koń został dodany!");
      setNazwa("");
      setNumerPrzyzyciowy("");
      setNumerChipa("");
      setRocznikUrodzenia("");
      setDataPrzybycia("");
      setDataOdejscia("");
      setRodzajKonia("");
      setPlec("");
      setFile(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-green-800 to-brown-600 p-6">
      <h2 className="text-3xl font-bold text-white mb-6">Dodaj nowego konia</h2>

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

        <label className="block mb-2">
          Rodzaj konia:
          <select
            value={rodzajKonia}
            onChange={(e) => setRodzajKonia(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            <option value="">Wybierz...</option>
            <option value="Konie hodowlane">Konie hodowlane</option>
            <option value="Konie rekreacyjne">Konie rekreacyjne</option>
            <option value="Źrebaki">Źrebaki</option>
            <option value="Konie sportowe">Konie sportowe</option>
          </select>
        </label>

        <label className="block mb-2">
          Płeć:
          <select
            value={plec}
            onChange={(e) => setPlec(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            <option value="">Wybierz...</option>
            <option value="samiec">Samiec</option>
            <option value="samica">Samica</option>
          </select>
        </label>

        <label className="block mb-4">
          Zdjęcie konia:
          <input type="file" onChange={handleFileChange} className="w-full p-2" />
        </label>

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
        >
          Dodaj konia
        </button>
      </form>
    </div>
  );
}

export default AddKonia;
