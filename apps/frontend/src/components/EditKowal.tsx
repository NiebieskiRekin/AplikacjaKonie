import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";

function EditKowal() {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const [formData, setFormData] = useState({ imieINazwisko: "", numerTelefonu: "", hodowla: 0 });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);


  useEffect(() => {
    const fetchKowal = async () => {
      try {
        const response = await fetch(`/api/kowale/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Błąd pobierania danych");

        setFormData({
          imieINazwisko: data.imieINazwisko || "",
          numerTelefonu: data.numerTelefonu || "",
          hodowla: data.hodowla || 0,
        });
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchKowal();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/kowale/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Błąd edycji kowala");

      setSuccess("Dane kowala zostały zaktualizowane!");
      setTimeout(() => navigate("/kowale"), 1500);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async () => {
    setDeleteError("");
    try {
      const response = await fetch(`/api/kowale/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Błąd usuwania kowala");

      setIsDeletePopupOpen(false);
      navigate("/kowale");
    } catch (err) {
      setDeleteError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-green-800 to-brown-600 p-6">
      <h2 className="text-3xl font-bold text-white mb-6">✏️ Edytuj Kowala</h2>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
      {deleteError && <p className="text-red-600">{deleteError}</p>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <label className="block text-gray-700">👤 Imię i nazwisko:</label>
        <input
          type="text"
          name="imieINazwisko"
          value={formData.imieINazwisko}
          className="w-full p-2 border rounded mb-3"
          required
          onChange={handleInputChange}
        />

        <label className="block text-gray-700">📞 Numer telefonu:</label>
        <input
          type="text"
          name="numerTelefonu"
          value={formData.numerTelefonu}
          className="w-full p-2 border rounded mb-3"
          onChange={handleInputChange}
        />

        <button type="submit" className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
        💾 Zapisz zmiany
        </button>
      </form>

      <button
        onClick={() => setIsDeletePopupOpen(true)}
        className="w-full mt-4 py-3 bg-gradient-to-r from-rose-900 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition shadow-lg max-w-md"
      >
        ❌ Usuń Kowala
      </button>

      {isDeletePopupOpen && (
        <div className="bg-opacity-10 fixed inset-0 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm text-center">
            <p className="text-lg font-bold text-red-600 mb-4">
              Czy na pewno chcesz usunąć tego Kowala?
            </p>
            <p className="text-gray-700 mb-4">Ta operacja jest nieodwracalna.</p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                onClick={handleDelete}
              >
                Usuń
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-gray-400 text-white hover:bg-gray-500 transition"
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

export default EditKowal;
