import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

type Horse = {
  id: number;
  nazwa: string;
  numerPrzyzyciowy: string;
  rodzajKonia: string;
  imageUrl?: string;
};

function Konie() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [search, setSearch] = useState("");
  const [filteredHorses, setFilteredHorses] = useState<Horse[]>([]);
  const [error, setError] = useState("");

  const navigate = useNavigate();

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

        const horeseWithImages = data.map((horse: Horse) => ({
          ...horse,
          imageUrl: `${import.meta.env.BASE_URL}horses/${horse.id}.jpg`,
        }));

        setHorses(horeseWithImages);
        setFilteredHorses(horeseWithImages);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchHorses();
  }, []);

  useEffect(() => {
    const filtered = horses.filter((horse) =>
      horse.nazwa.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredHorses(filtered);
  }, [search, horses]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-green-800 to-brown-600 p-6">

      <div className="w-full max-w-2xl flex justify-between items-center mb-6">
        <input
          type="text"
          placeholder="Wyszukaj konia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-2/3 p-3 rounded-lg shadow-md border border-gray-300 focus:ring focus:ring-green-500 text-white"
        />
        <button
          onClick={() => navigate("/konie/add")}
          className="px-5 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition"
        >
          ➕ Dodaj konia
        </button>
      </div>

      <h2 className="text-3xl font-bold text-white mb-6">Konie na hodowli</h2>
      {error && <p className="text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredHorses.length > 0 ? (
          filteredHorses.map((horse) => (
            <div key={horse.id} onClick={() => navigate(`/konie/${horse.id}`)}
            className="bg-white rounded-lg shadow-lg p-4 cursor-pointer hover:scale-105 transition transform duration-200">
               <img
                src={horse.imageUrl}
                alt={horse.nazwa}
                onError={(e) => (e.currentTarget.src = "/horses/default.jpg")}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <div className="p-3">
                <h3 className="text-xl font-bold text-green-900">{horse.nazwa}</h3>
              </div>
            </div>
          ))
        ) : (
          <p className="text-white text-lg">Brak wyników.</p>
        )}
      </div>
    </div>
  );
}

export default Konie;
