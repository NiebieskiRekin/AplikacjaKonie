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
      index("./components/wydarzenia/Wydarzenia.tsx"),
      route("add/:type", "./components/wydarzenia/DodajWydarzenie.tsx"),
      route(
        "add/:id/:type",
        "./components/wydarzenia/DodajWydarzenieKonia.tsx"
      ),
      route(
        ":id/:type/:eventId/edit",
        "./components/wydarzenia/EdytujWydarzenie.tsx"
      ),
      route(":id/rozrody", "./components/wydarzenia/Rozrody.tsx"),
      route(":id/choroby", "./components/wydarzenia/Choroby.tsx"),
      route(":id/leczenia", "./components/wydarzenia/Leczenia.tsx"),
      route(":id/podkucia", "./components/wydarzenia/Podkucia.tsx"),
      route(":id/profilaktyczne", "./components/wydarzenia/Profilaktyczne.tsx"),
    ]),

    ...prefix("weterynarze", [
      index("./components/weterynarze/Weterynarze.tsx"),
      route("add", "./components/weterynarze/DodajWeterynarza.tsx"),
      route("edit/:id", "./components/weterynarze/EdytujWeterynarza.tsx"),
    ]),

    ...prefix("kowale", [
      index("./components/kowale/Kowale.tsx"),
      route("add", "./components/kowale/DodajKowala.tsx"),
      route("edit/:id", "./components/kowale/EdytujKowala.tsx"),
    ]),
  ]),
  // * matches all URLs, the ? makes it optional so it will match / as well
  route("*", "./components/NotFound.tsx"),
] satisfies RouteConfig;
