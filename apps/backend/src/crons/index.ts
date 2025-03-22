import cron from "node-cron";
import { fetchUserEvents } from "./eventHandlers";
import { sendEmailNotifications } from "./mailer"

console.log("⏳ CRON rozpoczął działanie...");

cron.schedule("0 * * * *", (time) => { 
    // Co każdą pełną godzinę
    console.log("CRON odpalił o", time); 
    fetchUserEvents().then(async (rawUserNotifications)=>{
        console.log("Raw user notifications: ", rawUserNotifications);
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

        console.log("userNotifications: ", JSON.stringify(userNotifications, null, 2));

        if (Object.keys(userNotifications).length === 0) {
            console.log("Brak aktywnych powiadomień e-mail.");
            return;
        }

        void await sendEmailNotifications(userNotifications);
 
    }).catch(error => {
        console.error(error);
    })
});
