import { useState, useEffect } from "react";
import { Link } from "react-router";

function Settings() {
    const [settings, setSettings] = useState({
      podkucia: { active: true, days: 0, time: "09:00", notify: "nic" },
      odrobaczanie: { active: true, days: 0, time: "09:00", notify: "nic" },
      suplementy: { active: true, days: 0, time: "09:00", notify: "nic" },
      szczepienie: { active: true, days: 0, time: "09:00", notify: "nic" },
      dentysta: { active: true, days: 0, time: "09:00", notify: "nic" },
      inne: { active: true, days: 0, time: "09:00", notify: "nic" },
    });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // TODO
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/ustawienia");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Błąd pobierania ustawień");
        setSettings(data);
      } catch (err) {
        // setError((err as Error).message);
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: string, type: "days" | "time" | "active" | "notify") => {
    let value: any = e.target.value;

    if (type === "active") {
      value = (e.target as HTMLInputElement).checked;
    } else if (type === "days") {
      value = Math.max(0, Number(value));
    } else if (type === "time") {
      const hour = value.split(":")[0];
      value = `${hour}:00`;
    }

    setSettings((prev) => ({
      ...prev,
      [field]: { ...prev[field as keyof typeof settings], [type]: value },
    }));
  };

  // TODO
  const handleSaveSettings = async () => {
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/ustawienia", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Błąd zapisywania ustawień");

      setSuccess("✅ Ustawienia zostały zapisane!");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-green-800 to-brown-600 p-6">
      <h2 className="text-3xl font-bold text-white mb-6">⚙️ Ustawienia</h2>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}

      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
        {Object.entries(settings).map(([key, value]) => (
          <div
            key={key}
            className={`mb-4 p-3 rounded-md transition ${
                value.active ? "bg-gray-100" : "bg-gray-300 line-through opacity-60"
            }`}
          >
            <label className="block text-gray-700 font-semibold capitalize mb-1">
              {key.replace("_", " ")}
            </label>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={value.active}
                onChange={(e) => handleInputChange(e, key, "active")}
                className="w-5 h-5"
              />
              <input
                type="number"
                min="0"
                name={`${key}-days`}
                placeholder="Ile dni"
                className="w-1/4 p-2 border rounded text-center"
                value={value.days}
                onChange={(e) => handleInputChange(e, key, "days")}
              />
              <input
                type="time"
                step="3600"
                name={`${key}-time`}
                className="w-1/4 p-2 border rounded text-center"
                value={value.time}
                onChange={(e) => handleInputChange(e, key, "time")}
              />
               <select
                name={`${key}-notify`}
                className="w-1/4 p-2 border rounded"
                value={value.notify}
                onChange={(e) => handleInputChange(e, key, "notify")}
                disabled={!value.active}
              >
                <option value="oba">Oba</option>
                <option value="push">Push</option>
                <option value="email">Email</option>
                <option value="nic">Nic</option>
              </select>
            </div>
          </div>
        ))}

        <button
          onClick={handleSaveSettings}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg"
        >
          💾 Zapisz ustawienia
        </button>

        <div className="mt-6">
          <Link
            to="/restart"
            className="block text-center w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition shadow-lg"
          >
            🔄 Zmień hasło
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Settings;
