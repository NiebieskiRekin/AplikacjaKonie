import { MiddlewareHandler, Context } from "hono";
import { __prod__, ProcessEnv } from "../env";

import { sign, verify } from "hono/jwt";
import { db, eq } from "../db";
import { users } from "../db/schema";

import { getCookie, deleteCookie, setCookie } from "hono/cookie";

export const ACCESS_TOKEN = "ACCESS_TOKEN";
export const REFRESH_TOKEN = "REFRESH_TOKEN";
export const ON_SUCCESS_REDIRECT_TO = "ON_SUCCESS_REDIRECT_TO";

export type RefreshTokenData = {
  userId: number;
  refreshTokenVersion: number;
};

// TODO: extend type with cached info about hodowla and user type to be stored in Window: sessionStorage (single tab only)
export type UserPayload = {
  userId: number;
  // email: string;
};

const thirty_days = 30 * 24 * 60;
const fifteen_minutes = 60 * 15;

export async function createAccessToken(user_id: number) {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    { userId: user_id, exp: now + fifteen_minutes },
    ProcessEnv.JWT_ACCESS_PRIVATE_KEY, ProcessEnv.JWT_ALG
  );
}

export async function createAuthTokens(user: {
  userId: number;
  refreshTokenVersion: number;
}) {
  const now = Math.floor(Date.now() / 1000);

  const refreshToken = sign(
    {
      userId: user.userId,
      refreshTokenVersion: user.refreshTokenVersion,
      exp: now + thirty_days,
    },
    ProcessEnv.JWT_REFRESH_PRIVATE_KEY,
    ProcessEnv.JWT_ALG
  );

  const accessToken = sign(
    { userId: user.userId, exp: now + fifteen_minutes },
    ProcessEnv.JWT_ACCESS_PRIVATE_KEY,
    ProcessEnv.JWT_ALG
  );

  return { accessToken: await accessToken, refreshToken: await refreshToken };
}

export const access_cookie_opts = {
  httpOnly: true,
  secure: __prod__,
  sameSite: "lax",
  path: "/",
  domain: __prod__ ? `.${ProcessEnv.DOMAIN}` : "",
  maxAge: fifteen_minutes,
} as const;

export const refresh_cookie_opts = {
  httpOnly: true,
  secure: __prod__,
  sameSite: "lax",
  path: "/api/refresh",
  domain: __prod__ ? `.${ProcessEnv.DOMAIN}` : "",
  maxAge: thirty_days,
} as const;

export async function checkTokens(tokens: {
  accessToken: string;
  refreshToken: string;
}) {
  try {
    const decoded = <UserPayload>(
      await verify(tokens.accessToken, ProcessEnv.JWT_ACCESS_PUBLIC_KEY, ProcessEnv.JWT_ALG)
    );
    return decoded;
  } catch {
    // Expired token, check refresh token
  }

  try {
    const data = <RefreshTokenData>(
      await verify(tokens.refreshToken, ProcessEnv.JWT_REFRESH_PUBLIC_KEY, ProcessEnv.JWT_ALG)
    );
    const user = (
      await db.select().from(users).where(eq(users.id, data.userId)).limit(1)
    ).at(0);
    if (!user || user.refreshTokenVersion !== data.refreshTokenVersion) {
      return null; // unauthorized
    }
    return {
      userId: data.userId,
      refreshTokenVersion: data.refreshTokenVersion,
    };
  } catch {
    return null; // unauthorized
  }
}

export const authMiddleware: MiddlewareHandler<{
  Variables: { jwtPayload:UserPayload};
}> = async (c, next) => {
  const accessToken = getCookie(c, ACCESS_TOKEN);

  try {
    const decoded = await verify(accessToken!, ProcessEnv.JWT_ACCESS_PUBLIC_KEY, ProcessEnv.JWT_ALG);
    c.set("jwtPayload", decoded);
    await next();
  } catch {
    deleteCookie(c, ACCESS_TOKEN);
    setCookie(c, ON_SUCCESS_REDIRECT_TO, c.req.path, refresh_cookie_opts);
    return c.redirect("/api/refresh");
  }
};

export function getUserFromContext(c: Context<{ Variables: { jwtPayload:UserPayload}; }>) {
  const user: number = c.get("jwtPayload").userId;
  return user;
}
