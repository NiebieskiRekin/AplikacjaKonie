import cron from "node-cron";
import { fetchUserEvents } from "./eventHandlers";
import { log } from "../logs/logger";
import { sendEmailNotifications } from "../mailer/reminderMailer";

log("Cron", "info", "CRON subprocess started");

cron.schedule("0 * * * *", (time) => {
  // Co każdą pełną godzinę
  log(
    "Cron",
    "info",
    "CRON Job fetchUserEvents run at " + JSON.stringify(time)
  );
  fetchUserEvents()
    .then(async (rawUserNotifications) => {
      log(
        "Notifications",
        "debug",
        "Raw user notifications: " + JSON.stringify(rawUserNotifications)
      );
      const userNotifications = Object.fromEntries(
        Object.entries(rawUserNotifications).map(([email, { wydarzenia }]) => [
          email,
          {
            wydarzenia: Object.fromEntries(
              Object.entries(wydarzenia).map(([rodzajZdarzenia, konie]) => [
                rodzajZdarzenia,
                // Usunięcie duplikatów koni dla danego rodzaju zdarzenia
                Object.values(
                  konie.reduce<
                    Record<
                      string,
                      {
                        nazwaKonia: string;
                        rodzajKonia: string;
                        dataWaznosci: string;
                      }
                    >
                  >(
                    (acc, { nazwaKonia, rodzajKonia, dataWaznosci }) => {
                      // Jeżeli koń już istnieje w akumulatorze i ma starszą datę, nadpisujemy nową datą ważności
                      if (
                        !acc[nazwaKonia] ||
                        acc[nazwaKonia].dataWaznosci < dataWaznosci
                      ) {
                        acc[nazwaKonia] = {
                          nazwaKonia,
                          rodzajKonia,
                          dataWaznosci,
                        };
                      }
                      return acc;
                    },
                    {} // Początkowa pusta mapa akumulatora
                  )
                ),
              ])
            ),
          },
        ])
      );

      log(
        "Notifications",
        "debug",
        "userNotifications: " + JSON.stringify(userNotifications, null)
      );

      if (Object.keys(userNotifications).length === 0) {
        log("Notifications", "debug", "Brak aktywnych powiadomień e-mail");
        return;
      }

      void (await sendEmailNotifications(userNotifications));
    })
    .catch((error) => {
      log("Notifications", "error", "", error as Error);
    });
});
