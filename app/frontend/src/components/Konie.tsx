import { useEffect, useState } from "react";

type Horse = {
  id: number;
  nazwa: string;
  numerPrzyzyciowy: string;
  rodzajKonia: string;
};

function Konie() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHorses = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Brak tokena. Zaloguj się.");

        const response = await fetch("/api/konie", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Błąd pobierania koni");

        setHorses(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchHorses();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-green-800 to-brown-600 p-6">
      <h2 className="text-3xl font-bold text-white mb-6">Lista koni</h2>
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {horses.map((horse) => (
          <div key={horse.id} className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-xl font-bold text-green-900">{horse.nazwa}</h3>
            <p className="text-gray-700">Numer: {horse.numerPrzyzyciowy}</p>
            <p className="text-gray-600">Rodzaj: {horse.rodzajKonia}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Konie;
