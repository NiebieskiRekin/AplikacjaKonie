import { eq } from "drizzle-orm";
import { auth } from "../auth";
import { db } from ".";
import { ProcessEnv } from "../env";
import { log } from "../logs/logger";
import { user } from "./schema";

export async function seed_db() {
  const existingAdmin = await db.query.user.findFirst({
    where: eq(user.role, "admin"),
  });

  let _user;

  if (existingAdmin) {
    log("seed", "info", "Admin already exists. Skipping seed.");
  } else {
    log("seed", "info", "Seeding default admin user...");
    try {
      _user = await auth.api.createUser({
        body: {
          email: ProcessEnv.INITIAL_ADMIN_EMAIL,
          password: ProcessEnv.INITIAL_ADMIN_PASSWORD,
          name: "Admin",
          role: "admin",
        },
      });

      await db
        .update(user)
        .set({ emailVerified: true })
        .where(eq(user.id, _user.user.id));

      log(
        "seed",
        "info",
        "User created successfully: " + JSON.stringify(_user)
      );
    } catch (error) {
      log("seed", "error", `Error creating user: ${String(error)}`);
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
          userId: _user?.user.id,
        },
      });

      log(
        "seed",
        "info",
        "Organization created successfully: " + JSON.stringify(org)
      );
    } catch (error) {
      log("seed", "error", `Error creating organization: ${String(error)}`);
    }
  }
}
