import { Hono } from "hono";
import { auth_vars } from "@/backend/auth";
import { wydarzenia_eventType_eventId_get } from "./eventType_eventId_get";
import { wydarzenia_get } from "./get";
import { wydarzenia_horseId_eventType_get } from "./horseId_eventType_get";
import { wydarzenia_zdarzenia_profilaktyczne_delete } from "./zdarzenia_profilaktyczne/delete";
import { wydarzenia_zdarzenia_profilaktyczne_post } from "./zdarzenia_profilaktyczne/post";
import { wydarzenia_zdarzenia_profilaktyczne_put } from "./zdarzenia_profilaktyczne/put";
import { wydarzenia_rozrody_delete } from "./rozrody/delete";
import { wydarzenia_rozrody_post } from "./rozrody/post";
import { wydarzenia_rozrody_put } from "./rozrody/put";
import { wydarzenia_podkucie_delete } from "./podkucie/delete";
import { wydarzenia_podkucie_post } from "./podkucie/post";
import { wydarzenia_podkucie_put } from "./podkucie/put";
import { wydarzenia_choroby_delete } from "./choroby/delete";
import { wydarzenia_choroby_post } from "./choroby/post";
import { wydarzenia_choroby_put } from "./choroby/put";
import { wydarzenia_leczenia_delete } from "./leczenia/delete";
import { wydarzenia_leczenia_post } from "./leczenia/post";
import { wydarzenia_leczenia_put } from "./leczenia/put";

const wydarzeniaRoute = new Hono<auth_vars>()
  .route("/", wydarzenia_get)
  // .route("/", wydarzenia_eventType_eventId_get)
  // .route("/", wydarzenia_horseId_eventType_get)
  .route("/", wydarzenia_zdarzenia_profilaktyczne_put)
  .route("/", wydarzenia_zdarzenia_profilaktyczne_post)
  .route("/", wydarzenia_zdarzenia_profilaktyczne_delete)
  .route("/", wydarzenia_rozrody_put)
  .route("/", wydarzenia_rozrody_post)
  .route("/", wydarzenia_rozrody_delete)
  .route("/", wydarzenia_podkucie_put)
  .route("/", wydarzenia_podkucie_post)
  .route("/", wydarzenia_podkucie_delete)
  .route("/", wydarzenia_leczenia_put)
  .route("/", wydarzenia_leczenia_post)
  .route("/", wydarzenia_leczenia_delete)
  .route("/", wydarzenia_choroby_put)
  .route("/", wydarzenia_choroby_post)
  .route("/", wydarzenia_choroby_delete);

export default wydarzeniaRoute;
