import {hodowcyKoni, konie, zdjeciaKoni, files, podkucia, kowale, choroby, leczenia, rozrody, zdarzeniaProfilaktyczne, weterynarze} from "./schema"

// NOTE: to use these types in the frontend just hover over the type name and copy the code
// NOTE: in order to have nullability on select on nullable types as well as all fields with
//       optional annotations on insert you must enable these options in tsconfig.json
//       "strict": true,
//       "strictNullChecks": true
// see for more details: https://github.com/drizzle-team/drizzle-orm/issues/2636

export type SelectHodowcaKoni = typeof hodowcyKoni.$inferSelect;
export type InsertHodowcaKoni = typeof hodowcyKoni.$inferInsert;
export type SelectKon = typeof konie.$inferSelect;
export type InsertKon = typeof konie.$inferInsert;
export type SelectZdjecieKonia = typeof zdjeciaKoni.$inferSelect;
export type InsertZdjecieKonia = typeof zdjeciaKoni.$inferInsert;
export type SelectFile = typeof files.$inferSelect;
export type InsertFile = typeof files.$inferInsert;
export type SelectPodkucie = typeof podkucia.$inferSelect;
export type InsertPodkucie = typeof podkucia.$inferInsert;
export type SelectKowal = typeof kowale.$inferSelect;
export type InsertKowal = typeof kowale.$inferInsert;
export type SelectChoroba = typeof choroby.$inferSelect;
export type InsertChoroba = typeof choroby.$inferInsert;
export type SelectLeczenie = typeof leczenia.$inferSelect;
export type InsertLeczenie = typeof leczenia.$inferInsert;
export type SelectRozrod = typeof rozrody.$inferSelect;
export type InsertRozrod = typeof rozrody.$inferInsert;
export type SelectZdarzenieProfilaktyczne = typeof zdarzeniaProfilaktyczne.$inferSelect;
export type InsertZdarzenieProfilaktyczne = typeof zdarzeniaProfilaktyczne.$inferInsert;
export type SelectWeterynarz = typeof weterynarze.$inferSelect;
export type InsertWeterynarz = typeof weterynarze.$inferInsert;