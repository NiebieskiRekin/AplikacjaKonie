import { MiddlewareHandler, Context } from "hono";
// import jwt from "jsonwebtoken";
import { ProcessEnv } from "../env";

import { decode, sign, verify, jwt, JwtVariables } from 'hono/jwt'
import { JWTPayload } from "hono/utils/jwt/types";

export type UserPayload = {
  userId: number;
  // email: string;
};

export const authMiddleware: MiddlewareHandler<{ Variables: UserPayload }> = async (c, next) => {
  
  const authHeader = c.req.header("Authorization");

  console.log("Nagłówek autoryzacji:", authHeader); // 🔍 Sprawdzenie, czy nagłówek dociera

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Brak autoryzacji" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    // const token = 
    const decoded = await verify(token,ProcessEnv.JWT_SECRET)
    // const decoded = jwt.verify(token, ProcessEnv.JWT_SECRET) as UserPayload;
    console.log("Zweryfikowany użytkownik:", decoded); // 🔍 Sprawdzenie dekodowania
    c.set("userId", decoded.userId as number);
    await next();
  } catch (error) {
    console.error("Błąd weryfikacji tokena:", error); // 🔍 Sprawdzenie błędu
    return c.json({ error: "Nieprawidłowy token" }, 403);
  }
};

export function getUserFromContext(c: Context<{ Variables: UserPayload; }>)  {
  const user = c.get("userId");
  return user;
}

// export const getUserFromContext = (c: Context<{ Variables: UserPayload; }>): UserPayload | null => {
//     
// };
