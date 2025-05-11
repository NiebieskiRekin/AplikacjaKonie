import { db } from "@/backend/db";
import { leczenia, leczeniaInsertSchema } from "@/backend/db/schema";
import { Hono } from "hono";
import { UserPayload } from "@/backend/middleware/auth";
// import { describeRoute } from "hono-openapi";
// import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
// import { resolver } from "hono-openapi/zod";
import "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
// import { z } from "@hono/zod-openapi";

export const wydarzenia_leczenia_post = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().post("/leczenia", zValidator("json", leczeniaInsertSchema), async (c) => {
  const _leczenia = c.req.valid("json");
  _leczenia.kon = Number(_leczenia.kon);

  const result = await db
    .insert(leczenia)
    .values(_leczenia)
    .returning()
    .then((res) => res[0]);

  return c.json(result, 201);
});
