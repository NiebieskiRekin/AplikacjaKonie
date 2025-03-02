import { MiddlewareHandler, Context } from "hono";
import { __prod__, ProcessEnv } from "../env";

import { sign, verify } from 'hono/jwt'
import { db, eq } from "../db";
import { users } from "../db/schema";

import {
  getCookie,
  deleteCookie,
} from 'hono/cookie'


export const ACCESS_TOKEN = 'ACCESS_TOKEN';
export const REFRESH_TOKEN = 'REFRESH_TOKEN';

export type RefreshTokenData = {
  userId: number;
  refreshTokenVersion?: number;
};

// TODO: extend type with cached info about hodowla and user type to be stored in Window: sessionStorage (single tab only) 
export type UserPayload = {
  userId: number;
  // email: string;
};


const thirty_days = 30*24*60;
const fifteen_minutes = 60 * 15;

export async function createAccessToken(user_id: number){
  const now = Math.floor(Date.now() / 1000);
  return sign(
    { userId: user_id, exp: now + fifteen_minutes},
    ProcessEnv.JWT_SECRET,
  );
}

export async function createAuthTokens(
  user: {id: number, refreshTokenVersion: number}
)  {
  const now = Math.floor(Date.now() / 1000);

  const refreshToken = sign(
    { userId: user.id, refreshTokenVersion: user.refreshTokenVersion, exp: now+thirty_days},
    ProcessEnv.REFRESH_JWT_SECRET,
  );

  const accessToken = sign(
    { userId: user.id, exp: now + fifteen_minutes},
    ProcessEnv.JWT_SECRET,
  );

  return {accessToken: await accessToken, refreshToken: await refreshToken};
};


export const access_cookie_opts = {
  httpOnly: true,
  secure: __prod__,
  sameSite: "lax",
  path: "/",
  domain: __prod__ ? `.${ProcessEnv.DOMAIN}` : "",
  maxAge: fifteen_minutes
} as const;

export const refresh_cookie_opts = {
  httpOnly: true,
  secure: __prod__,
  sameSite: "lax",
  path: "/refresh;/api/refresh",
  domain: __prod__ ? `.${ProcessEnv.DOMAIN}` : "",
  maxAge: thirty_days
} as const;


export async function checkTokens(tokens: {accessToken:string,refreshToken:string}){
  try {
    const decoded = <UserPayload>(await verify(tokens.accessToken,ProcessEnv.JWT_SECRET));
    return decoded;
  } catch {
    // Expired token, check refresh token
  }

  try {
    const data = <RefreshTokenData>(await verify(tokens.refreshToken, ProcessEnv.REFRESH_JWT_SECRET));
    const user = (await db.select().from(users).where(eq(users.id,data.userId)).limit(1)).at(0);
    if (!user || user.refreshTokenVersion !== data.refreshTokenVersion) {
      return null; // unauthorized
    }
    return {
      userId: data.userId,
    };
  } catch {
    return null; // unauthorized
  }
}


export const authMiddleware: MiddlewareHandler<{ Variables: UserPayload }> = async (c, next) => {
  const accessToken = getCookie(c,ACCESS_TOKEN);

  if (!accessToken) {
    return c.json({ error: "Brak autoryzacji" }, 401);
  }

  try {
    const decoded = await verify(accessToken,ProcessEnv.JWT_SECRET);
    // const decoded = jwt.verify(token, ProcessEnv.JWT_SECRET) as UserPayload;
    // console.log("Zweryfikowany użytkownik:", decoded); // 🔍 Sprawdzenie dekodowania
    c.set("jwtPayload", decoded);
    await next();
  } catch (error) {
    console.error("Błąd weryfikacji tokena:", error); // 🔍 Sprawdzenie błędu
    deleteCookie(c,'ACCESS_TOKEN');
    // TODO: implement logic to call refresh route with the refresh token to get a new access token
    return c.json({ error: "Nieprawidłowy token" }, 403);
  }
};

export function getUserFromContext(c: Context<{ Variables: UserPayload; }>)  {
  const user: number = c.get("jwtPayload").userId;
  return user;
}
