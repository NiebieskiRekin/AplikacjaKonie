import { Hono } from "hono";
import { auth_vars } from "@/backend/auth";
import { wydarzenia_eventType_eventId_get } from "./eventType_eventId_get";
import { wydarzenia_get } from "./get";
import { wydarzenia_zdarzenia_profilaktyczne_post } from "./zdarzenia_profilaktyczne/post";
import { wydarzenia_zdarzenia_profilaktyczne_put } from "./zdarzenia_profilaktyczne/put";
import { wydarzenia_rozrody_post } from "./rozrody/post";
import { wydarzenia_rozrody_put } from "./rozrody/put";
import { wydarzenia_podkucie_post } from "./podkucie/post";
import { wydarzenia_podkucie_put } from "./podkucie/put";
import { wydarzenia_choroby_post } from "./choroby/post";
import { wydarzenia_choroby_put } from "./choroby/put";
import { wydarzenia_leczenia_post } from "./leczenia/post";
import { wydarzenia_leczenia_put } from "./leczenia/put";
import { wydarzenia_eventType_eventId_delete } from "./eventType_eventId_delete";

const wydarzeniaRoute = new Hono<auth_vars>()
  .route("/", wydarzenia_get)
  .route("/", wydarzenia_eventType_eventId_get)
  .route("/", wydarzenia_eventType_eventId_delete)
  .route("/", wydarzenia_zdarzenia_profilaktyczne_put)
  .route("/", wydarzenia_zdarzenia_profilaktyczne_post)
  .route("/", wydarzenia_rozrody_put)
  .route("/", wydarzenia_rozrody_post)
  .route("/", wydarzenia_podkucie_put)
  .route("/", wydarzenia_podkucie_post)
  .route("/", wydarzenia_leczenia_put)
  .route("/", wydarzenia_leczenia_post)
  .route("/", wydarzenia_choroby_put)
  .route("/", wydarzenia_choroby_post);

export default wydarzeniaRoute;
