import { Hono } from "hono";

import { liczba_requestow_get } from "./get";
import { gemini_chat_post } from "./post";
import { liczba_requestow_decrease } from "./postD";
import { auth_vars } from "@/backend/auth";

// TODO: uwierzytelnianie poprzez token per organisation z rate limiting
const chatRoute = new Hono<auth_vars>()
  .route("/", liczba_requestow_get)
  .route("/", gemini_chat_post)
  .route("/", liczba_requestow_decrease);

export default chatRoute;
