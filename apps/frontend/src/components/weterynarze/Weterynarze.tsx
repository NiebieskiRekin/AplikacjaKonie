import { APIClient } from "@/frontend/lib/api-client";
import { useEffect, useState } from "react";
import { Link, redirect } from "react-router";

type Weterynarz = {
  id: number;
  imieINazwisko: string;
  numerTelefonu: string | null;
};

function Weterynarze() {
  const [weterynarze, setweterynarze] = useState<Weterynarz[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWeterynarze = async () => {
      try {
        const response = await APIClient.api.weterynarze.$get();

        if (response.ok) {
          const data = await response.json();
          setweterynarze(data);
        } else {
          throw new Error("Błąd pobierania danych");
        }
      } catch (err) {
        setError((err as Error).message);
      }
    };

    void fetchWeterynarze();
  }, []);

  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-6">
      <h2 className="mb-6 text-3xl font-bold text-white">
        👨‍⚕️ Lista Weterynarzy
      </h2>

      {error && <p className="text-red-600">{error}</p>}

      <button
        onClick={() => redirect("/weterynarze/add")}
        className="mb-4 rounded-lg bg-green-600 px-6 py-3 text-white shadow-md transition hover:bg-green-700"
      >
        ➕ Dodaj weterynarza
      </button>

      <div className="w-full max-w-4xl overflow-x-auto rounded-lg bg-white p-4 shadow-lg md:p-6">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="w-12 border border-gray-300 px-4 py-2">
                ✏️ Edytuj
              </th>
              <th className="border border-gray-300 px-4 py-2">
                👤 Imię i nazwisko
              </th>
              <th className="border border-gray-300 px-4 py-2">
                📞 Numer telefonu
              </th>
            </tr>
          </thead>
          <tbody>
            {weterynarze.length > 0 ? (
              weterynarze.map((wet) => (
                <tr
                  key={wet.id}
                  className="text-center transition hover:bg-gray-100"
                >
                  <td className="border border-gray-300 px-4 py-2">
                    <Link
                      to={`/weterynarze/edit/${wet.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      ✍🏻
                    </Link>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {wet.imieINazwisko}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {wet.numerTelefonu || "Brak danych"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="py-4 text-center text-gray-600">
                  Brak weterynarzy
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Weterynarze;
