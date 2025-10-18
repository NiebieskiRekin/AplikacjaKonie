import { Logger } from "drizzle-orm";
import { log } from "../logs/logger";

class DrizzleWinstonLogger implements Logger {
  /**
   * Wymagana metoda do logowania zapytań SQL przez Drizzle ORM.
   * * @param query - Surowe zapytanie SQL.
   * @param params - Parametry przekazane do zapytania.
   */
  logQuery(query: string, params: unknown[]): void {
    const fullMessage =
      `SQL Query: ${query}` +
      (params.length > 0 ? ` | Params: ${JSON.stringify(params)}` : "");

    // Logowanie zapytania SQL jako 'debug' jest typowe.
    // Używamy "db" jako kategorii.
    // Przekazujemy pełną wiadomość jako "message", a zapytanie SQL jako część błędu/stos,
    // aby było ładnie wyświetlone w formacie NDJSON/tekstowym.
    log("db", "debug", fullMessage, new Error(query));
  }

  /**
   * Opcjonalna metoda do logowania innych wiadomości od Drizzle (np. 'connect', 'disconnect').
   * Drizzle ORM może już nie używać tej metody do logowania zapytań SQL,
   * ale warto ją zostawić dla innych komunikatów.
   */
  log(message: string): void {
    // W nowszych wersjach Drizzle, zapytania SQL są obsługiwane przez logQuery.
    // Ta metoda przechwytuje inne komunikaty.

    // Sprawdzenie na wypadek, gdyby Drizzle wciąż logował query w ten sposób (dla bezpieczeństwa, choć nie powinien)
    if (message.startsWith("query:")) {
      // Jeśli to jest query, używamy debug
      log("db", "debug", message.substring("query:".length).trim());
    } else {
      // Inne wiadomości od Drizzle (np. 'connect', 'disconnect')
      log("db", "info", message);
    }
  }
}

export { DrizzleWinstonLogger };
