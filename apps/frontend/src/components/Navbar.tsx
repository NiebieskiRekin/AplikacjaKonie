import { useState } from "react";
import { Link } from "react-router";
import { FiMenu, FiX } from "react-icons/fi";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-green-900 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <h1 className="text-xl font-bold">
          <Link to="/konie">🐴 Moja Hodowla</Link>
        </h1>

        <button
          className="md:hidden text-white text-2xl focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <FiX /> : <FiMenu />}
        </button>

        {/* Menu główne - ukryte na mobilnych*/}
        <div className="hidden md:flex gap-6">
          <NavLinks />
        </div>
      </div>

      {/* Mobilne menu */}
      {isOpen && (
        <div className="md:hidden flex flex-col bg-green-900 text-white p-4 space-y-3">
          <NavLinks />
        </div>
      )}
    </nav>
  );
}

const NavLinks = () => (
  <>
    <Link
      to="/konie"
      className="px-6 py-3 rounded-lg shadow-lg bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold hover:bg-opacity-80 transition"
    >
      Konie
    </Link>
    <Link
      to="/weterynarze"
      className="px-6 py-3 rounded-lg shadow-lg bg-gradient-to-r from-blue-400 to-blue-600 text-white font-semibold hover:bg-opacity-80 transition"
    >
      Weterynarze
    </Link>
    <Link
      to="/kowale"
      className="px-6 py-3 rounded-lg shadow-lg bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-semibold hover:bg-opacity-80 transition"
    >
      Kowale
    </Link>
    <Link
      to="/wydarzenia"
      className="px-6 py-3 rounded-lg shadow-lg bg-gradient-to-r from-red-400 to-red-600 text-white font-semibold hover:bg-opacity-80 transition"
    >
      Wydarzenia w stajni
    </Link>

    <Link to="/restart" className="px-6 py-3 rounded-lg hover:text-brown-300 transition font-semibold">
      Zmień hasło
    </Link>
    <button
      onClick={() => (window.location.href = "/login")}
      className="hover:text-brown-300 transition font-semibold"
    >
      Wyloguj
    </button>
  </>
);

export default Navbar;
