import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { APIClient } from "../lib/api-client";
import formatApiError from "../lib/format-api-error";
import type { ErrorSchema } from "@aplikacja-konie/api-client";
import { BackendTypes } from "@aplikacja-konie/api-client";
import { tryParseJson } from "@/frontend/lib/safe-json";

const default_setting_value = {
  active: false,
  days: 7,
  time: "09:00",
  rodzajWysylania: "Oba" as BackendTypes.RodzajWysylaniaPowiadomienia,
};

function Settings() {
  const [settings, setSettings] = useState<BackendTypes.Setting>({
    Podkucia: default_setting_value,
    Odrobaczanie: default_setting_value,
    "Podanie suplementów": default_setting_value,
    Szczepienie: default_setting_value,
    Dentysta: default_setting_value,
    Inne: default_setting_value,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await APIClient.api.ustawienia.$get();

        if (response.status === 200) {
          const data = await tryParseJson(response);
          if (Object.keys(data).length !== 0) {
            setSettings(data);
          }
        } else {
          const data = await tryParseJson(response);
          throw new Error(data.error || "Błąd pobierania ustawień");
        }
      } catch (err) {
        setError(formatApiError(err as ErrorSchema));
      }
    };
    void fetchSettings();
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

  const handleSaveSettings = async () => {
    setError("");
    setSuccess("");

    try {
      const response = await APIClient.api.ustawienia.$put({ json: settings });

      if (response.status === 200) {
        setSuccess("✅ Ustawienia zostały zapisane!");
        setShowPopup(true);
      } else if (!response.ok) {
        const data = await tryParseJson(response);
        throw new Error(data.error || "Błąd zapisywania ustawień");
      }
    } catch (err) {
      const formatted = formatApiError(err as ErrorSchema);
      const message =
        (err instanceof Error && err.message) || formatted || "Nieznany błąd";
      setError(message);

      if (message.includes("TypeError") || message.includes("NetworkError")) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    void navigate("/konie"); // Przekierowanie po zamknięciu popupu
  };

  useEffect(() => {
    if (error && error.includes("TypeError")) {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, [error]);

  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-6">
      <h2 className="mb-6 text-center text-3xl font-bold text-white sm:text-left">
        ⚙️ Ustawienia Powiadomień
      </h2>

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

            <div className="grid max-sm:grid-cols-2 max-sm:gap-3 sm:flex sm:items-center sm:gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value.active}
                  onChange={(e) => handleInputChange(e, key, "active")}
                  className="h-5 w-5 flex-shrink-0"
                />
                <span className="text-sm text-gray-700 sm:hidden">Aktywne</span>
              </div>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  name={`${key}-days`}
                  placeholder="Ile dni"
                  className="w-full rounded border p-2 text-center"
                  value={value.days}
                  onChange={(e) => handleInputChange(e, key, "days")}
                />
                <span className="text-gray-700">dni</span>
              </div>

              <select
                name={`${key}-time`}
                className="w-full rounded border p-2 text-center"
                value={value.time}
                onChange={(e) => handleInputChange(e, key, "time")}
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = String(i).padStart(2, "0");
                  return (
                    <option key={hour} value={`${hour}:00`}>
                      {hour}:00
                    </option>
                  );
                })}
              </select>

              <select
                name={`${key}-notify`}
                className="w-full rounded border p-2"
                value={value.rodzajWysylania}
                onChange={(e) => handleInputChange(e, key, "notify")}
                disabled={!value.active}
              >
                <option value="Oba">Oba</option>
                <option value="Push">Push</option>
                <option value="Email">Email</option>
              </select>
            </div>
          </div>
        ))}

        <button
          onClick={() => void handleSaveSettings()}
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
