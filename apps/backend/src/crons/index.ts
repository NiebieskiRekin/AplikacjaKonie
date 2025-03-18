import cron from "node-cron";
import { fetchUserEvents } from "./eventHandlers";
import { sendEmailNotifications } from "./mailer"

console.log("⏳ CRON rozpoczął działanie...");

cron.schedule("0 * * * *", async () => { // Co każdą pełną godzinę
    // Takie consol logi dot. cronów nie wiem czy nie chciałbym mieć 
    // w jakimś osobnym pliku na serwerze lub w tabeli w db (z tego co kojarzę mamy mało miejsca,
    // więc raczje odpada, ale częste czyszczenie).
    console.log("CRON odpalił o", new Date().toLocaleTimeString()); 

    try {
        const rawUserNotifications = await fetchUserEvents();

        const userNotifications = Object.fromEntries(
            Object.entries(rawUserNotifications).map(([email, { wydarzenia }]) => [
                email,
                {
                    wydarzenia: Object.fromEntries(
                        Object.entries(wydarzenia).map(([rodzajZdarzenia, konie]) => [
                            rodzajZdarzenia,
                            // Usunięcie duplikatów koni dla danego rodzaju zdarzenia
                            Object.values(
                                konie.reduce<Record<string, { nazwaKonia: string; rodzajKonia: string; dataWaznosci: string }>>(
                                    (acc, { nazwaKonia, rodzajKonia, dataWaznosci }) => {
                                        // Jeżeli koń już istnieje w akumulatorze i ma starszą datę, nadpisujemy nową datą ważności
                                        if (!acc[nazwaKonia] || acc[nazwaKonia].dataWaznosci < dataWaznosci) {
                                            acc[nazwaKonia] = { nazwaKonia, rodzajKonia, dataWaznosci };
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

        if (Object.keys(userNotifications).length === 0) {
            console.log("Brak aktywnych powiadomień e-mail.");
            return;
        }

        console.log(JSON.stringify(userNotifications, null, 2));

        await sendEmailNotifications(userNotifications);
    } catch (error) {
        console.error(error);
    }
});
