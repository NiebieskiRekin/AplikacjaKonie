import { useState } from "react";
import { useNavigate, useParams } from "react-router";

type EventType = {
  name: string;
  isChecked: boolean;
  isAllChecked: boolean;
  dateFrom: string;
  dateTo: string;
};

const eventTypes = [
  "Podkucie",
  "Szczepienie",
  "Odrobaczanie",
  "Podanie suplementów",
  "Dentysta",
  "Inne",
  "Choroby",
  "Leczenia",
  "Rozrody",
];

function CreateReport() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState("");
  const { id } = useParams(); 
  const [error, setError] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [events, setEvents] = useState<EventType[]>(eventTypes.map((event) => ({
    name: event,
    isChecked: true,
    isAllChecked: true,
    dateFrom: "",
    dateTo: "",
  })));

  const handleCheckboxChange = (index: number) => {
    setEvents((prevState) =>
      prevState.map((event, i) =>
        i === index
          ? {
              ...event,
              isChecked: !event.isChecked,
            }
          : event
      )
    );
  };

  const handleAllCheckboxChange = (index: number) => {
    setEvents((prevState) =>
      prevState.map((event, i) =>
        i === index
          ? {
              ...event,
              isAllChecked: !event.isAllChecked,
              dateFrom: "", // Reset
              dateTo: "", // Reset
            }
          : event
      )
    );
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, index: number, dateType: "dateFrom" | "dateTo") => {
    const { value } = e.target;
    setEvents((prevState) =>
      prevState.map((event, i) =>
        i === index
          ? {
              ...event,
              [dateType]: value,
            }
          : event
      )
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const requestData = [];

    for (const event of events) {
      // Jeżeli nie zaznaczony to wywalone
      if (!event.isChecked) {
        continue;
      }

      const data = {
        event: event.name,
        all: event.isAllChecked, // Jeśli checkbox "Wszystkie" jest zaznaczony, wysyłamy 'all: true'
        from: event.isAllChecked ? null : event.dateFrom, // Jeśli "Wszystkie" zaznaczone, "od kiedy?" jest null
        to: event.isAllChecked ? null : event.dateTo, // Jeśli "Wszystkie" zaznaczone, "do kiedy?" jest null
      };

      requestData.push(data);
    }
    navigate(`/raport/html/${id}?data=${encodeURIComponent(JSON.stringify(requestData))}`);

    try {
      const response = await fetch(`/api/raport/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ events: requestData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Błąd podczas wysyłania raportu");
      }

    //   setSuccess("Raport został wysłany!");
    //   setShowPopup(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center bg-gradient-to-br from-green-800 p-6 justify-center">
        <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-xl">
      <h2 className="text-3xl font-bold text-center text-green-800 mb-8">Stwórz raport</h2>

      {events.map((event, index) => (
        <div
          key={event.name}
          className={`flex flex-col sm:flex-row items-center justify-between p-4 mb-4 rounded-lg transition duration-300 ${
            !event.isChecked ? "opacity-50 line-through" : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          <div className="flex items-center gap-4 w-full sm:w-1/3 mb-4 sm:mb-0">
            <input
              type="checkbox"
              checked={event.isChecked}
              onChange={() => handleCheckboxChange(index)}
              className="h-6 w-6 border-gray-300 rounded-md"
            />
            <span className="text-lg font-semibold">{event.name}</span>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-1/3 mb-4 sm:mb-0">
            <input
              type="checkbox"
              checked={event.isAllChecked}
              onChange={() => handleAllCheckboxChange(index)}
              className="h-6 w-6 border-gray-300 rounded-md"
            />
            <span className="text-sm text-gray-600">Wszystkie</span>
          </div>

          <div className="flex-1 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <div className="w-full sm:w-1/2">
                <label htmlFor={`fromDate-${index}`} className="text-sm font-medium text-gray-700 block">
                  Od kiedy?
                </label>
                <input
                  type="date"
                  name="Od kiedy?"
                  id={`fromDate-${index}`}
                  value={event.dateFrom}
                  onChange={(e) => handleDateChange(e, index, "dateFrom")}
                  disabled={event.isAllChecked}
                  className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 ${
                    event.isAllChecked ? "bg-gray-200" : ""
                  }`}
                />
              </div>

              <div className="w-full sm:w-1/2">
                <label htmlFor={`toDate-${index}`} className="text-sm font-medium text-gray-700 block">
                  Do kiedy?
                </label>
                <input
                  type="date"
                  name="Do kiedy?"
                  id={`toDate-${index}`}
                  value={event.dateTo}
                  onChange={(e) => handleDateChange(e, index, "dateTo")}
                  disabled={event.isAllChecked}
                  className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 ${
                    event.isAllChecked ? "bg-gray-200" : ""
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="mt-6 w-full rounded-md bg-purple-600 px-6 py-3 text-white shadow-lg transition duration-300 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        📤 Stwórz raport
      </button>
    </div>
  </div>
);
}

export default CreateReport;
