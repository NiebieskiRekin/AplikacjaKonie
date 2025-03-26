import { Hono } from "hono";
import { firebaseNotificationsPublicConfig } from "../services/firebase";

const notificationsRoute = new Hono();

// Keep it public
notificationsRoute.get("/config", (c) => {
    try {
        return c.json(firebaseNotificationsPublicConfig, 200);
    } catch {
        return c.json({ error: "Błąd pobierania configuracji powiadomień" }, 500);
    }
})

export default notificationsRoute;