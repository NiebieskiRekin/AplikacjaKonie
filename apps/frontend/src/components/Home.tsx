// import { useState } from "react";
import PWABadge from "./PWABadge.tsx";
import "../index.css";

function Home() {
  return (
    <>
      <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-6"></div>
      <PWABadge />
    </>
  );
}

export default Home;
