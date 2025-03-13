import cron from "node-cron";
import { fetchUserEvents } from "./eventHandlers";
import { sendEmailNotifications } from "./mailer"

cron.schedule("0 * * * *", async () => {

    try {
        const userNotifications = await fetchUserEvents();

        if (Object.keys(userNotifications).length === 0) {
            console.log("Brak aktywnych powiadomień e-mail.");
            return;
        }

        await sendEmailNotifications(userNotifications);
    } catch (error) {
        console.error(error);
    }
});
