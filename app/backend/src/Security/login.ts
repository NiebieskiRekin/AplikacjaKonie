import { Hono } from "hono";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { JWT_SECRET } from "../env";
import { db } from "../db";

const login = new Hono().post("/", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email i password są wymagane." }, 400);
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!user) {
      return c.json({ error: "Nieprawidłowe dane logowania." }, 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return c.json({ error: "Nieprawidłowe dane logowania." }, 401);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return c.json({ token });
  } catch (error) {
    console.error("Błąd podczas logowania:", error);
    return c.json({ error: "Wewnętrzny błąd serwera" }, 500);
  }
});

// Uruchomienie serwera
export default login;
