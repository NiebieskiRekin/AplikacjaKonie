import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "./db";
import { ProcessEnv } from "./env";
import { log } from "./logs/logger";
import { user } from "./db/schema";

async function main() {
  log("seed", "info", "Seeding default admin user...");

  let _user;
  try {
    _user = await auth.api.createUser({
      body: {
        email: "admin@example.com",
        password: ProcessEnv.INITIAL_ADMIN_PASSWORD,
        name: "Admin",
        role: "admin",
      },
    });

    await db
      .update(user)
      .set({ emailVerified: true })
      .where(eq(user.id, _user.user.id));

    log("seed", "info", "User created successfully:" + JSON.stringify(user));
  } catch (error) {
    log("seed", "error", `Error creating user: ${String(error)}`);
  }

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
      "Organization created successfully:" + JSON.stringify(org)
    );
  } catch (error) {
    log("seed", "error", `Error creating organization: ${String(error)}`);
  }
}

void main();
