import cron from "node-cron";
import { fetchUserEvents } from "./eventHandlers";
import { sendEmailNotifications } from "./mailer";

/**
 * Zadanie cykliczne uruchamiane codziennie co godzinę
 */
cron.schedule("0 * * * *", () => {
  console.log("CRON: Uruchamiam harmonogram powiadomień");

  fetchUserEvents().then(async (userNotifications)=>{
    if (Object.keys(userNotifications).length === 0) {
      console.log("Brak aktywnych powiadomień.");
      return;
    }

    void await sendEmailNotifications(userNotifications);
  }).catch(
    (error)=>{console.error("Błąd CRON:", error);}
  )
});
