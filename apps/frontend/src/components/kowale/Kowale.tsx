import { APIClient } from "@/frontend/lib/api-client";
import formatApiError from "@/frontend/lib/format-api-error";
import type { ErrorSchema } from "@aplikacja-konie/api-client";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { tryParseJson } from "@/frontend/lib/safe-json";

type Kowal = {
  id: number;
  imieINazwisko: string;
  numerTelefonu: string | null;
};

function Kowale() {
  const [kowale, setKowale] = useState<Kowal[]>([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchKowali = async () => {
      try {
        const response = await APIClient.api.kowale.$get();

        if (response.ok) {
          const data = await tryParseJson(response);
          setKowale(data);
        } else {
          const data = await tryParseJson(response);
          throw new Error(data.error || "Błąd pobierania danych");
        }
      } catch (err) {
        setError(formatApiError(err as ErrorSchema));
      }
    };

    void fetchKowali();
  }, []);

  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-6">
      <h2 className="mb-6 text-3xl font-bold text-white">🛠 Lista Kowali</h2>

      {error && <p className="text-red-600">{error}</p>}

      <button
        onClick={() => void navigate("/kowale/add")}
        className="mb-4 rounded-lg bg-green-600 px-6 py-3 text-white shadow-md transition hover:bg-green-700"
      >
        ➕ Dodaj kowala
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
            {kowale.length > 0 ? (
              kowale.map((kow) => (
                <tr
                  key={kow.id}
                  className="text-center transition hover:bg-gray-100"
                >
                  <td className="border border-gray-300 px-4 py-2">
                    <Link
                      to={`/kowale/edit/${kow.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      ✍🏻
                    </Link>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {kow.imieINazwisko}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {kow.numerTelefonu || "Brak danych"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-4 text-center text-gray-600">
                  Brak kowali
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Kowale;
