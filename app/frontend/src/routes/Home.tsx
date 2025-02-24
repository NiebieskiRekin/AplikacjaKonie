import { useState } from "react";
import PWABadge from "../components/PWABadge.tsx";
import "../index.css";

function Home() {
  return (
    <>
      <h1 className="text-3xl font-bold underline"> Hello world! </h1>
      <PWABadge />
    </>
  );
}

export default Home;
