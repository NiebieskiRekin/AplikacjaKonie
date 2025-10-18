import { drizzle } from "drizzle-orm/node-postgres";
import { DrizzleWinstonLogger } from "./logger";
import { ProcessEnv } from "../env";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export const db = drizzle({
  client: new Pool({
    connectionString: ProcessEnv.DATABASE_URL,
  }),
  schema: { ...schema },
  logger: new DrizzleWinstonLogger(),
});

export { eq } from "drizzle-orm";
