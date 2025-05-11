import { db } from "@/backend/db";
import { choroby, chorobyInsertSchema } from "@/backend/db/schema";
import { Hono } from "hono";
import { UserPayload } from "@/backend/middleware/auth";
// import { describeRoute } from "hono-openapi";
// import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
// import { resolver } from "hono-openapi/zod";
import "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
// import { z } from "@hono/zod-openapi";

export const wydarzenia_choroby_post = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().post("/choroby", zValidator("json", chorobyInsertSchema), async (c) => {
  const _choroby = c.req.valid("json");
  _choroby.kon = Number(_choroby.kon);

  const result = await db
    .insert(choroby)
    .values(_choroby)
    .returning()
    .then((res) => res[0]);

  return c.json(result, 201);
});
