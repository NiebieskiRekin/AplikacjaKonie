// import { useState } from "react";
import { NavLink } from "react-router";
import PWABadge from "./PWABadge.tsx";

function Home() {
  return (
    <>
      <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-6">
        <NavLink className="rounded-4xl bg-white p-2" to="/konie">
          Przejdź do moich koni
        </NavLink>
      </div>
      <PWABadge />
    </>
  );
}

export default Home;
