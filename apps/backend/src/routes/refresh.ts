import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import {
  access_cookie_opts,
  ACCESS_TOKEN,
  createAuthTokens,
  ON_SUCCESS_REDIRECT_TO,
  refresh_cookie_opts,
  REFRESH_TOKEN,
  RefreshTokenData,
} from "../middleware/auth";
import { ProcessEnv } from "../env";
import { verify } from "hono/jwt";

/**
 * Handle the refresh token. Needs to be before the authorization
 * middleware so we can get a new access token when the refresh token
 * has expired.
 */
const refresh = new Hono().get("/", async (c) => {
  // Get the refresh token, will only be present on /refresh call
  const refreshToken = getCookie(c, REFRESH_TOKEN);

  // Refresh token is not present
  if (!refreshToken) {
    return c.json({ error: "Należy zalogować się ponownie" }, 403);
  }

  // Create a new access and refresh token pair and set it on the cookie
  try {
    const user = <RefreshTokenData>(
      await verify(refreshToken, ProcessEnv.JWT_REFRESH_PUBLIC_KEY, ProcessEnv.JWT_ALG)
    );
    const tokens = await createAuthTokens({
      userId: user.userId,
      refreshTokenVersion: user.refreshTokenVersion,
    });
    setCookie(c, ACCESS_TOKEN, tokens.accessToken, access_cookie_opts);
    setCookie(c, REFRESH_TOKEN, tokens.refreshToken, refresh_cookie_opts);
    const where_to = getCookie(c, ON_SUCCESS_REDIRECT_TO);
    if (where_to === undefined) {
      return c.json({ status: "Odświeżono sesję" }, 200);
    } else {
      deleteCookie(c, ON_SUCCESS_REDIRECT_TO);
      return c.redirect(where_to);
    }
    // Invalid refreshToken, clear cookie and send to login
  } catch {
    console.log("Refresh token invalid");
    deleteCookie(c, REFRESH_TOKEN);
    return c.json({ error: "Należy zalogować się ponownie" }, 403);
  }
});

export default refresh;
