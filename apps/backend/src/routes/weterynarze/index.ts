import { Hono } from "hono";
import { authMiddleware, UserPayload } from "@/backend/middleware/auth";
import { weterynarze_get } from "./get";
import { weterynarze_post } from "./post";
import { weterynarze_id_get } from "./id/get";
import { weterynarze_id_put } from "./id/put";
import { weterynarze_id_delete } from "./id/delete";

const weterynarzeRoute = new Hono<{ Variables: { jwtPayload: UserPayload } }>()
  .use(authMiddleware)
  .route("/", weterynarze_get)
  .route("/", weterynarze_post)
  .route("/", weterynarze_id_get)
  .route("/", weterynarze_id_put)
  .route("/", weterynarze_id_delete);

export default weterynarzeRoute;
