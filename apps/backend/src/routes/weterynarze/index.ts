import { Hono } from "hono";
import { auth_vars } from "@/backend/auth";
import { weterynarze_get } from "./get";
import { weterynarze_post } from "./post";
import { weterynarze_id_get } from "./id/get";
import { weterynarze_id_put } from "./id/put";
import { weterynarze_id_delete } from "./id/delete";

const weterynarzeRoute = new Hono<auth_vars>()
  .route("/", weterynarze_get)
  .route("/", weterynarze_post)
  .route("/", weterynarze_id_get)
  .route("/", weterynarze_id_put)
  .route("/", weterynarze_id_delete);

export default weterynarzeRoute;
