import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("./components/Home.tsx"),
  route("/login", "./components/Login.tsx"),
  route("/register", "./components/Register.tsx"),
  layout("./components/Layout.tsx", [
    route("/konie", "./components/Konie.tsx"),
    route("/konie/add", "./components/AddKonia.tsx"),
    route("/restart", "./components/Restart.tsx"),
    route("konie/:id", "./components/KonieDetails.tsx"),
    route("wydarzenia", "./components/Wydarzenia.tsx"),
    route("/wydarzenia/add/:type", "./components/AddWydarzenie.tsx"),
    route("/konie/:id/edit", "./components/EditKonia.tsx"),
    route("/wydarzenia/:id/rozrody", "./components/events/Rozrody.tsx"),
    route("/wydarzenia/:id/choroby", "./components/events/Choroby.tsx"),
    route("/wydarzenia/:id/leczenia", "./components/events/Leczenia.tsx"),
    route(
      "/wydarzenia/:id/profilaktyczne",
      "./components/events/Profilaktyczne.tsx"
    ),
    route("/wydarzenia/:id/podkucia", "./components/events/Podkucia.tsx"),
    route("/wydarzenia/add/:id/:type", "./components/AddHorseEvent.tsx"),
  ]),
  // * matches all URLs, the ? makes it optional so it will match / as well
  // route("*?", "catchall.tsx"),
] satisfies RouteConfig;
