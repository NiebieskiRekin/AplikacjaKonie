import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { IoMdCloseCircle } from "react-icons/io";

type Horse = {
  id: number;
  nazwa: string;
  numerPrzyzyciowy: string;
  rodzajKonia: string;
  img_url: string | null;
  imageId: string | null;
};

const default_img = "/horses/default.png";

function Konie() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [search, setSearch] = useState("");
  const [filteredHorses, setFilteredHorses] = useState<Horse[]>([]);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {

    const fetchHorses = async () => {
      try {
        
        const horses = await fetch("/api/konie");

        const data: Horse[] = await horses.json();
        console.log(data);
        if (!horses.ok) throw new Error(data.error || "Błąd pobierania koni");

        data.forEach(element => {
          element.img_url = element.img_url ?? default_img;
        });

        setHorses(data);
        setFilteredHorses(data);
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
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-4 md:p-6">
      <div className="mb-6 flex w-full max-w-2xl flex-col items-center gap-4 md:flex-row">
        <input
          type="text"
          placeholder="Wyszukaj konia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 text-white shadow-md focus:ring focus:ring-green-500 md:w-2/3"
        />
        <button
          onClick={() => navigate("/konie/add")}
          className="w-full rounded-lg bg-green-600 px-5 py-3 text-white shadow-md transition hover:bg-green-700 md:w-auto"
        >
          ➕ Dodaj konia
        </button>
      </div>

      <h2 className="mb-6 text-center text-3xl font-bold text-white">
        Konie na hodowli
      </h2>
      {error && <p className="text-red-600">{error}</p>}

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {filteredHorses.length > 0 ? (
            filteredHorses.map((horse) => (
              <div
                key={horse.id}
                className="cursor-pointer rounded-xl bg-white p-4 shadow-lg transition-transform duration-200 hover:scale-105"
                onClick={() => navigate(`/konie/${horse.id}`)}
              >
                <div className="rounded-md border border-gray-200 overflow-hidden aspect-[4/3] mb-3">
                  <img
                    src={horse.img_url || default_img}
                    alt={horse.nazwa}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(e.currentTarget.src);
                    }}
                    onError={(e) => (e.currentTarget.src = default_img)}
                    className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                  />
                </div>
                <h3
                  className="text-center text-lg font-semibold text-green-900 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/konie/${horse.id}`);
                  }}
                >
                  {horse.nazwa}
                </h3>
              </div>
            ))
          ) : (
            <p className="text-center text-lg text-white col-span-full">Brak wyników.</p>
          )}
        </div>
      </div>

      {selectedImage && (
        <div
          className="bg-opacity-75 fixed inset-0 z-50 flex items-center justify-center bg-black"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-full max-w-3xl">
            <button
              className="absolute top-4 right-4 rounded-full bg-red-500 px-4 py-2 text-2xl text-white"
              onClick={() => setSelectedImage(null)}
            >
              <IoMdCloseCircle />
            </button>
            <img
              src={selectedImage}
              alt="Powiększone zdjęcie"
              className="h-auto max-h-[90vh] w-full rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Konie;
