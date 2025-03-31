import { useParams } from "react-router";
import BaseHorseEventForm from "./BaseHorseEventForm";
import { eventTypes } from "@/frontend/types/event-types";

const EditHorseEvent = () => {
  const { id, type, eventId } = useParams<{
    id: string;
    type: string;
    eventId: string;
  }>();

  const formAction = async (formData: any) => {
    if (!type || !eventTypes[type]) throw new Error("Invalid event type");

    const response = await fetch(
      `/api/wydarzenia/${eventTypes[type].apiEndpoint}/${eventId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      }
    );

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Błąd aktualizacji wydarzenia");
  };

  if (!id) throw new Error("Błąd id");
  if (!type) throw new Error("Błąd id");

  return (
    <BaseHorseEventForm
      id={id}
      type={type}
      eventId={eventId}
      eventTypes={eventTypes}
      formAction={formAction}
      edit={true}
    />
  );
};

export default EditHorseEvent;
