import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import Home from "./components/Home";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>My App</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function HydrateFallback() {
  return <Home />;
}

export default function Root() {
  return (
    <div className="page-container">
      <Outlet />
    </div>
  );
}
