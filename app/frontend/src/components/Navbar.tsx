import { Link } from "react-router";

function Navbar() {
  return (
    <nav className="bg-green-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo po lewej */}
        <h1 className="text-xl font-bold">
          <Link to="/">🐴 Moja Hodowla</Link>
        </h1>

        <div className="flex-1 flex justify-center gap-18">
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
        </div>

        <Link
            to="/restart"
            className="px-6 py-3 rounded-lg hover:text-brown-300 transition font-semibold"
          >
            Zmień hasło
        </Link>
        <button
          onClick={() => {
            window.location.href = "/login";
          }}
          className="hover:text-brown-300 transition font-semibold"
        >
          Wyloguj
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
