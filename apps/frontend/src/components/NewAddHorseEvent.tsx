import { useParams } from "react-router";
import BaseHorseEventForm, { eventTypes } from "./BaseHorseEventForm";

const AddHorseEvent = () => {
  const { id, type } = useParams<{ id: string; type: string }>();

  const formAction = async (formData: any) => {
    if (!type || !eventTypes[type]) {
      throw new Error("Invalid or missing event type");
    }
    
    // Tutaj inny endpoint niż na backendzie...
    if (eventTypes[type].apiEndpoint == "zdarzenia-profilaktyczne") eventTypes[type].apiEndpoint = "zdarzenie-profilaktyczne";
    const response = await fetch(`/api/wydarzenia/${eventTypes[type].apiEndpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Błąd dodawania wydarzenia");
  };

  if (!id) throw new Error( "Błąd id");
  if (!type) throw new Error( "Błąd id");

  return (
    <BaseHorseEventForm
      id={id}
      type={type}
      eventId={undefined}
      eventTypes={eventTypes}
      formAction={formAction}
      edit={false}
    />
  );
};

export default AddHorseEvent;
