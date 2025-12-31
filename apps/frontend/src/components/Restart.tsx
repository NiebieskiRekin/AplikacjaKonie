import { useState } from "react";
import { useNavigate } from "react-router";
import formatApiError from "../lib/format-api-error";
import type { ErrorSchema } from "@aplikacja-konie/api-client";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { authClient } from "../lib/auth";

function Restart() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmNewPassword) {
      setError("Nowe hasła muszą się zgadzać!");
      return;
    }
    if (newPassword.length < 8 || confirmNewPassword.length < 8) {
      setError("Nowe hasło musi mieć conajmniej 8 znaków!");
      return;
    }

    try {
      const { data, error } = await authClient.changePassword({
        newPassword: newPassword,
        currentPassword: oldPassword,
        revokeOtherSessions: true,
      });

      if (data) {
        setSuccess(
          "Hasło zostało zmienione! Wylogowanie nastąpi po 5s. \n Zaloguj się ponownie."
        );
        setTimeout(() => void navigate("/login"), 5000);
      } else {
        setError(error.message || "Wystąpił nieznany błąd");
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      }
    } catch (err) {
      const message =
        (err instanceof Error && err.message) ||
        formatApiError(err as ErrorSchema) ||
        "Wystąpił nieznany błąd";

      setError(message);

      if (message.includes("TypeError") || message.includes("NetworkError")) {
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      }
    }
  };

  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-700 p-6">
      <div className="mt-36 w-96 rounded-lg bg-white p-6 shadow-md">
        <h2 className="text-center text-2xl font-bold text-green-800">
          Zmień hasło
        </h2>
        {error && <p className="text-center text-red-600">{error}</p>}
        {success && (
          <p className="text-center font-bold text-green-600">{success}</p>
        )}
        <form onSubmit={(e) => void handlePasswordChange(e)} className="mt-4">
          <label className="relative mb-2 block">
            <span className="text-gray-700">Stare hasło:</span>
            <input
              type={showOldPassword ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full rounded-md border p-2 pr-10"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 top-7 right-3 text-gray-600"
              onClick={() => setShowOldPassword(!showOldPassword)}
            >
              {showOldPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </label>
          <label className="relative mb-2 block">
            <span className="text-gray-700">Nowe hasło:</span>
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-md border p-2 pr-10"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 top-7 right-3 text-gray-600"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </label>
          <label className="relative mb-4 block">
            <span className="text-gray-700">Potwierdź nowe hasło:</span>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full rounded-md border p-2 pr-10"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 top-7 right-3 text-gray-600"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-green-700 p-2 text-white hover:bg-green-800"
          >
            Zmień hasło
          </button>
        </form>
      </div>
    </div>
  );
}

export default Restart;
