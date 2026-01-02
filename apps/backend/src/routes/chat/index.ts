import { Hono } from "hono";

import { liczba_requestow_get } from "./get";
import { gemini_chat_post } from "./post";
import { auth_vars } from "@/backend/auth";

const chatRoute = new Hono<auth_vars>()
  .route("/", liczba_requestow_get)
  .route("/", gemini_chat_post);

export default chatRoute;
