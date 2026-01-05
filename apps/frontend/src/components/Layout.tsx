import { Outlet, useNavigate } from "react-router";
import Navbar from "./Navbar";
import { useEffect } from "react";
import { authClient } from "../lib/auth";
import Home from "./Home";

function Layout() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending && !session) {
      void navigate("/login");
    }
  }, [session, isPending, navigate]);

  return (
    <>
      <Navbar />
      {isPending ? <Home /> : <Outlet />}
    </>
  );
}

export default Layout;
