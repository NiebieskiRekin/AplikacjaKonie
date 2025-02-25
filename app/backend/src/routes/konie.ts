import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { konie, users, usersInsertSchema, konieInsertSchema } from "../db/schema";
import { db } from "../db";
import { authMiddleware, getUserFromContext, UserPayload } from "../middleware/auth";
import { zValidator } from "@hono/zod-validator";

const horses = new Hono<{ Variables: { user: UserPayload } }>();

horses.use(authMiddleware);

horses.get("/", async (c) => {
  const user = getUserFromContext(c);

  if (!user) {
    return c.json({ error: "Błąd autoryzacji" }, 401);
  }

  console.log(`🔍 Pobieranie koni dla użytkownika: ${user.email}`);

  const hodowla = await db
    .select()
    .from(users)
    .where(eq(users.id, user.userId))
    .then((res) => res[0]);
  // Pobieramy konie tylko tej samej hodowli
  const horsesList = await db
    .select()
    .from(konie)
    .where(eq(konie.hodowla, hodowla.hodowla));

  console.log("🐴 Lista koni:", horsesList);

  return c.json(horsesList);
});

// add new koń
horses.post("/", async (c) => {
    try {
      const user = getUserFromContext(c);
      if (!user) return c.json({ error: "Błąd autoryzacji" }, 401);
  
      const hodowla = await db
        .select({ hodowla: users.hodowla })
        .from(users)
        .where(eq(users.id, user.userId))
        .then((res) => res[0]?.hodowla);
  
      if (!hodowla) {
        return c.json({ error: "Nie znaleziono hodowli użytkownika" }, 403);
      }
  
      const formData = await c.req.formData();
      const body = {
        nazwa: formData.get("nazwa") as string,
        numerPrzyzyciowy: formData.get("numerPrzyzyciowy") as string,
        numerChipa: formData.get("numerChipa") as string,
        rocznikUrodzenia: parseInt(formData.get("rocznikUrodzenia") as string, 10),
        dataPrzybyciaDoStajni: formData.get("dataPrzybyciaDoStajni")
          ? (formData.get("dataPrzybyciaDoStajni") as string)
          : null,
        dataOdejsciaZeStajni: formData.get("dataOdejsciaZeStajni")
          ? (formData.get("dataOdejsciaZeStajni") as string)
          : null,
        rodzajKonia: formData.get("rodzajKonia") as "Konie hodowlane" | "Konie rekreacyjne" | "Źrebaki" | "Konie sportowe",
        plec: formData.get("plec") as "samiec" | "samica",
        hodowla: hodowla,
      };
  
      console.log("🐴 Otrzymane dane konia:", body);
  
      const validationResult = konieInsertSchema.safeParse(body);
      if (!validationResult.success) {
        console.error("Błąd walidacji:", validationResult.error);
        return c.json({ success: false, error: validationResult.error }, 400);
      }
  
      //Wstawienie danych do bazy
      const newHorse = await db.insert(konie).values(body).returning();
  
      return c.json({ message: "Koń został dodany!", horse: newHorse });
    } catch (error) {
      console.error("Błąd podczas dodawania konia:", error);
      return c.json({ error: "Błąd podczas dodawania konia" }, 500);
    }
  });

export default horses;
