import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";

function Settings() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    Podkucia: { active: true, days: 7, time: "09:00", notify: "Żadne" },
    Odrobaczanie: { active: true, days: 7, time: "09:00", notify: "Żadne" },
    "Podanie suplementów": {
      active: true,
      days: 7,
      time: "09:00",
      notify: "Żadne",
    },
    Szczepienie: { active: true, days: 7, time: "09:00", notify: "Żadne" },
    Dentysta: { active: true, days: 7, time: "09:00", notify: "Żadne" },
    Inne: { active: true, days: 7, time: "09:00", notify: "Żadne" },
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  // TODO
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/ustawienia");
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Błąd pobierania ustawień");
        setSettings(data);
      } catch (err) {
        // setError((err as Error).message);
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: string,
    type: "days" | "time" | "active" | "notify"
  ) => {
    let value: string | number | boolean = e.target.value;

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

    const formattedSettings = Object.fromEntries(
      Object.entries(settings).map(([eventType, values]) => [
        eventType.charAt(0).toUpperCase() + eventType.slice(1),
        {
          days: values.days,
          time: values.time,
          active: values.active,
          rodzajWysylania: values.notify,
        },
      ])
    );

    try {
      const response = await fetch("/api/ustawienia", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedSettings),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Błąd zapisywania ustawień");

      setSuccess("✅ Ustawienia zostały zapisane!");
      setShowPopup(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    navigate("/konie"); // Przekierowanie po zamknięciu popupu
  };

  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-6">
      <h2 className="mb-6 text-3xl font-bold text-white">⚙️ Ustawienia</h2>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}

      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        {Object.entries(settings).map(([key, value]) => (
          <div
            key={key}
            className={`mb-4 rounded-md p-3 transition ${
              value.active
                ? "bg-gray-100"
                : "bg-gray-300 line-through opacity-60"
            }`}
          >
            <label className="mb-1 block font-semibold text-gray-700 capitalize">
              {key.replace("_", " ")}
            </label>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={value.active}
                onChange={(e) => handleInputChange(e, key, "active")}
                className="h-5 w-5"
              />
              <input
                type="number"
                min="0"
                name={`${key}-days`}
                placeholder="Ile dni"
                className="w-1/4 rounded border p-2 text-center"
                value={value.days}
                onChange={(e) => handleInputChange(e, key, "days")}
              />
              <input
                type="time"
                step="3600"
                name={`${key}-time`}
                className="w-1/4 rounded border p-2 text-center"
                value={value.time}
                onChange={(e) => handleInputChange(e, key, "time")}
              />
              <select
                name={`${key}-notify`}
                className="w-1/4 rounded border p-2"
                value={value.notify}
                onChange={(e) => handleInputChange(e, key, "notify")}
                disabled={!value.active}
              >
                <option value="Oba">Oba</option>
                <option value="Push">Push</option>
                <option value="Email">Email</option>
                <option value="Żadne">Żadne</option>
              </select>
            </div>
          </div>
        ))}

        <button
          onClick={handleSaveSettings}
          className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 py-3 text-white shadow-lg transition hover:from-blue-700 hover:to-blue-800"
        >
          💾 Zapisz ustawienia
        </button>

        <div className="mt-6">
          <Link
            to="/restart"
            className="block w-full rounded-lg bg-gradient-to-r from-red-600 to-red-700 py-3 text-center text-white shadow-lg transition hover:from-red-700 hover:to-red-800"
          >
            🔄 Zmień hasło
          </Link>
        </div>
      </div>

      {showPopup && (
        <div className="bg-opacity-30 fixed inset-0 flex items-center justify-center backdrop-blur-lg">
          <div className="max-w-md rounded-lg bg-white p-6 text-center shadow-lg">
            <h3 className="text-lg font-bold text-gray-800">
              ✅ Ustawienia zapisane!
            </h3>
            <p className="mt-2 text-gray-600">
              Twoje ustawienia zostały pomyślnie zaktualizowane.
            </p>
            <button
              onClick={handleClosePopup}
              className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
