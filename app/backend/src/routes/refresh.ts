import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { access_cookie_opts, ACCESS_TOKEN, checkTokens, createAccessToken, REFRESH_TOKEN } from "../middleware/auth"

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
        // TODO: implement logic to call refresh route with the refresh token to get a new access token
        return c.json({"error": "Należy zalogować się ponownie"},403);
    }

    // Create a new access token and set it on the cookie
    try {
        const user_id = (await checkTokens({accessToken: "", refreshToken: refreshToken}))!;
        const access_token = await createAccessToken(user_id.userId);
        setCookie(c,ACCESS_TOKEN,access_token,access_cookie_opts)
        return c.json({"status":"Odświeżono sesję"},200);
    // Invalid refreshToken, clear cookie and send to login
    } catch (err) {
        deleteCookie(c,REFRESH_TOKEN);
        return c.json({"error": "Należy zalogować się ponownie"},403);
    }
});