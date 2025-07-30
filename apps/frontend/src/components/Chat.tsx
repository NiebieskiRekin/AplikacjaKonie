import { useState, useEffect } from "react";
import { APIClient } from "@/frontend/lib/api-client";
import type { RodzajKonia } from "@aplikacja-konie/backend/schema";

type Message = {
  role: "user" | "gemini";
  text: string;
};
import { type Horse } from "../components/components/Kon";
type Person = { id: number; imieINazwisko: string };

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
        const parsedResponse = JSON.parse(data.response);

        if (parsedResponse.message) {
          setMessages((prev) => [
            ...prev,
            { role: "gemini", text: parsedResponse.message },
          ]);
        } else {
          if (data.status == 200 || data.status == 201) {
            setMessages((prev) => [
              ...prev,
              { role: "gemini", text: "Dodano" },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              { role: "gemini", text: "Błąd podczas dodawania" },
            ]);
          }
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
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-4 md:p-6">
      <div className="mb-6 w-full max-w-2xl text-center text-3xl font-bold text-white">
        🧠 Chat z Gemini
      </div>

      <div className="w-full max-w-2xl space-y-4 rounded-lg bg-white p-4 shadow-md md:p-6">
        <div className="h-80 space-y-2 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`w-fit max-w-full rounded-xl px-4 py-2 ${
                msg.role === "user"
                  ? "ml-auto bg-green-100 text-right"
                  : "mr-auto bg-gray-200 text-left"
              }`}
            >
              <span className="block text-sm font-semibold text-gray-700">
                {msg.role === "user" ? "Ty" : "Gemini"}:
              </span>
              <pre className="whitespace-pre-wrap">{msg.text}</pre>
            </div>
          ))}
          {loading && (
            <p className="text-sm text-gray-500 italic">Gemini pisze...</p>
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
