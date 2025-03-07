import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

type Kowal = {
  id: number;
  imieINazwisko: string;
  numerTelefonu?: string;
};

function Kowale() {
  const [kowale, setKowale] = useState<Kowal[]>([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchKowali = async () => {
      try {
        const response = await fetch("/api/kowale");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Błąd pobierania danych");
        setKowale(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchKowali();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-green-800 to-brown-600 p-6">
      <h2 className="text-3xl font-bold text-white mb-6">🛠 Lista Kowali</h2>

      {error && <p className="text-red-600">{error}</p>}

      <button
        onClick={() => navigate("/kowale/add")}
        className="mb-4 rounded-lg bg-green-600 px-6 py-3 text-white shadow-md transition hover:bg-green-700"
      >
        ➕ Dodaj kowala
      </button>

      <div className="w-full max-w-4xl bg-white p-4 md:p-6 rounded-lg shadow-lg overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 px-4 py-2">👤 Imię i nazwisko</th>
              <th className="border border-gray-300 px-4 py-2">📞 Numer telefonu</th>
            </tr>
          </thead>
          <tbody>
            {kowale.length > 0 ? (
              kowale.map((kow) => (
                <tr key={kow.id} className="text-center transition hover:bg-gray-100">
                  <td className="border border-gray-300 px-4 py-2">{kow.imieINazwisko}</td>
                  <td className="border border-gray-300 px-4 py-2">{kow.numerTelefonu || "Brak danych"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="py-4 text-center text-gray-600">
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
