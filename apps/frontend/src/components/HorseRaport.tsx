import { useEffect, useState, type JSXElementConstructor, type ReactElement, type ReactNode, type ReactPortal } from "react";
import { useParams } from "react-router";

export default function HorseReport() {
  const { id } = useParams();
  interface HorseData {
    horse: [Horse, string[]];
    [key: string]: any;
  }

  interface Horse {
    nazwa: string;
    numerPrzyzyciowy: string;
    numerChipa: string;
    plec: string;
    rocznikUrodzenia: string;
    dataPrzybyciaDoStajni: string;
    rodzajKonia: string;
    active: boolean;
  }

  const columnLabels: Record<string, string> = {
    dataZdarzenia: "Data zdarzenia",
    dataWaznosci: "Ważne do",
    opisZdarzenia: "Opis",
    Weterynarz: "Weterynarz",
    Choroba: "Choroba",
    dataRozpoczecia: "Data rozpoczęcia",
    dataZakonczenia: "Data zakończenia",
    rodzajZdarzenia: "Rodzaj zdarzenia",
  };
  

  const [data, setData] = useState<HorseData | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("data");
    const events = query ? JSON.parse(query) : [];

    fetch(`/api/raport/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
    })
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, [id]);


  if (!data) return <div className="p-10 text-center text-xl">Ładowanie...</div>;

  const [horse, images] = data.horse;

  const renderTable = (title: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, rows: any[], headers: any[], displayHeaders: string[]) => (
    <div className="w-full page-break mb-10">
    <h2 className="text-2xl font-bold text-center mb-4">{title}</h2>
    <table className="w-full border border-black border-collapse text-sm">
      <thead>
        <tr>
          {displayHeaders.map((label, i) => (
            <th
              key={headers[i]}
              className="border border-black px-2 py-1 bg-gray-100 text-left"
            >
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx}>
            {headers.map((h) => (
              <td key={h} className="border border-black px-2 py-1">
                {row[h] || "-"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

return (
  <>
    {!data ? (
      <div className="p-10 text-center text-xl">Ładowanie...</div>
    ) : (
      <>
        <div className="flex justify-end p-4 relative group print:hidden">
        <button
            onClick={() => window.print()}
            className="bg-purple-700 text-white px-6 py-2 rounded shadow hover:bg-purple-800 transition relative"
        >
            🖨️ Drukuj / Zapisz jako PDF

            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-80 text-sm text-white bg-gray-800 rounded px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 shadow-lg">
            Aby PDF nie zawierał adresu strony i numeracji, odznacz „Nagłówki i stopki” w oknie drukowania.

            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-3 h-3 bg-gray-800 rotate-45 z-0"></div>
            </div>
        </button>
        </div>

        <div className="p-10 text-black text-[12pt] font-serif">
          {/* Strona 2: zdjęcia */}
          <div className="page-break">
            <h2 className="text-2xl font-bold text-center mb-4">Zdjęcia</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.map((src, i) => (
                <div
                  key={i}
                  className="page-break flex items-center justify-center h-[90vh] p-10"
                >
                  <img
                    src={src}
                    alt={`Zdjęcie ${i + 1}`}
                    className="max-h-[90vh] max-w-[90vw] object-contain border border-gray-300 shadow"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Strona 1: dane konia */}
          <div className="page-break mt-12">
            <h1 className="text-3xl font-bold text-center mb-8 border-b pb-4">
              Raport konia
            </h1>
            <div className="border border-gray-400 rounded-md p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11pt]">
                <div>
                  <p className="mb-1">
                    <span className="font-semibold">Nazwa:</span> {horse.nazwa}
                  </p>
                  <p className="mb-1">
                    <span className="font-semibold">Numer przyżyciowy:</span>{" "}
                    {horse.numerPrzyzyciowy}
                  </p>
                  <p className="mb-1">
                    <span className="font-semibold">Numer chipa:</span>{" "}
                    {horse.numerChipa}
                  </p>
                  <p className="mb-1">
                    <span className="font-semibold">Płeć:</span> {horse.plec}
                  </p>
                </div>
                <div>
                  <p className="mb-1">
                    <span className="font-semibold">Rocznik urodzenia:</span>{" "}
                    {horse.rocznikUrodzenia}
                  </p>
                  <p className="mb-1">
                    <span className="font-semibold">Data przybycia do stajni:</span>{" "}
                    {horse.dataPrzybyciaDoStajni}
                  </p>
                  <p className="mb-1">
                    <span className="font-semibold">Rodzaj konia:</span>{" "}
                    {horse.rodzajKonia}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Wydarzenia */}
          {Object.entries(data || {}).map(([key, value]) => {
            if (key === "horse" || !Array.isArray(value) || value.length === 0) return null;

            const headers = Object.keys(value[0]);
            const displayHeaders = headers.map((h) => columnLabels[h] || h);

            return (
                <div key={key} className="mt-12">
                  {renderTable(key, value, headers, displayHeaders)}
                </div>
              );
          })}
        </div>
      </>
    )}
  </>
);
};