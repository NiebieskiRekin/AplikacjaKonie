import { useState } from "react";
import { useNavigate } from "react-router";

function Restart() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      setError("Nowe hasła muszą się zgadzać!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Brak autoryzacji");

      const response = await fetch("/api/restart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword, confirmNewPassword }),
      });
      console.log(response);
      const data = await response.json();
      if (!response.ok) {
        if (data.error && data.error.issues) {
          const errorMessages = data.error.issues.
          map((issue: {message: string}) => `❌ ${issue.message}`)
          .join("\n");
          throw new Error(errorMessages);
        }
        throw new Error(data.error || "Błąd zmiany hasła");
      }
      setSuccess("Hasło zostało zmienione! Zaloguj się ponownie.");
      setError("");
      localStorage.removeItem("token"); // Wylogowanie użytkownika
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError((err as Error).message);
      setSuccess("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-green-700 to-brown-600 p-6">
      <div className="bg-white p-6 rounded-lg shadow-md w-96 mt-36">
        <h2 className="text-2xl font-bold text-center text-green-800">Zmień hasło</h2>
        {error && <p className="text-red-600 text-center">{error}</p>}
        {success && <p className="text-green-600 text-center">{success}</p>}
        <form onSubmit={handlePasswordChange} className="mt-4">
          <label className="block mb-2">
            <span className="text-gray-700">Stare hasło:</span>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            />
          </label>
          <label className="block mb-2">
            <span className="text-gray-700">Nowe hasło:</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            />
          </label>
          <label className="block mb-4">
            <span className="text-gray-700">Potwierdź nowe hasło:</span>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            />
          </label>
          <button type="submit" className="w-full bg-green-700 text-white p-2 rounded-md hover:bg-green-800">
            Zmień hasło
          </button>
        </form>
      </div>
    </div>
  );
}

export default Restart;
