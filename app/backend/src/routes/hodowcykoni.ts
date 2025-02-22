import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import {
  hodowcyKoni,
  hodowcyKoniSelectSchema,
  hodowcyKoniInsertSchema,
  hodowcyKoniUpdateSchema,
} from "../db/schema";
import { eq } from "drizzle-orm";

export const hodowcyKoniRoute = new Hono()
  .get("/", async (c) => {
    const hodowcyKoni_result = await db.select().from(hodowcyKoni);
    return c.json(hodowcyKoni_result);
  })
  .post("/", zValidator("json", hodowcyKoniInsertSchema), async (c) => {
    const hodowca: any = c.req.valid("json"); // 'any' type is required, otherwise some errors are showing up

    const result = await db
      .insert(hodowcyKoni)
      .values(hodowca)
      .returning()
      .then((res) => res[0]);

    c.status(201);
    return c.json(result);
  })
  .get("/:id{[0-9]+}", async (c) => {
    const id: any = Number.parseInt(c.req.param("id"));

    const hodowca = await db
      .select()
      .from(hodowcyKoni)
      .where(eq(id, hodowcyKoni.id))
      .then((res) => res[0]);

    if (!hodowca) {
      return c.notFound();
    }

    return c.json(hodowca);
  })
  .delete("/:id{[0-9]+}", async (c) => {
    const id: any = Number.parseInt(c.req.param("id"));

    const hodowca = await db
      .delete(hodowcyKoni)
      .where(eq(id, hodowcyKoni.id))
      .returning()
      .then((res) => res[0]);

    if (!hodowca) {
      return c.notFound();
    }

    return c.json(hodowca);
  });
