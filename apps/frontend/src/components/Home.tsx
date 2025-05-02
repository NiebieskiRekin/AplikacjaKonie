import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import PWABadge from "./PWABadge.tsx";

function Home() {
  const [showLink, setShowLink] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowLink(true);
    }, 8000);

    return () => clearTimeout(timeout);
  }, []);
  return (
    <>
      <div className="to-brown-600 flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-800 p-6">
        {showLink ? (
          <NavLink className="rounded-4xl bg-white p-2" to="/konie">
            Przejdź do moich koni
          </NavLink>
        ) : (
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
        )}
      </div>
      <PWABadge />
    </>
  );
}

export default Home;
