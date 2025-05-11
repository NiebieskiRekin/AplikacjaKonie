import { db } from "@/backend/db";
import { rozrody, rozrodyInsertSchema } from "@/backend/db/schema";
import { Hono } from "hono";
import { UserPayload } from "@/backend/middleware/auth";
// import { describeRoute } from "hono-openapi";
// import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
// import { resolver } from "hono-openapi/zod";
import "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
// import { z } from "@hono/zod-openapi";

export const wydarzenia_rozrody_post = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().post("/rozrody", zValidator("json", rozrodyInsertSchema), async (c) => {
  const _rozrody = c.req.valid("json");
  console.log(_rozrody);
  _rozrody.kon = Number(_rozrody.kon);
  _rozrody.weterynarz = Number(_rozrody.weterynarz);

  const result = await db
    .insert(rozrody)
    .values(_rozrody)
    .returning()
    .then((res) => res[0]);

  return c.json(result, 201);
});
