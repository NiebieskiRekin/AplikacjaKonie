import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";

function Settings() {
    const navigate = useNavigate();

    const [settings, setSettings] = useState({
        Podkucia: { active: false, days: 7, time: "09:00", notify: "Oba" },
        Odrobaczanie: { active: false, days: 7, time: "09:00", notify: "Oba" },
        "Podanie suplementów": { active: false, days: 7, time: "09:00", notify: "Oba" },
        Szczepienie: { active: false, days: 7, time: "09:00", notify: "Oba" },
        Dentysta: { active: false, days: 7, time: "09:00", notify: "Oba" },
        Inne: { active: false, days: 7, time: "09:00", notify: "Oba" },
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
                if (!response.ok) throw new Error(data.error || "Błąd pobierania ustawień");
                if (Object.keys(data).length !== 0) {
                    setSettings(data);
                }
            } catch (err) {
                // setError((err as Error).message);
            }
        };
        fetchSettings();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: string, type: "days" | "time" | "active" | "notify") => {
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
            if (!response.ok) throw new Error(data.error || "Błąd zapisywania ustawień");

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
        <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-green-800 to-brown-600 p-6">
                <h2 className="text-3xl font-bold text-white mb-6 text-center sm:text-left">⚙️ Ustawienia Powiadomień</h2>

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

                        <div className="grid max-sm:grid-cols-2 max-sm:gap-3 sm:flex sm:items-center sm:gap-3">
                        <div className="flex items-center gap-2">
                            <input
                            type="checkbox"
                            checked={value.active}
                            onChange={(e) => handleInputChange(e, key, "active")}
                            className="w-5 h-5 flex-shrink-0"
                            />
                            <span className="text-gray-700 text-sm sm:hidden">Aktywne</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <input
                            type="number"
                            min="0"
                            name={`${key}-days`}
                            placeholder="Ile dni"
                            className="w-full p-2 border rounded text-center"
                            value={value.days}
                            onChange={(e) => handleInputChange(e, key, "days")}
                            />
                            <span className="text-gray-700">dni</span>
                        </div>

                        <input
                            type="time"
                            step="3600"
                            name={`${key}-time`}
                            className="p-2 border rounded text-center w-full"
                            value={value.time}
                            onChange={(e) => handleInputChange(e, key, "time")}
                        />

                        <select
                            name={`${key}-notify`}
                            className="p-2 border rounded w-full"
                            value={value.notify}
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

            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center backdrop-blur-lg bg-opacity-30">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
                        <h3 className="text-lg font-bold text-gray-800">✅ Ustawienia zapisane!</h3>
                        <p className="text-gray-600 mt-2">Twoje ustawienia zostały pomyślnie zaktualizowane.</p>
                        <button
                            onClick={handleClosePopup}
                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
