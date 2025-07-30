import { Hono } from "hono";
import { authMiddleware, UserPayload } from "@/backend/middleware/auth";

import { liczba_requestow_get } from "./get";
import { gemini_chat_post } from "./post";
import { liczba_requestow_decrease } from "./postD";

const chatRoute = new Hono<{ Variables: { jwtPayload: UserPayload } }>()
  .use(authMiddleware)
  .route("/", liczba_requestow_get)
  .route("/", gemini_chat_post)
  .route("/", liczba_requestow_decrease);

export default chatRoute;
