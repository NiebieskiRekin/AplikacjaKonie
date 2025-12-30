import { auth } from "./auth";
import { ProcessEnv } from "./env";
import { log } from "./logs/logger";

async function main() {
  log("seed", "info", "Seeding default admin user...");

  let user;
  try {
    user = await auth.api.createUser({
      body: {
        email: "admin@example.com",
        password: ProcessEnv.INITIAL_ADMIN_PASSWORD,
        name: "Admin",
        role: "admin",
      },
    });

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
        userId: user?.user.id,
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
