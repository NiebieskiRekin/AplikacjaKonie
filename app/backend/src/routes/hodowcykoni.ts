import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db, eq } from "../db";
import { hodowcyKoni, hodowcyKoniInsertSchema } from "../db/schema";
import { authMiddleware, UserPayload } from "../middleware/auth";

export const hodowcyKoniRoute =new Hono<{Variables: UserPayload }>();
hodowcyKoniRoute.use(authMiddleware);

hodowcyKoniRoute
  .get("/", async (c) => {
    const hodowcyKoni_result = await db.select().from(hodowcyKoni);
    return c.json(hodowcyKoni_result);
  })
  .post("/", zValidator("json", hodowcyKoniInsertSchema), async (c) => {
    const hodowca = c.req.valid("json");

    const result = await db
      .insert(hodowcyKoni)
      .values(hodowca)
      .returning()
      .then((res) => res[0]);

    c.status(201);
    return c.json(result);
  })
  .get("/:id{[0-9]+}", async (c) => {
    const id = Number.parseInt(c.req.param("id"));

    const hodowca = await db
      .select()
      .from(hodowcyKoni)
      .where(eq(hodowcyKoni.id, id))
      .then((res) => res[0]);

    if (!hodowca) {
      return c.notFound();
    }

    return c.json(hodowca);
  })
  .delete("/:id{[0-9]+}", async (c) => {
    const id = Number.parseInt(c.req.param("id"));

    const hodowca = await db
      .delete(hodowcyKoni)
      .where(eq(hodowcyKoni.id, id)) // NOTE: order matters
      .returning()
      .then((res) => res[0]);

    if (!hodowca) {
      return c.notFound();
    }

    return c.json(hodowca);
  });