import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { access_cookie_opts, ACCESS_TOKEN, createAuthTokens, refresh_cookie_opts, REFRESH_TOKEN, RefreshTokenData } from "../middleware/auth"
import { ProcessEnv } from "../env";
import { verify } from "hono/jwt";

/**
 * Handle the refresh token. Needs to be before the authorization
 * middleware so we can get a new access token when the refresh token
 * has expired.
 */
const refresh = new Hono().get('/', async (c) => {
    // console.log('Obtaining new access token with the refresh token');
    // Get the refresh token, will only be present on /refresh call
    const refreshToken = getCookie(c,REFRESH_TOKEN);

    // Refresh token is not present
    if (!refreshToken) {
        //   console.log('Refresh token not found, sending them to login page');
        return c.json({"error": "Należy zalogować się ponownie"},403);
    }

    // Create a new access and refresh token pair and set it on the cookie
    try {
        const user = <RefreshTokenData>(await verify(refreshToken, ProcessEnv.REFRESH_JWT_SECRET));
        // const access_token = await createAccessToken(user_id.userId);
        const tokens = await createAuthTokens({userId: user.userId, refreshTokenVersion: user.refreshTokenVersion!});
        setCookie(c,ACCESS_TOKEN,tokens.accessToken,access_cookie_opts);
        setCookie(c,REFRESH_TOKEN,tokens.refreshToken,refresh_cookie_opts);
        return c.json({"status":"Odświeżono sesję"},200);
    // Invalid refreshToken, clear cookie and send to login
    } catch (err) {
        deleteCookie(c,REFRESH_TOKEN);
        return c.json({"error": "Należy zalogować się ponownie"},403);
    }
});

export default refresh;