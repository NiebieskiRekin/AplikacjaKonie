import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import Home from "./components/Home";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Aplikacja Koni</title>
        <Meta />
        <Links />
        <link rel="icon" type="image/png" href="/glowne.webp" />
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
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
            console.error('Service Worker registration failed:', error);
        });
  }
  return (
    <div className="page-container">
      <Outlet />
    </div>
  );
}
