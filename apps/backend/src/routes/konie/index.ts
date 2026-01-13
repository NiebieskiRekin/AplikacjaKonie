import { Hono } from "hono";
import { konie_get } from "./get";
import { konie_post } from "./post";
import { konie_id_put } from "./id/put";
import { konie_id_get } from "./id/get";
import { konie_id_delete } from "./id/delete";
import { konie_id_upload_post } from "./id/upload/post";
import { konie_id_imageId_delete } from "./id/imageId/delete";
import { konie_id_events_get } from "./id/events/get";
import { konie_id_active_events_get } from "./id/active-events/get";
import { auth_vars } from "@/backend/auth";
import { wydarzenia_horseId_eventType_get } from "./id/eventType_get";

const konieRoute = new Hono<auth_vars>()
  .route("/", konie_get)
  .route("/", konie_post)
  .route("/", konie_id_put)
  .route("/", konie_id_get)
  .route("/", konie_id_delete)
  .route("/", konie_id_upload_post)
  .route("/", konie_id_imageId_delete)
  .route("/", konie_id_events_get)
  .route("/", konie_id_active_events_get)
  .route("/", wydarzenia_horseId_eventType_get);

export default konieRoute;
