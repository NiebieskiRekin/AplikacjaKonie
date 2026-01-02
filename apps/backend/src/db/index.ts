import { drizzle } from "drizzle-orm/node-postgres";
import { DrizzleWinstonLogger } from "./logger";
import { ProcessEnv } from "../env";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export const connection = new Pool({
  connectionString: ProcessEnv.DATABASE_URL,
  options: `-c search_path=${ProcessEnv.DATABASE_SCHEMA}`,
});

export const db = drizzle({
  client: connection,
  schema: { ...schema },
  logger: new DrizzleWinstonLogger(),
});

export { schema };
