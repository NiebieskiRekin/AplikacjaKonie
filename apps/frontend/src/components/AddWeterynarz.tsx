import { useState } from "react";
import { useNavigate } from "react-router";

function AddWeterynarz() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ imieINazwisko: "", numerTelefonu: "", hodowla: 0 });
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
      const response = await fetch("/api/weterynarze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Błąd dodawania weterynarza");

      setSuccess("Weterynarz został dodany!");
      setTimeout(() => navigate("/weterynarze"), 1500);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-green-800 to-brwon-600 p-6">
      <h2 className="text-3xl font-bold text-white mb-6">➕ Dodaj Weterynarza</h2>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <label className="block text-gray-700">👤 Imię i nazwisko:</label>
        <input
          type="text"
          name="imieINazwisko"
          className="w-full p-2 border rounded mb-3"
          required
          onChange={handleInputChange}
        />

        <label className="block text-gray-700">📞 Numer telefonu:</label>
        <input
          type="text"
          name="numerTelefonu"
          className="w-full p-2 border rounded mb-3"
          onChange={handleInputChange}
        />

        <button type="submit" className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          ✅ Dodaj weterynarza
        </button>
      </form>
    </div>
  );
}

export default AddWeterynarz;
