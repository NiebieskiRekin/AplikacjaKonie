import cron from "node-cron";
import { fetchUserEvents } from "./eventHandlers";
import { log } from "../logs/logger";
import { sendEmailNotifications } from "../mailer/reminderMailer";

/**
 * Zadanie cykliczne uruchamiane codziennie co godzinę
 */
cron.schedule("0 * * * *", () => {
  log("Cron", "info", "CRON: Uruchamiam harmonogram powiadomień");

  fetchUserEvents()
    .then(async (userNotifications) => {
      if (Object.keys(userNotifications).length === 0) {
        log("Notifications", "info", "Brak aktywnych powiadomień.");
        return;
      }

      void (await sendEmailNotifications(userNotifications));
    })
    .catch((error) => {
      log("Cron", "error", "Błąd CRON:", error as Error);
    });
});
