import z from "zod";

export const eventTypesNamesSchema = z.enum([
  "rozrody",
  "leczenia",
  "choroby",
  "zdarzenia_profilaktyczne",
  "podkucia",
]);

export const eventTypes: Record<
  string,
  {
    title: string;
    fields: string[];
    apiEndpoint: string;
    eventOptions?: string[];
  }
> = {
  rozrody: {
    title: "Dodaj wydarzenie rozrodu",
    fields: [
      "kon",
      "weterynarz",
      "dataZdarzenia",
      "rodzajZdarzenia",
      "opisZdarzenia",
    ],
    apiEndpoint: "rozrody",
    eventOptions: [
      "Inseminacja konia",
      "Sprawdzenie źrebności",
      "Wyźrebienie",
      "Inne",
    ],
  },
  leczenia: {
    title: "Dodaj wydarzenie leczenia",
    fields: ["kon", "weterynarz", "dataZdarzenia", "choroba", "opisZdarzenia"],
    apiEndpoint: "leczenia",
  },
  choroby: {
    title: "Dodaj chorobę",
    fields: ["kon", "dataRozpoczecia", "dataZakonczenia", "opisZdarzenia"],
    apiEndpoint: "choroby",
  },
  zdarzenia_profilaktyczne: {
    title: "Dodaj zdarzenie profilaktyczne",
    fields: [
      "konieId",
      "weterynarz",
      "dataZdarzenia",
      "dataWaznosci",
      "rodzajZdarzenia",
      "opisZdarzenia",
    ],
    apiEndpoint: "zdarzenia_profilaktyczne",
    eventOptions: [
      "Szczepienie",
      "Odrobaczanie",
      "Podanie suplementów",
      "Dentysta",
      "Inne",
    ],
  },
  podkucia: {
    title: "Dodaj podkucie",
    fields: ["kon", "kowal", "dataZdarzenia", "dataWaznosci"],
    apiEndpoint: "podkucie",
  },
};
