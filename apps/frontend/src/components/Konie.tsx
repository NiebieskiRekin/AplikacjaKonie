import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { IoMdCloseCircle } from "react-icons/io";
import APIClient from "../lib/api-client";
import formatApiError from "../lib/format-api-error";
import type { ErrorSchema } from "@aplikacja-konie/api-client";

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
        const resp = await APIClient.konie.$get();

        if (resp.ok) {
          const horses = await resp.json();
          const data = horses.data;
          data.forEach((element) => {
            element.img_url = element.img_url ?? default_img;
          });
          setHorses(data);
          setFilteredHorses(data);
        } else {
          const data = await resp.json();
          setError(data.error);
        }
      } catch (err) {
        setError(formatApiError(err as ErrorSchema));
      }
    };

    fetchHorses()
      .then(() => {})
      .catch(() => {});
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {filteredHorses.length > 0 ? (
          filteredHorses.map((horse) => (
            <div
              key={horse.id}
              className="cursor-pointer rounded-lg bg-white p-4 shadow-lg transition-transform duration-200 hover:scale-105"
              onClick={() => navigate(`/konie/${horse.id}`)}
            >
              <img
                src={horse.img_url || default_img}
                alt={horse.nazwa}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(e.currentTarget.src);
                }}
                onError={(e) => (e.currentTarget.src = default_img)}
                className="h-48 w-full cursor-pointer rounded-t-lg object-cover transition-transform duration-200 hover:scale-110"
              />
              <div className="p-3">
                <h3
                  className="cursor-pointer text-xl font-bold text-green-900 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation(); // Zatrzymuje propagację eventu, aby nie przechodziło podwójnie
                    navigate(`/konie/${horse.id}`);
                  }}
                >
                  {horse.nazwa}
                </h3>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-lg text-white">Brak wyników.</p>
        )}
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
