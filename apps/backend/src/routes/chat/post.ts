import { Hono } from "hono";
import { validator as zValidator, resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { auth, auth_vars } from "@/backend/auth";
import { konieInsertSchema, organization } from "@/backend/db/schema";
import { ProcessEnv } from "@/backend/env";
import { db } from "@/backend/db";
import { choroby } from "@/backend/db/schema";
import { eq, sql } from "drizzle-orm";
import { log } from "@/backend/logs/logger";

const BASE_DIR = path.resolve(__dirname, "../../public");
const API_KEY = ProcessEnv.AISTUDIO_API_KEY;
const GEMINI_MODEL = ProcessEnv.GEMINI_MODEL;

// const schemaPrompt = fs
//   .readFileSync(path.join(BASE_DIR, "schema.txt"), "utf-8")
//   .trim();

const schemaJson = JSON.parse(
  fs.readFileSync(path.join(BASE_DIR, "schema.json"), "utf-8").trim()
);

const TESTSET_PATH = path.join(BASE_DIR, "testset_response.json");

// const API_HOST =
//   process.env.API_HOST ||
//   (process.env.NODE_ENV === "production"
//     ? "https://moje-konie.at2k.pl"
//     : process.env.NODE_ENV === "development"
//       ? "https://konie-dev.at2k.pl"
//       : "http://localhost:3001");

const PORT = ProcessEnv.PORT;

// const files = [
//   "examples_konie.tsv",
//   "Inzynierka-choroby.tsv",
//   "Inzynierka-kowale.tsv",
//   "Inzynierka-podkucia.tsv",
//   "Inzynierka-rozrody.tsv",
//   "Inzynierka-weterynarze.tsv",
//   "Inzynierka-wydarzenia_profilaktyczne.tsv",
// ];

// const fileToEndpoint: Record<string, string> = {
//   "examples_konie.tsv": "/api/konie",
//   "Inzynierka-choroby.tsv": "/api/wydarzenia/choroby",
//   "Inzynierka-kowale.tsv": "/api/kowale",
//   "Inzynierka-podkucia.tsv": "/api/wydarzenia/podkucie",
//   "Inzynierka-rozrody.tsv": "/api/wydarzenia/rozrody",
//   "Inzynierka-weterynarze.tsv": "/api/weterynarze",
//   "Inzynierka-wydarzenia_profilaktyczne.tsv":
//     "/api/wydarzenia/zdarzenia_profilaktyczne",
// };

const endpointNames: Record<string, string> = {
  "api/konie": "konia",
  "api/kowale": "kowala",
  "api/weterynarze": "weterynarza",
  "api/wydarzenia/choroby": "chorobę",
  "api/wydarzenia/podkucie": "podkucie",
  "api/wydarzenia/leczenia": "leczenie",
  "api/wydarzenia/zdarzenia_profilaktyczne": "zdarzenie profilaktyczne",
  "api/wydarzenia/rozrody": "rozród",
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

function extractJsonFromText(text: string): string {
  text = extractJsonBlock(text);
  text = text.replace(/Endpoint:\s*`?(\/api\/[^\s`]+)`?/i, "").trim();

  return text;
}

const konieStringToJsonCodec = z.codec(
  z.string(),
  konieInsertSchema.omit({ hodowla: true, id: true }),
  {
    decode: (value, ctx) => {
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch (e) {
          ctx.issues.push({
            code: "custom",
            message: (e as Error).message,
            path: [],
            input: value,
          });
        }
      }
      return value;
    },
    encode: (value) => {
      return JSON.stringify(value);
    },
  }
);

const sendRequest = async (
  endpoint: string,
  jsonData: string,
  token: string
) => {
  const formData = new FormData();

  if (endpoint === "api/konie") {
    const kon_result = konieStringToJsonCodec.safeDecode(jsonData);
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
    const curlCommand = `curl --location 'http://localhost:${PORT}/${endpoint}' \\\n--header 'accept: application/json' \\\n--header 'Content-Type: multipart/form-data' \\\n--header 'Authorization": Bearer ${token}' --header 'Origin: ${ProcessEnv.BETTER_AUTH_URL}' \\\n--form 'nazwa=${kon.nazwa}' \\\n--form 'numerPrzyzyciowy=${kon.numerPrzyzyciowy}' \\\n--form 'numerChipa=${kon.numerChipa}' \\\n--form 'rocznikUrodzenia=${kon.rocznikUrodzenia}' \\\n--form 'dataPrzybyciaDoStajni=${kon.dataPrzybyciaDoStajni}' \\\n--form 'dataOdejsciaZeStajni=${kon.dataOdejsciaZeStajni}' \\\n--form 'rodzajKonia=${kon.rodzajKonia}' \\\n--form 'plec=${kon.plec}' \\\n--form 'file=false'`;
    console.log(`[sendRequest] Mulst curlCommand: ${curlCommand}`);

    // Wysłanie zapytania jako multipart/form-data
    try {
      console.log(
        `[sendRequest] POST (Multipart) do: http://localhost:${PORT}/${endpoint}`
      );

      const fetchRes = await fetch(`http://localhost:${PORT}/${endpoint}`, {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
          Origin: ProcessEnv.BETTER_AUTH_URL,
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
    const curlCommand = `curl --location 'http://localhost:${PORT}/${endpoint}' \\\n--header 'accept: application/json' \\\n--header 'Content-Type: application/json' \\\n--header 'Authorization: Bearer ${token}' \\\n--header 'Origin: ${ProcessEnv.BETTER_AUTH_URL}' \\\n--data '${jsonData}'`;

    console.log(`[sendRequest] curlCommand: ${curlCommand}`);

    try {
      console.log(
        `[sendRequest] POST (JSON) do: http://localhost:${PORT}/${endpoint}`
      );

      const fetchRes = await fetch(`http://localhost:${PORT}/${endpoint}`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Origin: ProcessEnv.BETTER_AUTH_URL,
        },
        body: jsonData,
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

// TODO
async function predictEndpoint(prompt: string) {
  const url = ProcessEnv.INTERNAL_PREDICT_URL;

  if (!url) {
    throw new Error("PREDICTOR_URL is not defined");
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      let errorBody = "Brak treści błędu";
      try {
        const jsonError = await res.json();
        errorBody = JSON.stringify(jsonError);
      } catch {
        errorBody = await res.text();
      }

      throw new Error(
        `Prediction API error (Status: ${res.status}, URL: ${url}): ${errorBody}`
      );
    }

    if (res.status === 204) {
      return "";
    }

    const data = await res.json();
    const typedData = data as { endpoint: string };
    log("Chat", "info", "Predicted endpoint:" + typedData.endpoint);

    return typedData.endpoint ?? "";
  } catch (err) {
    log("Chat", "error", String(err));
    return "";
  }
}

export function getSchemaPrompt(
  endpoint: string,
  schemaData: Record<string, any>
): string {
  if (!schemaData || !(endpoint in schemaData)) {
    return `(Brak schematu dla endpointu: ${endpoint})`;
  }

  const content = schemaData[endpoint];
  for (const [contentType, data] of Object.entries(content)) {
    if (typeof data === "object" && data !== null && "schema" in data) {
      try {
        const schemaPrompt = JSON.stringify(
          (data as { schema: unknown })["schema"],
          null,
          2
        );
        log("Chat", "info", contentType);
        return schemaPrompt;
      } catch {
        return "(Błąd podczas serializacji schematu)";
      }
    }
  }

  return "(Brak sekcji 'schema' w tym endpointzie)";
}

export interface TestExample {
  description: string;
  informations: string;
  output: string;
}

function normEp(ep: string): string {
  const trimmed = (ep || "").trim();
  return trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
}

function joinDescInfo(desc: string, info: string): string {
  if (!info) return desc.trim();
  return `${desc.trim()}\n${info.trim()}`;
}

/**
 * Wczytuje wszystkie przykłady dla danego endpointu z testset_response.json.
 * Zwraca tablicę krotek [prompt, output] lub [prompt, output_dict].
 */
export function loadAllExamplesForEndpoint(
  filePath: string,
  endpoint: string,
  decodeOutput = false
): Array<[string, any]> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Nie znaleziono pliku: ${filePath}`);
  }

  const rawText = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(rawText);

  if (typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Plik musi być słownikiem endpoint -> [lista obiektów].");
  }

  const epKey = normEp(endpoint);
  const candidates: Record<string, string> = {};

  for (const key of Object.keys(data)) {
    candidates[normEp(key)] = key;
  }

  if (!(epKey in candidates)) {
    const available = Object.keys(candidates).sort().join(", ");
    throw new Error(
      `Endpoint '${endpoint}' nie znaleziony. Dostępne: ${available}`
    );
  }

  const rawList = data[candidates[epKey]];
  if (!Array.isArray(rawList)) {
    throw new Error(`Wartość dla '${endpoint}' musi być listą obiektów.`);
  }

  const out: Array<[string, any]> = [];

  rawList.forEach((item: TestExample, i: number) => {
    console.log("Przykład", i, item);
    console.log(item);
    console.log("----");
    console.log(JSON.stringify(item));
    console.log("====");
    console.log(item.description);
    console.log(item.informations);
    console.log(item.output);

    if (!item.description || !item.output) {
      throw new Error(
        `[${endpoint}][${i}] musi być obiektem z polami description/informations/output.`
      );
    }

    const prompt = joinDescInfo(item.description, item.informations);

    try {
      const parsed = JSON.parse(item.output);
      out.push([prompt, decodeOutput ? parsed : item.output]);
    } catch (e: any) {
      throw new Error(
        `[${endpoint}][${i}] 'output' nie jest poprawnym JSON-em: ${e}`
      );
    }
  });

  return out;
}

export const gemini_chat_post = new Hono<auth_vars>().post(
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
                actionName: z.string(),
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
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      const userId = session?.user.id;
      const orgId = session?.session.activeOrganizationId;
      const token = session?.session.token;
      if (!userId || !orgId || !token)
        return c.json({ error: "Błąd autoryzacji" }, 401);
      const req_num = await db
        .select({
          liczba_requestow: organization.liczba_requestow,
        })
        .from(organization)
        .where(eq(organization.id, orgId))
        .then((v) => v[0].liczba_requestow);
      if (req_num <= 0) {
        return c.json(
          {
            error: "Limit zapytań został wyczerpany",
          },
          400
        );
      }

      const { konie, kowale, weterynarze, prompt } = c.req.valid("json");
      if (!API_KEY) return c.json({ error: "Brak API_KEY" }, 500);

      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      const chat = model.startChat({ history: [] });

      // TODO
      const predictedEndpoint = await predictEndpoint(prompt);
      const schema_prompt = getSchemaPrompt(predictedEndpoint, schemaJson);
      const examples = loadAllExamplesForEndpoint(
        TESTSET_PATH,
        predictedEndpoint,
        false
      );

      console.log("Przewidziany endpoint:", predictedEndpoint);
      let _result;
      let chorobaList: { id: number; opis: string | null }[] = [];
      let chorobyText = "";

      if (predictedEndpoint == "api/wydarzenia/leczenia") {
        let _prompt = `Poniżej znajdują się dane o koniach, podaj mi tylko id konia, o którym mowa jest tekście.`;
        _prompt += `Konie:\n${konie}\n`;
        _prompt += `Tekst: ${prompt}`;
        _result = await chat.sendMessage(_prompt);
        const konId = parseInt(_result.response.text(), 10);
        console.log(_result.response.text());
        console.log("Parsed konId:", konId);

        chorobaList = await db
          .select({ id: choroby.id, opis: choroby.opisZdarzenia })
          .from(choroby)
          .where(eq(choroby.kon, konId));

        chorobyText = chorobaList
          .map((c) => `ID: ${c.id}, Opis: ${c.opis || "Brak opisu"}`)
          .join("\n* ");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      let fullPrompt = `Schemat danych wejściowych dla ${predictedEndpoint} (format JSON):\n${schema_prompt}\n\n
        Twoim zadaniem jest wygenerować poprawny obiekt JSON na podstawie opisu użytkownika.\n
        Oto przykłady treningowe, które pomogą Ci zrozumieć, jak powinien wyglądać format JSON odpowiedzi:\n\n`;

      for (const [user, json] of examples) {
        fullPrompt += `Użytkownik: ${user}\nOdpowiedź JSON:\n${json}\n\n`;
      }
      fullPrompt += `Poniżej masz aktualny stan bazy danych:\n`;
      fullPrompt += `Konie:\n${konie}\n`;
      fullPrompt += `Kowale:\n${kowale}\n`;
      fullPrompt += `Weterynarze:\n${weterynarze}\n`;

      if (predictedEndpoint == "api/wydarzenia/leczenia") {
        fullPrompt += `Choroby konia ${chorobyText}:\n\n`;
      }

      fullPrompt += `Dziś jest ${new Date().toLocaleDateString("pl-PL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })}.\n\n`;
      fullPrompt += `Teraz wygeneruj JSON na podstawie poniższego opisu użytkownika:\n\n`;
      fullPrompt += `Użytkownik: ${prompt}\nOdpowiedź JSON:\n`;

      console.log("Wysyłam:", fullPrompt);

      const result = await chat.sendMessage(fullPrompt);
      await db
        .update(organization)
        .set({
          liczba_requestow: sql<Number>`${organization.liczba_requestow} - 1`,
        })
        .where(eq(organization.id, orgId));

      console.log("Odpowiedź Gemini:", result.response.text());

      const clean = extractJsonFromText(result.response.text());
      const actionName = endpointNames[predictedEndpoint] || "element";
      const { fetchText, curlCommand, status } = await sendRequest(
        predictedEndpoint,
        clean,
        token
      );

      return c.json({
        endpoint: predictedEndpoint,
        actionName: actionName,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        generated: clean,
        curl: curlCommand,
        response: fetchText,
        status: status,
      });
    } catch (err) {
      log("Chat", "error", String(err));
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
