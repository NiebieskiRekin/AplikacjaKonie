import {
    type RouteConfig,
    index,
    layout,
    route,
  } from "@react-router/dev/routes";
  
  export default [
    index("./components/Home.tsx"),
    route("/login","./components/Login.tsx"),
    route("/register","./components/Register.tsx"),
    layout("./components/Layout.tsx", [
      route("/konie","./components/Konie.tsx"),
      route("/konie/add", "./components/AddKonia.tsx"),
      route("/restart", "./components/Restart.tsx"),
      route("konie/:id", "./components/KonieDetails.tsx"),
      route("wydarzenia", "./components/Wydarzenia.tsx"),
      route("/wydarzenia/add/:type", "./components/AddWydarzenie.tsx"),
      route("/konie/:id/edit", "./components/EditKonia.tsx"),
    ]),
    // * matches all URLs, the ? makes it optional so it will match / as well
    // route("*?", "catchall.tsx"),
  ] satisfies RouteConfig;