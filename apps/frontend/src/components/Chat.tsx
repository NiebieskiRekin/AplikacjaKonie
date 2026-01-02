import { useState, useEffect } from "react";
import { APIClient } from "@/frontend/lib/api-client";
// import type { RodzajKonia } from "@aplikacja-konie/backend/schema";

type Message = {
  role: "user" | "gemini";
  text: string;
};
import { type Horse } from "../components/components/Kon";
type Person = { id: number; imieINazwisko: string };

const formatEmptyValues = (obj: any): any => {
  if (obj === null || obj === "") return "Brak";
  if (Array.isArray(obj)) return obj.map(formatEmptyValues);
  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, formatEmptyValues(value)])
    );
  }
  return obj;
};

const renderFriendlyDetails = (
  obj: any,
  horses: Horse[],
  kowale: Person[],
  weterynarze: Person[]
) => {
  console.log("Rendering details for object:", obj);
  console.log("type of obj:", typeof obj);
  if (!obj || typeof obj !== "object") return null;

  const keyLabels: Record<string, string> = {
    imieINazwisko: "Imię i Nazwisko",
    numerTelefonu: "Numer Telefonu",
    dataZdarzenia: "Data Zdarzenia",
    dataWaznosci: "Data Ważności",
    dataZakonczenia: "Data Zakończenia",
    dataRozpoczecia: "Data Rozpoczęcia",
    konieId: "Koń",
    konId: "Koń",
    kon: "Koń",
    kowal: "Kowal",
    weterynarz: "Weterynarz",
    opisZdarzenia: "Opis",
    nazwa: "Nazwa",
    numerPrzyzyciowy: "Numer Przyżyciowy",
    numerChipa: "Numer Chipa",
    rocznikUrodzenia: "Rocznik Urodzenia",
    dataPrzybyciaDoStajni: "Data Przybycia do Stajni",
    dataOdejsciaZeStajni: "Data Odejścia ze Stajni",
    rodzajKonia: "Rodzaj Konia",
    plec: "Płeć",
    choroba: "Choroba",
    rodzajZdarzenia: "Rodzaj Zdarzenia",
  };

  const keysToHide = ["hodowla", "id", "imageId", "img_url", "active"];

  return Object.entries(obj)
    .filter(([key]) => !keysToHide.includes(key))
    .map(([key, value]) => {
      let displayValue: string;

      if (value === null || value === "") {
        displayValue = "Brak";
      }
      // LOGIKA DLA WIELU KONI
      else if (
        Array.isArray(value) &&
        ["konieId", "konId", "kon"].includes(key)
      ) {
        const selectedIds = value.map((v) => Number(v));
        const selectedHorses = horses.filter((h) => selectedIds.includes(h.id));
        const names = selectedHorses.map((h) => h.nazwa).join(", ");

        let suffix = "";

        if (selectedIds.length > 0) {
          if (selectedIds.length === horses.length && horses.length > 1) {
            suffix = " (wszystkie konie)";
          } else {
            const typesInSelection = [
              ...new Set(
                selectedHorses.map((h) => String(h.rodzajKonia).trim())
              ),
            ];

            for (const type of typesInSelection) {
              if (!type || type === "null") continue;

              const allHorsesOfThisType = horses.filter(
                (h) => String(h.rodzajKonia).trim() === type
              );
              const selectedHorsesOfThisType = selectedHorses.filter(
                (h) => String(h.rodzajKonia).trim() === type
              );

              if (
                allHorsesOfThisType.length > 0 &&
                allHorsesOfThisType.length ===
                  selectedHorsesOfThisType.length &&
                allHorsesOfThisType.length > 1
              ) {
                const typeLower = type.toLowerCase();
                suffix = ` (wszystkie ${typeLower})`;
                break;
              }
            }
          }
        }
        displayValue = names + suffix;
      } else if (Array.isArray(value)) {
        const names = value.map((v) =>
          getDisplayName(key, v, horses, kowale, weterynarze)
        );
        displayValue = names.length > 0 ? names.join(", ") : "Brak";
      } else {
        displayValue = getDisplayName(key, value, horses, kowale, weterynarze);
      }

      const label = keyLabels[key] || key;

      return (
        <div
          key={key}
          className="grid grid-cols-2 gap-2 border-b border-gray-100 py-1 last:border-0"
        >
          <span className="font-semibold text-gray-600">{label}:</span>
          <span className="text-gray-800">{displayValue}</span>
        </div>
      );
    });
};

const getDisplayName = (
  key: string,
  value: any,
  horses: Horse[],
  kowale: Person[],
  weterynarze: Person[]
) => {
  const id = Number(value);
  if (isNaN(id)) return String(value);

  if (["kon", "konieId", "konId"].includes(key)) {
    return horses.find((h) => h.id === id)?.nazwa || `Koń (ID: ${id})`;
  }
  if (["kowal", "kowalId"].includes(key)) {
    return (
      kowale.find((k) => k.id === id)?.imieINazwisko || `Kowal (ID: ${id})`
    );
  }
  if (["weterynarz", "weterynarzId", "lekarz"].includes(key)) {
    return (
      weterynarze.find((w) => w.id === id)?.imieINazwisko ||
      `Weterynarz (ID: ${id})`
    );
  }
  return String(value);
};

function GeminiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [kowalRes, setKowalRes] = useState<Person[]>([]);
  const [weterynarzRes, setWeterynarzRes] = useState<Person[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [listening, setListening] = useState(false);

  const handleSpeechInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Twoja przeglądarka nie obsługuje rozpoznawania mowy.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pl-PL";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();
    setListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPrompt((prev) => prev + (prev ? " " : "") + transcript);
    };

    recognition.onerror = (event: any) => {
      setError(`Błąd rozpoznawania mowy: ${event.error}`);
    };

    recognition.onend = () => {
      setListening(false);
    };
  };

  const handleSend = async () => {
    if (!prompt.trim()) return;

    setError("");
    setLoading(true);

    try {
      const liczbaRes = await APIClient.api.chat.$get();
      if (!liczbaRes.ok) throw new Error("Błąd pobierania liczby zapytań");

      const { liczba_requestow } = await liczbaRes.json();
      if (liczba_requestow <= 0) {
        throw new Error("Brak dostępnych zapytań do Gemini");
      }

      const userMessage: Message = { role: "user", text: prompt };
      setMessages((prev) => [...prev, userMessage]);
      setPrompt("");
      setLoading(true);
      setError("");
      const konieBezZdjec = horses.map(
        ({ img_url, imageId, ...reszta }) => reszta
      );

      const res = await APIClient.api.chat.$post({
        json: {
          konie: JSON.stringify(konieBezZdjec),
          prompt,
          kowale: JSON.stringify(kowalRes),
          weterynarze: JSON.stringify(weterynarzRes),
        },
      });

      if (!res.ok) throw new Error("Błąd komunikacji z Gemini");

      const data = await res.json();

      try {
        // const parsedResponse = JSON.parse(data.response);

        if (data.status === 200 || data.status === 201) {
          setMessages((prev) => [
            ...prev,
            {
              role: "gemini",
              text: `Dodano ${data.actionName}:`,
              jsonData: data.generated,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "gemini",
              text: `Błąd podczas dodawania: ${data.response}`,
            },
          ]);
        }
      } catch (e) {
        // fallback jeśli JSON.parse się nie uda
        setMessages((prev) => [
          ...prev,
          { role: "gemini", text: data.response },
        ]);
      }

      // Odejmij 1 request w bazie danych
      const updateRes = await APIClient.api.chat.decrease.$post();
      if (!updateRes.ok) {
        throw new Error("Błąd aktualizacji liczby zapytań");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response1 = await APIClient.api.konie.$get();

        if (response1.ok) {
          const horsesData = await response1.json();
          setHorses(horsesData.data);
        } else {
          throw new Error("Błąd pobierania koni");
        }

        const response2 = await APIClient.api.kowale.$get();
        if (response2.ok) {
          const kowalRes = await response2.json();
          setKowalRes(kowalRes);
        } else {
          throw new Error("Błąd pobierania kowali");
        }
        const response3 = await APIClient.api.weterynarze.$get();
        if (response3.ok) {
          const weteRes = await response3.json();
          setWeterynarzRes(weteRes);
        } else {
          throw new Error("Błąd pobierania weterynarzy");
        }
      } catch (err) {
        setError((err as Error).message);
      }
    };

    void fetchData();
  }, []);

  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-linear-to-br from-green-800 p-4 md:p-6">
      <div className="mb-6 w-full max-w-2xl text-center text-3xl font-bold text-white">
        🧠 Chat z Asystentem
      </div>

      <div className="w-full max-w-2xl space-y-4 rounded-lg bg-white p-4 shadow-md md:p-6">
        <div className="h-80 space-y-2 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`w-fit max-w-[90%] rounded-xl px-4 py-3 shadow-sm ${
                msg.role === "user"
                  ? "ml-auto bg-green-100 text-right"
                  : "mr-auto border border-gray-200 bg-white text-left"
              }`}
            >
              <span className="mb-1 block text-xs font-bold text-gray-400 uppercase">
                {msg.role === "user" ? "Ty" : "Asystent"}
              </span>

              <div className="mb-2 font-medium text-gray-800">{msg.text}</div>

              {(msg as any).jsonData && (
                <div className="mt-1 rounded-lg border-l-4 border-green-500 bg-gray-50 p-3 text-sm">
                  {renderFriendlyDetails(
                    (msg as any).jsonData,
                    horses,
                    kowalRes,
                    weterynarzRes
                  )}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <p className="text-sm text-gray-500 italic">Asystent pisze...</p>
          )}
        </div>

        {error && <p className="text-red-600">{error}</p>}

        <div className="flex w-full items-center space-x-2">
          <textarea
            rows={3}
            placeholder="Wpisz wiadomość..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 shadow-sm focus:ring focus:ring-green-500"
          />
          <button
            type="button"
            onClick={handleSpeechInput}
            disabled={listening}
            className="mt-2 rounded-lg bg-yellow-500 px-4 py-2 text-white shadow hover:bg-yellow-600 disabled:opacity-60"
          >
            🎙️ {listening ? "Słucham..." : ""}
          </button>
        </div>

        <button
          onClick={handleSend}
          disabled={loading}
          className="w-full rounded-lg bg-green-600 px-5 py-3 text-white shadow-md transition hover:bg-green-700 disabled:opacity-60"
        >
          ➤ Wyślij do Gemini
        </button>
      </div>
    </div>
  );
}

export default GeminiChat;
