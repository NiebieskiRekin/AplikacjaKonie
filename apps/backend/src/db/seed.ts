import { eq } from "drizzle-orm";
import { auth } from "../auth";
import { db } from ".";
import { ProcessEnv } from "../env";
import { log } from "../logs/logger";
import { user } from "./schema";
import { exit } from "node:process";

export async function seed_db() {
  if (ProcessEnv.SKIP_SEED) {
    log("seed", "info", "Skipping seed.");
    return;
  }

  const existingAdmin = await db.query.user.findFirst({
    where: eq(user.role, "admin"),
  });

  let _user;

  if (existingAdmin) {
    log("seed", "info", "Admin already exists. Skipping seed.");
    _user = existingAdmin;
  } else {
    log("seed", "info", "Seeding default admin user...");
    try {
      _user = (
        await auth.api.createUser({
          body: {
            email: ProcessEnv.INITIAL_ADMIN_EMAIL,
            password: ProcessEnv.INITIAL_ADMIN_PASSWORD,
            name: "Admin",
            role: "admin",
          },
        })
      ).user;

      await db
        .update(user)
        .set({ emailVerified: true })
        .where(eq(user.id, _user.id));

      log(
        "seed",
        "info",
        "User created successfully: " + JSON.stringify(_user)
      );
    } catch (error) {
      log("seed", "error", `Error creating user: ${String(error)}`);
      exit(1);
    }
  }

  const existingOrg = await db.query.organization.findFirst();

  if (existingOrg) {
    log("seed", "info", "Organization already exists. Skipping seed.");
  } else {
    log("seed", "info", "Seeding default organization...");

    try {
      const org = await auth.api.createOrganization({
        body: {
          name: "Moje konie",
          slug: "moje-konie",
          userId: _user.id,
        },
      });

      log(
        "seed",
        "info",
        "Organization created successfully: " + JSON.stringify(org)
      );
    } catch (error) {
      log("seed", "error", `Error creating organization: ${String(error)}`);
      exit(1);
    }
  }

  const existingApiKey = await db.query.apikey.findFirst({
    where: (apikey, { eq }) => eq(apikey.userId, _user.id),
  });

  if (existingApiKey) {
    log("seed", "info", "Admin API key already exists. Skipping seed.");
  } else {
    log("seed", "info", "Seeding default admin API key...");

    try {
      const _apiKey = await auth.api.createApiKey({
        body: {
          name: "admin-api-key",
          userId: _user.id,
        },
      });

      log(
        "seed",
        "info",
        "Default admin API key created successfully: " + JSON.stringify(_apiKey)
      );
    } catch (error) {
      log("seed", "warn", `Error creating API key: ${String(error)}`);
      // Not fatal
    }
  }
}
