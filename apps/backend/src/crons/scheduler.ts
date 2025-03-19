import cron from "node-cron";
import { fetchUserEvents } from "./eventHandlers";
import { sendEmailNotifications } from "./mailer";

/**
 * Zadanie cykliczne uruchamiane codziennie o godzinę
 */
cron.schedule("* * * * * *", async () => {
  console.log("CRON: Uruchamiam harmonogram powiadomień");

  try {
    const userNotifications = await fetchUserEvents();

    if (Object.keys(userNotifications).length === 0) {
      console.log("Brak aktywnych powiadomień.");
      return;
    }

    await sendEmailNotifications(userNotifications);
  } catch (error) {
    console.error("Błąd CRON:", error);
  }
});
