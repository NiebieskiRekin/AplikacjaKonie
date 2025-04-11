import { useParams } from "react-router";
import BaseHorseEventForm from "./BaseHorseEventForm";
import { eventTypes } from "@/frontend/types/event-types";
import { tryParseJson } from "@/frontend/lib/safe-json";

const AddHorseEvent = () => {
  const { id, type } = useParams<{ id: string; type: string }>();

  const formAction = async (formData: string) => {
    if (!type || !eventTypes[type]) {
      throw new Error("Invalid or missing event type");
    }

    const response = await fetch(
      `/api/wydarzenia/${eventTypes[type].apiEndpoint}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: formData,
      }
    );

    if (!response.ok) {
      const data: unknown = await tryParseJson(response);
      if (
        typeof data == "object" &&
        data !== null &&
        "error" in data &&
        typeof data.error == "string"
      ) {
        throw new Error(data.error);
      } else {
        throw new Error("Błąd dodawania wydarzenia");
      }
    }

    await tryParseJson(response);
  };

  if (!id) throw new Error("Błąd id");
  if (!type) throw new Error("Błąd id");

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
