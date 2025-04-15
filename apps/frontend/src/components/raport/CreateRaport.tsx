import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { eventTypes, type EventType, type ReportRequestData } from "./types";

function CreateReport() {
  const navigate = useNavigate();
  // const [success, setSuccess] = useState("");
  const { id } = useParams();
  const [, setError] = useState("");
  // const [showPopup, setShowPopup] = useState(false);
  const [events, setEvents] = useState<EventType[]>(
    eventTypes.map((event) => ({
      name: event,
      isChecked: true,
      isAllChecked: true,
      dateFrom: "",
      dateTo: "",
    }))
  );

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

  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    dateType: "dateFrom" | "dateTo"
  ) => {
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

    const requestData: ReportRequestData[] = [];

    for (const event of events) {
      // Jeżeli nie zaznaczony to wywalone
      if (!event.isChecked) {
        continue;
      }

      const data: ReportRequestData = {
        event: event.name,
        all: event.isAllChecked, // Jeśli checkbox "Wszystkie" jest zaznaczony, wysyłamy 'all: true'
        from: event.isAllChecked ? null : event.dateFrom, // Jeśli "Wszystkie" zaznaczone, "od kiedy?" jest null
        to: event.isAllChecked ? null : event.dateTo, // Jeśli "Wszystkie" zaznaczone, "do kiedy?" jest null
      };

      requestData.push(data);
    }
    await navigate(
      `/raport/html/${id}?data=${encodeURIComponent(JSON.stringify(requestData))}`
    );

    try {
      const response = await fetch(`/api/raport/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ events: requestData }),
      });

      if (!response.ok) {
        const data: unknown = await response.json();
        if (
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
        ) {
          throw new Error(data.error);
        } else {
          throw new Error("Błąd podczas wysyłania raportu");
        }
      }

      await response.json();

      //   setSuccess("Raport został wysłany!");
      //   setShowPopup(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="to-brown-600 flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-800 p-6">
      <div className="w-full max-w-5xl rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-8 text-center text-3xl font-bold text-green-800">
          Stwórz raport
        </h2>

        {events.map((event, index) => (
          <div
            key={event.name}
            className={`mb-4 flex flex-col items-center justify-between rounded-lg p-4 transition duration-300 sm:flex-row ${
              !event.isChecked
                ? "line-through opacity-50"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <div className="mb-4 flex w-full items-center gap-4 sm:mb-0 sm:w-1/3">
              <input
                type="checkbox"
                checked={event.isChecked}
                onChange={() => handleCheckboxChange(index)}
                className="h-6 w-6 rounded-md border-gray-300"
              />
              <span className="text-lg font-semibold">{event.name}</span>
            </div>

            <div className="mb-4 flex w-full items-center gap-4 sm:mb-0 sm:w-1/3">
              <input
                type="checkbox"
                checked={event.isAllChecked}
                onChange={() => handleAllCheckboxChange(index)}
                className="h-6 w-6 rounded-md border-gray-300"
              />
              <span className="text-sm text-gray-600">Wszystkie</span>
            </div>

            <div className="w-full flex-1 sm:w-auto">
              <div className="flex w-full flex-col gap-4 sm:flex-row">
                <div className="w-full sm:w-1/2">
                  <label
                    htmlFor={`fromDate-${index}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Od kiedy?
                  </label>
                  <input
                    type="date"
                    name="Od kiedy?"
                    id={`fromDate-${index}`}
                    value={event.dateFrom}
                    onChange={(e) => handleDateChange(e, index, "dateFrom")}
                    disabled={event.isAllChecked}
                    className={`w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-green-500 ${
                      event.isAllChecked ? "bg-gray-200" : ""
                    }`}
                  />
                </div>

                <div className="w-full sm:w-1/2">
                  <label
                    htmlFor={`toDate-${index}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Do kiedy?
                  </label>
                  <input
                    type="date"
                    name="Do kiedy?"
                    id={`toDate-${index}`}
                    value={event.dateTo}
                    onChange={(e) => handleDateChange(e, index, "dateTo")}
                    disabled={event.isAllChecked}
                    className={`w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-green-500 ${
                      event.isAllChecked ? "bg-gray-200" : ""
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={(e) => void handleSubmit(e)}
          className="mt-6 w-full rounded-md bg-purple-600 px-6 py-3 text-white shadow-lg transition duration-300 hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
        >
          📤 Stwórz raport
        </button>
      </div>
    </div>
  );
}

export default CreateReport;
