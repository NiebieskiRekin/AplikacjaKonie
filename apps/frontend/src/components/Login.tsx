import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router";
import formatApiError from "@/frontend/lib/format-api-error";
import type { ErrorSchema } from "@aplikacja-konie/api-client";
import { authClient } from "../lib/auth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    data: orgs,
    error: orgserror,
    refetch: refetchOrgs,
  } = authClient.useListOrganizations();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email: email,
        password: password,
        rememberMe: true,
      });

      if (data) {
        await refetchOrgs();
        if (orgs && orgs.length > 0) {
          const { error: org_error } = await authClient.organization.setActive({
            organizationId: orgs[0].id,
            organizationSlug: orgs[0].slug,
          });
          if (data) {
            await navigate("/konie");
          } else {
            setError(
              org_error?.message || "Błąd ustalania hodowli użytkownika"
            );
          }
        } else {
          setError(orgserror?.message || "Błąd pobierania hodowli użytkownika");
        }
      } else {
        setError(error.message || "Wystąpił nieznany błąd");
      }
    } catch (err) {
      const message =
        (err instanceof Error && err.message) ||
        formatApiError(err as ErrorSchema) ||
        "Wystąpił błąd podczas logowania";

      setError(message);

      if (message.includes("TypeError") || message.includes("NetworkError")) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="to-brown-600 flex min-h-screen items-center justify-center bg-linear-to-br from-green-800">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-center text-2xl font-bold text-green-900">
          Logowanie
        </h2>
        {error && <p className="mt-2 text-center text-red-600">{error}</p>}
        <form
          className="mt-6"
          onSubmit={(event) => {
            void handleLogin(event);
          }}
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Email
            </label>
            <input
              type="email"
              className="mt-2 w-full rounded-lg border px-4 py-2 focus:ring focus:ring-green-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative mt-4">
            <label className="block text-sm font-semibold text-gray-700">
              Hasło
            </label>
            <input
              type={showPassword ? "text" : "password"}
              className="mt-2 w-full rounded-lg border px-4 py-2 focus:ring focus:ring-green-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 top-8 right-3 text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-green-700 px-4 py-2 text-white transition hover:bg-green-800"
            disabled={loading}
          >
            {loading ? "Logowanie..." : "Zaloguj się"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
