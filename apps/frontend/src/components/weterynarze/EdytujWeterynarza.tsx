import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";

function EditWeterynarz() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    imieINazwisko: "",
    numerTelefonu: "",
    hodowla: 0,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);

  useEffect(() => {
    const fetchWeterynarz = async () => {
      try {
        const response = await fetch(`/api/weterynarze/${id}`);
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Błąd pobierania danych");

        setFormData({
          imieINazwisko: data.imieINazwisko || "",
          numerTelefonu: data.numerTelefonu || "",
          hodowla: data.hodowla || 0,
        });
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchWeterynarz();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/weterynarze/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Błąd edycji weterynarza");

      setSuccess("Dane weterynarza zostały zaktualizowane!");
      setTimeout(() => navigate("/weterynarze"), 1500);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async () => {
    setDeleteError("");
    try {
      const response = await fetch(`/api/weterynarze/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Błąd usuwania weterynarza");

      setIsDeletePopupOpen(false);
      navigate("/weterynarze");
    } catch (err) {
      setDeleteError((err as Error).message);
    }
  };

  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-6">
      <h2 className="mb-6 text-3xl font-bold text-white">
        ✏️ Edytuj Weterynarza
      </h2>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
      {deleteError && <p className="text-red-600">{deleteError}</p>}

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
      >
        <label className="block text-gray-700">👤 Imię i nazwisko:</label>
        <input
          type="text"
          name="imieINazwisko"
          value={formData.imieINazwisko}
          className="mb-3 w-full rounded border p-2"
          required
          onChange={handleInputChange}
        />

        <label className="block text-gray-700">📞 Numer telefonu:</label>
        <input
          type="text"
          name="numerTelefonu"
          value={formData.numerTelefonu}
          className="mb-3 w-full rounded border p-2"
          onChange={handleInputChange}
        />

        <button
          type="submit"
          className="w-full rounded-lg bg-green-600 py-3 text-white transition hover:bg-green-700"
        >
          💾 Zapisz zmiany
        </button>
      </form>

      <button
        onClick={() => setIsDeletePopupOpen(true)}
        className="mt-4 w-full max-w-md rounded-lg bg-gradient-to-r from-rose-900 to-red-700 py-3 text-white shadow-lg transition hover:from-red-700 hover:to-red-800"
      >
        ❌ Usuń weterynarza
      </button>

      {isDeletePopupOpen && (
        <div className="bg-opacity-10 fixed inset-0 flex items-center justify-center backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-lg">
            <p className="mb-4 text-lg font-bold text-red-600">
              Czy na pewno chcesz usunąć tego weterynarza?
            </p>
            <p className="mb-4 text-gray-700">
              Ta operacja jest nieodwracalna.
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
                onClick={handleDelete}
              >
                Usuń
              </button>
              <button
                className="rounded-lg bg-gray-400 px-4 py-2 text-white transition hover:bg-gray-500"
                onClick={() => setIsDeletePopupOpen(false)}
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditWeterynarz;
