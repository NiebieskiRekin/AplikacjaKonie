import APIClient from "@/frontend/lib/api-client";
import formatApiError from "@/frontend/lib/format-api-error";
import type { ErrorSchema } from "@aplikacja-konie/api-client";
import { useState } from "react";
import { useNavigate } from "react-router";

function AddKowal() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    imieINazwisko: "",
    numerTelefonu: "",
    hodowla: 0,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await APIClient.kowale.$post({ json: formData });

      if (response.ok) {
        setSuccess("Kowal został dodany!");
        setTimeout(() => void navigate("/kowale"), 1500);
      } else {
        throw new Error("Błąd dodawania weterynarza");
      }
    } catch (err) {
      setError(formatApiError(err as ErrorSchema));
    }
  };

  return (
    <div className="to-brwon-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-6">
      <h2 className="mb-6 text-3xl font-bold text-white">➕ Dodaj Kowala</h2>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
      >
        <label className="block text-gray-700">👤 Imię i nazwisko:</label>
        <input
          type="text"
          name="imieINazwisko"
          className="mb-3 w-full rounded border p-2"
          required
          onChange={handleInputChange}
        />

        <label className="block text-gray-700">📞 Numer telefonu:</label>
        <input
          type="text"
          name="numerTelefonu"
          className="mb-3 w-full rounded border p-2"
          onChange={handleInputChange}
        />

        <button
          type="submit"
          className="w-full rounded-lg bg-green-600 py-3 text-white transition hover:bg-green-700"
        >
          ✅ Dodaj Kowala
        </button>
      </form>
    </div>
  );
}

export default AddKowal;
