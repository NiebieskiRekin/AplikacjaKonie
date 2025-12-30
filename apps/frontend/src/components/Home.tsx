import { redirect } from "react-router";

// eslint-disable-next-line @typescript-eslint/require-await
export async function clientLoader() {
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  throw redirect("/konie");
}

function Home() {
  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-green-800 p-6">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
    </div>
  );
}

export default Home;
