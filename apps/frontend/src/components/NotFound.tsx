import { NavLink } from "react-router";

function NotFound() {
  return (
    <>
      <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-6">
        <div className="rounded-4xl bg-white p-4">
          <h1>Strona o tym adresie gdzieś nam uciekła...</h1>
          <NavLink className="underline" to="/">
            Wracam na stronę główną!
          </NavLink>
        </div>
      </div>
    </>
  );
}

export default NotFound;
