import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient } from "better-auth/client/plugins";
export const authClient = createAuthClient({
  plugins: [adminClient(), organizationClient()],
  fetchOptions: {
    onError: async (context) => {
      const { response } = context;
      if (response.status === 401) {
        window.location.href = "/login";
      }
    },
  },
});
