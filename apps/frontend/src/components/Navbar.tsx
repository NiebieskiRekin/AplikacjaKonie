import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { FiMenu, FiX } from "react-icons/fi";
import { authClient } from "../lib/auth";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-green-900 p-4 text-white shadow-md print:hidden">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <h1 className="text-xl font-bold">
          <Link to="/konie">🐴 Moja Hodowla</Link>
        </h1>

        <button
          className="text-2xl text-white focus:outline-none md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <FiX /> : <FiMenu />}
        </button>

        {/* Menu główne - ukryte na mobilnych*/}
        <div className="hidden gap-6 md:flex">
          <NavLinks />
        </div>
      </div>

      {/* Mobilne menu */}
      {isOpen && (
        <div className="flex flex-col space-y-3 bg-green-900 p-4 text-white md:hidden">
          <NavLinks />
        </div>
      )}
    </nav>
  );
}

function NavLinks() {
  const navigate = useNavigate();
  return (
    <>
      <Link
        to="/konie"
        className="hover:bg-opacity-80 rounded-lg bg-linear-to-r from-green-400 to-green-600 px-6 py-3 font-semibold text-white shadow-lg transition"
      >
        Konie
      </Link>
      <Link
        to="/weterynarze"
        className="hover:bg-opacity-80 rounded-lg bg-linear-to-r from-blue-400 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition"
      >
        Weterynarze
      </Link>
      <Link
        to="/kowale"
        className="hover:bg-opacity-80 rounded-lg bg-linear-to-r from-yellow-400 to-yellow-600 px-6 py-3 font-semibold text-white shadow-lg transition"
      >
        Kowale
      </Link>
      <Link
        to="/wydarzenia"
        className="hover:bg-opacity-80 rounded-lg bg-linear-to-r from-red-400 to-red-600 px-6 py-3 font-semibold text-white shadow-lg transition"
      >
        Wydarzenia w stajni
      </Link>
      <Link
        to="/chat"
        className="hover:bg-opacity-80 rounded-lg bg-linear-to-r from-purple-400 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition"
      >
        Asystent
      </Link>

      <Link
        to="/ustawienia"
        className="hover:text-brown-300 rounded-lg px-6 py-3 font-semibold transition"
      >
        Ustawienia
      </Link>
      <button
        onClick={() =>
          void authClient.signOut({
            fetchOptions: {
              onSuccess: async () => {
                await navigate("/login");
              },
            },
          })
        }
        className="hover:text-brown-300 font-semibold transition"
      >
        Wyloguj
      </button>
    </>
  );
}

export default Navbar;
