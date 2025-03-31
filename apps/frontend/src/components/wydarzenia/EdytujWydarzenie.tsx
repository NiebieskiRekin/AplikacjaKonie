import { useParams } from "react-router";
import BaseHorseEventForm from "./BaseHorseEventForm";
import { eventTypes } from "@/frontend/types/event-types";
import { eventTypesNamesSchema } from "@/frontend/types/event-types";

const EditHorseEvent = () => {
  const { id, type, eventId } = useParams<{
    id: string;
    type: string;
    eventId: string;
  }>();
  const formAction = async (formData: string) => {
    try {
      const okType = eventTypesNamesSchema.parse(type);
      const response = await fetch(
        `/api/wydarzenia/${eventTypes[okType].apiEndpoint}/${eventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: formData,
        }
      );

      if (!response.ok) {
        const data: unknown = await response.json();
        if (
          typeof data == "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error == "string"
        ) {
          throw new Error(data.error);
        } else {
          throw new Error("Błąd aktualizacji wydarzenia");
        }
      }

      await response.json();
    } catch {
      throw new Error("Invalid event type");
    }
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
