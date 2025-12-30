import { redirect } from "react-router";
import Home from "./Home";

// eslint-disable-next-line @typescript-eslint/require-await
export async function clientLoader() {
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  throw redirect("/konie");
}

function NotFound() {
  return <Home />;
}

export default NotFound;
