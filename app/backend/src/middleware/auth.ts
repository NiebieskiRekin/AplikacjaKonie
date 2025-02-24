import { MiddlewareHandler, Context } from "hono";
import jwt from "jsonwebtoken";
import { ProcessEnv } from "../env";

export type UserPayload = {
  userId: number;
  email: string;
};

export const authMiddleware: MiddlewareHandler<{ Variables: { user: UserPayload } }> = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  console.log("Nagłówek autoryzacji:", authHeader); // 🔍 Sprawdzenie, czy nagłówek dociera

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Brak autoryzacji" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, ProcessEnv.JWT_SECRET) as UserPayload;
    console.log("Zweryfikowany użytkownik:", decoded); // 🔍 Sprawdzenie dekodowania
    c.set("user", decoded);
    await next();
  } catch (error) {
    console.error("Błąd weryfikacji tokena:", error); // 🔍 Sprawdzenie błędu
    return c.json({ error: "Nieprawidłowy token" }, 403);
  }
};

export const getUserFromContext = (c: Context<{ Variables: { user: UserPayload } }>): UserPayload | null => {
    const user = c.get("user");
    return user ? user : null;
  };
