import { auth_vars } from "@/backend/lib/auth";
import { MiddlewareHandler } from "hono";
import { auth } from "../lib/auth";

export const auth_middleware: MiddlewareHandler<auth_vars> = async (
  c,
  next
) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
};
