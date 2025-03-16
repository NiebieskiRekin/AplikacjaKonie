import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  index("./components/Home.tsx"),
  route("/login", "./components/Login.tsx"),
  layout("./components/Layout.tsx", [
    route("/restart", "./components/Restart.tsx"),
    route("/ustawienia", "./components/Settings.tsx"),

    ...prefix("konie", [
      index("./components/konie/Konie.tsx"),
      route("add", "./components/konie/DodajKonia.tsx"),
      route(":id", "./components/konie/SzczegolyKonia.tsx"),
      route(":id/edit", "./components/konie/EdytujKonia.tsx"),
    ]),

    ...prefix("wydarzenia", [
      index("./components/Wydarzenia.tsx"),
      route("add/:type", "./components/AddWydarzenie.tsx"),
      route(":id/rozrody", "./components/events/Rozrody.tsx"),
      route(":id/choroby", "./components/events/Choroby.tsx"),
      route(":id/leczenia", "./components/events/Leczenia.tsx"),
      route(":id/profilaktyczne", "./components/events/Profilaktyczne.tsx"),
      route(":id/:type/:eventId/edit", "./components/EditHorseEvent.tsx"),
      route(":id/podkucia", "./components/events/Podkucia.tsx"),
      route("add/:id/:type", "./components/AddHorseEvent.tsx"),
    ]),

    ...prefix("weterynarze", [
      index("./components/Weterynarze.tsx"),
      route("add", "./components/AddWeterynarz.tsx"),
      route("edit/:id", "./components/EditWeterynarz.tsx"),
    ]),

    ...prefix("kowale", [
      index("./components/Kowale.tsx"),
      route("add", "./components/AddKowal.tsx"),
      route("edit/:id", "./components/EditKowal.tsx"),
    ]),
  ]),
  // * matches all URLs, the ? makes it optional so it will match / as well
  route("*", "./components/NotFound.tsx"),
] satisfies RouteConfig;
