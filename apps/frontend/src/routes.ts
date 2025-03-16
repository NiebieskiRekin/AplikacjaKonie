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
  route("/register", "./components/Register.tsx"),
  layout("./components/Layout.tsx", [
    route("/restart", "./components/Restart.tsx"),

    ...prefix("konie", [
      index("./components/konie/Konie.tsx"),
      route("add", "./components/konie/DodajKonia.tsx"),
      route(":id/edit", "./components/konie/EdytujKonia.tsx"),
      route(":id", "./components/konie/SzczegolyKonia.tsx"),
    ]),

    route("wydarzenia", "./components/Wydarzenia.tsx"),
    route("/wydarzenia/add/:type", "./components/AddWydarzenie.tsx"),
    route("/wydarzenia/:id/rozrody", "./components/events/Rozrody.tsx"),
    route("/wydarzenia/:id/choroby", "./components/events/Choroby.tsx"),
    route("/wydarzenia/:id/leczenia", "./components/events/Leczenia.tsx"),
    route(
      "/wydarzenia/:id/profilaktyczne",
      "./components/events/Profilaktyczne.tsx"
    ),
    route("/wydarzenia/:id/podkucia", "./components/events/Podkucia.tsx"),
    route("/wydarzenia/add/:id/:type", "./components/AddHorseEvent.tsx"),
    route("/weterynarze", "./components/Weterynarze.tsx"),
    route("/kowale", "./components/Kowale.tsx"),
    route("/weterynarze/add", "./components/AddWeterynarz.tsx"),
    route("/kowale/add", "./components/AddKowal.tsx"),
    route("/weterynarze/edit/:id", "./components/EditWeterynarz.tsx"),
    route("/kowale/edit/:id", "./components/EditKowal.tsx"),
    route(
      "/wydarzenia/:id/:type/:eventId/edit",
      "./components/EditHorseEvent.tsx"
    ),
    route("/ustawienia", "./components/Settings.tsx"),
  ]),
  // * matches all URLs, the ? makes it optional so it will match / as well
  // route("*?", "catchall.tsx"),
] satisfies RouteConfig;
