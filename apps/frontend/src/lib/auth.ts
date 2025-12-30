import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient } from "better-auth/client/plugins";
export const authClient = createAuthClient({
  baseURL: "/api/auth",
  plugins: [adminClient(), organizationClient()],
});
