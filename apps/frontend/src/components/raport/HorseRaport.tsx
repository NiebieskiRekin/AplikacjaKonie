import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { zReportRequestDataArray } from "./types";

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
    console.log(query);
    const events = zReportRequestDataArray.parse(
      query ? JSON.parse(query) : []
    );

    fetch(`/api/raport/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
    })
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, [id]);

  if (!data)
    return <div className="p-10 text-center text-xl">Ładowanie...</div>;

  const horse = data.horse;
  const images = data.images;

  const renderTable = (
    title: string,
    rows: any[],
    headers: any[],
    displayHeaders: string[]
  ) => (
    <div className="page-break mb-10 w-full">
      <h2 className="mb-4 text-center text-2xl font-bold">{title}</h2>
      <table className="w-full border-collapse border border-black text-sm">
        <thead>
          <tr>
            {displayHeaders.map((label, i) => (
              <th
                key={headers[i]}
                className="border border-black bg-gray-100 px-2 py-1 text-left"
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
          <div className="group relative flex justify-end p-4 print:hidden">
            <button
              onClick={() => window.print()}
              className="relative rounded bg-purple-700 px-6 py-2 text-white shadow transition hover:bg-purple-800"
            >
              🖨️ Drukuj / Zapisz jako PDF
              <div className="pointer-events-none absolute top-full left-1/2 z-10 mt-2 w-80 -translate-x-1/2 rounded bg-gray-800 px-3 py-2 text-sm text-white opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100">
                Aby PDF nie zawierał adresu strony i numeracji, odznacz
                „Nagłówki i stopki” w oknie drukowania.
                <div className="absolute top-0 left-1/2 z-0 h-3 w-3 -translate-x-1/2 -translate-y-full rotate-45 bg-gray-800"></div>
              </div>
            </button>
          </div>

          <div className="p-10 font-serif text-[12pt] text-black">
            {/* Strona 2: zdjęcia */}
            <div className="page-break">
              <h2 className="mb-4 text-center text-2xl font-bold">Zdjęcia</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {images.map((src, i) => (
                  <div
                    key={i}
                    className="page-break flex h-[90vh] items-center justify-center p-10"
                  >
                    <img
                      src={src}
                      alt={`Zdjęcie ${i + 1}`}
                      className="max-h-[90vh] max-w-[90vw] border border-gray-300 object-contain shadow"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Strona 1: dane konia */}
            <div className="page-break mt-12">
              <h1 className="mb-8 border-b pb-4 text-center text-3xl font-bold">
                Raport konia
              </h1>
              <div className="rounded-md border border-gray-400 p-6">
                <div className="grid grid-cols-1 gap-4 text-[11pt] sm:grid-cols-2">
                  <div>
                    <p className="mb-1">
                      <span className="font-semibold">Nazwa:</span>{" "}
                      {horse.nazwa}
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
                      <span className="font-semibold">
                        Data przybycia do stajni:
                      </span>{" "}
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
              if (
                key === "horse" ||
                !Array.isArray(value) ||
                value.length === 0 ||
                key === "images"
              )
                return null;
              if (key === "PodanieSuplementów") key = "Podanie suplementów";

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
}
