import z from "zod";

export const eventTypes = [
  "Podkucia",
  "Szczepienie",
  "Odrobaczanie",
  "Podanie suplementów",
  "Dentysta",
  "Inne",
  "Choroby",
  "Leczenia",
  "Rozrody",
] as const;

export const zEventTypesEnum = z.enum(eventTypes);

export type EventTypesEnum = z.infer<typeof zEventTypesEnum>;

export const zEventType = z.object({
  name: zEventTypesEnum,
  isChecked: z.boolean(),
  isAllChecked: z.boolean(),
  dateFrom: z.string(),
  dateTo: z.string(),
});

export type EventType = z.infer<typeof zEventType>;

export const zReportRequestData = z.object({
  event: zEventTypesEnum,
  all: z.boolean(),
  from: z.string().nullable(),
  to: z.string().nullable(),
});

export const zReportRequestDataArray = z.array(zReportRequestData);

export type ReportRequestData = z.infer<typeof zReportRequestData>;
