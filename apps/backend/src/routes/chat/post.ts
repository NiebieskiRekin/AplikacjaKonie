import { Hono } from "hono";
import { validator as zValidator, resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { z } from "zod";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { UserPayload } from "@/backend/middleware/auth";
import { konieInsertSchema } from "@/backend/db/schema";

dotenv.config();

const BASE_DIR = path.resolve(__dirname, "../../public");
const API_KEY = process.env.AISTUDIO_API_KEY;

const schemaPrompt = fs
  .readFileSync(path.join(BASE_DIR, "schema.txt"), "utf-8")
  .trim();
const files = [
  "examples_konie.tsv",
  "Inzynierka-choroby.tsv",
  "Inzynierka-kowale.tsv",
  "Inzynierka-podkucia.tsv",
  "Inzynierka-rozrody.tsv",
  "Inzynierka-weterynarze.tsv",
  "Inzynierka-wydarzenia_profilaktyczne.tsv",
];

const fileToEndpoint: Record<string, string> = {
  "examples_konie.tsv": "/api/konie",
  "Inzynierka-choroby.tsv": "/api/wydarzenia/choroby",
  "Inzynierka-kowale.tsv": "/api/kowale",
  "Inzynierka-podkucia.tsv": "/api/wydarzenia/podkucie",
  "Inzynierka-rozrody.tsv": "/api/wydarzenia/rozrody",
  "Inzynierka-weterynarze.tsv": "/api/weterynarze",
  "Inzynierka-wydarzenia_profilaktyczne.tsv":
    "/api/wydarzenia/zdarzenia_profilaktyczne",
};

const promptSchema = z.object({
  konie: z.string(),
  prompt: z.string(),
  kowale: z.string(),
  weterynarze: z.string(),
});

function extractJsonBlock(text: string): string {
  if (text.startsWith("```")) {
    return text
      .split("\n")
      .filter((line) => !line.trim().startsWith("```"))
      .join("\n")
      .trim();
  }
  return text
    .replace(/^Odpowiedź JSON:/i, "")
    .replace("Odpowiedź JSON:", "")
    .replace(/```json\n?/gi, "")
    .replace(/```$/, "")
    .replace(/```/, "")
    .trim();
}

function extractEndpointAndJson(text: string): [string, string] {
  text = extractJsonBlock(text);
  const match = text.match(/Endpoint:\s*`?(\/api\/[^\s`]+)`?/);
  const endpoint = match ? match[1].trim() : "NIEZNANY";
  const cleaned = text.replace(/Endpoint:\s*`?(\/api\/[^\s`]+)`?/, "").trim();
  return [endpoint, cleaned];
}

const sendRequest = async (
  endpoint: string,
  jsonData: unknown,
  token: string
) => {
  const formData = new FormData();

  if (endpoint === "/api/konie") {
    const kon_result = await konieInsertSchema.spa(jsonData);
    if (!kon_result.success) {
      throw new Error(
        `Błąd wysyłania zapytania: ${(kon_result.error as Error).message}`
      );
    }
    const kon = kon_result.data;
    // Dodajemy dane formularza
    formData.append("nazwa", kon.nazwa || "");
    formData.append("numerPrzyzyciowy", kon.numerPrzyzyciowy || "");
    formData.append("numerChipa", kon.numerChipa || "");
    formData.append("rocznikUrodzenia", kon.rocznikUrodzenia?.toString() || "");
    formData.append("dataPrzybyciaDoStajni", kon.dataPrzybyciaDoStajni || "");
    formData.append("dataOdejsciaZeStajni", kon.dataOdejsciaZeStajni || "");
    formData.append("rodzajKonia", kon.rodzajKonia || "");
    formData.append("plec", kon.plec || "");
    formData.append("file", "false");

    // Generowanie komendy curl
    const curlCommand = `curl --location 'http://localhost:3001${endpoint}' \\\n--header 'accept: application/json' \\\n--header 'Content-Type: multipart/form-data' \\\n--header 'Cookie: ACCESS_TOKEN=${token}' \\\n--form 'nazwa=${kon.nazwa}' \\\n--form 'numerPrzyzyciowy=${kon.numerPrzyzyciowy}' \\\n--form 'numerChipa=${kon.numerChipa}' \\\n--form 'rocznikUrodzenia=${kon.rocznikUrodzenia}' \\\n--form 'dataPrzybyciaDoStajni=${kon.dataPrzybyciaDoStajni}' \\\n--form 'dataOdejsciaZeStajni=${kon.dataOdejsciaZeStajni}' \\\n--form 'rodzajKonia=${kon.rodzajKonia}' \\\n--form 'plec=${kon.plec}' \\\n--form 'file=false'`;

    // Wysłanie zapytania jako multipart/form-data
    try {
      const fetchRes = await fetch(`http://localhost:3001${endpoint}`, {
        method: "POST",
        headers: {
          accept: "application/json",
          Cookie: "ACCESS_TOKEN=" + token,
        },
        body: formData, // Wysłanie danych w formacie multipart/form-data
      });

      const fetchText = await fetchRes.text();

      return {
        fetchText,
        curlCommand,
        status: fetchRes.status,
      };
    } catch (err) {
      throw new Error(`Błąd wysyłania zapytania: ${(err as Error).message}`);
    }
  } else {
    // Standardowe JSON dla innych endpointów
    const curlJson = JSON.stringify(jsonData, null, 2).replace(/'/g, "\\'");
    const curlCommand = `curl --location 'http://localhost:3001${endpoint}' \\\n--header 'accept: application/json' \\\n--header 'Content-Type: application/json' \\\n--header 'Cookie: ACCESS_TOKEN=${token}' \\\n--data '${curlJson}'`;

    try {
      const fetchRes = await fetch(`http://localhost:3001${endpoint}`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Cookie: "ACCESS_TOKEN=" + token,
        },
        body: JSON.stringify(jsonData),
      });

      const fetchText = await fetchRes.text();

      return {
        fetchText,
        curlCommand,
        status: fetchRes.status,
      };
    } catch (err) {
      throw new Error(`Błąd wysyłania zapytania: ${(err as Error).message}`);
    }
  }
};

export const gemini_chat_post = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().post(
  "/",
  zValidator("json", promptSchema),
  describeRoute({
    tags: ["Gemini"],
    summary: "Wygeneruj JSON z promptu i wyślij do endpointa",
    responses: {
      200: {
        description: "Odpowiedź Gemini + wynik zapytania",
        content: {
          [JsonMime]: {
            schema: resolver(
              z.object({
                endpoint: z.string(),
                generated: z.any(),
                curl: z.string(),
                response: z.any(),
                status: z.number(),
              })
            ),
          },
        },
      },
      400: {
        description: "Błąd walidacji lub odpowiedzi",
        content: {
          [JsonMime]: { schema: resolver(response_failure_schema) },
        },
      },
    },
  }),
  async (c) => {
    try {
      const { konie, kowale, weterynarze, prompt } = c.req.valid("json");
      const cookieHeader = c.req.header("cookie") || "";
      const tokenMatch = cookieHeader.match(/ACCESS_TOKEN=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : undefined;
      if (!API_KEY) return c.json({ error: "Brak API_KEY" }, 500);
      if (!token)
        return c.json({ error: "Brak ACCESS_TOKEN w ciasteczkach" }, 401);

      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const chat = model.startChat({ history: [] });

      const examples: [string, string, string][] = [];
      for (const file of files) {
        const endpoint = fileToEndpoint[file];
        const rows = fs
          .readFileSync(path.join(BASE_DIR, file), "utf-8")
          .split("\n")
          .map((line) => line.split("\t"))
          .filter((r) => r.length >= 4 && r[0].trim() && r[1].trim())
          .sort(() => 0.5 - Math.random())
          .slice(0, 4);
        for (const [p, j] of rows)
          examples.push([endpoint, p.trim(), j.trim()]);
      }

      let fullPrompt = `Schemat danych wejściowych dla koni (format JSON):\n${schemaPrompt}\n\nTwoim zadaniem jest wygenerować poprawny obiekt JSON na podstawie opisu użytkownika. Podaj również endpoint, do którego należy wysłać ten JSON.\nOto przykłady:\n\n`;
      for (const [endpoint, user, json] of examples) {
        fullPrompt += `Endpoint: ${endpoint}\nUżytkownik: ${user}\nOdpowiedź JSON:\n${json}\n\n`;
      }
      fullPrompt += `Poniżej masz aktualny stan bazy danych:\n`;
      fullPrompt += `Konie:\n${konie}\n`;
      fullPrompt += `Kowale:\n${kowale}\n`;
      fullPrompt += `Weterynarze:\n${weterynarze}\n\n`;
      fullPrompt += `Dziś jest ${new Date().toLocaleDateString("pl-PL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })}.\n\n`;
      fullPrompt += `Teraz wygeneruj JSON na podstawie poniższego opisu użytkownika:\n\n`;
      fullPrompt += `Użytkownik: ${prompt}\nOdpowiedź JSON:\n`;

      const result = await chat.sendMessage(fullPrompt);

      const [endpoint, clean] = extractEndpointAndJson(result.response.text());
      let jsonData;
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        jsonData = JSON.parse(clean);
      } catch (err) {
        return c.json(
          {
            error: "Błąd Gemini lub parsowania",
            message: (err as Error).message,
            raw: clean,
            full: result.response.text(),
          },
          400
        );
      }
      const { fetchText, curlCommand, status } = await sendRequest(
        endpoint,
        jsonData,
        token
      );

      return c.json({
        endpoint,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        generated: jsonData,
        curl: curlCommand,
        response: fetchText,
        status: status,
      });
    } catch (err) {
      return c.json(
        {
          error: "Błąd Gemini lub parsowania",
          message: (err as Error).message,
          stack: (err as Error).stack,
        },
        400
      );
    }
  }
);
