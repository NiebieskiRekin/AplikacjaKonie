import { z } from "@hono/zod-openapi";

export const JsonMime = "application/json";

export const response_failure_schema = z.object({
  error: z.string(),
});
