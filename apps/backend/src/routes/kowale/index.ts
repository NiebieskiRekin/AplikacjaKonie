import { Hono } from "hono";
import { auth_vars } from "@/backend/auth";

import { kowale_get } from "./get";
import { kowale_id_get } from "./id/get";
import { kowale_post } from "./post";
import { kowale_id_put } from "./id/put";
import { kowale_id_delete } from "./id/delete";

const kowaleRoute = new Hono<auth_vars>()
  .route("/", kowale_get)
  .route("/", kowale_post)
  .route("/", kowale_id_get)
  .route("/", kowale_id_put)
  .route("/", kowale_id_delete);

export default kowaleRoute;
