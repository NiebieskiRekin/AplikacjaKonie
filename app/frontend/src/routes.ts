import {
    type RouteConfig,
    route,
  } from "@react-router/dev/routes";
  
  export default [
    route("","./components/Home.tsx"),
    route("/login","./components/Login.tsx"),
    route("/register","./components/Register.tsx")
    // * matches all URLs, the ? makes it optional so it will match / as well
    // route("*?", "catchall.tsx"),
  ] satisfies RouteConfig;