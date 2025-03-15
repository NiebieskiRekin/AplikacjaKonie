import type { ApiRoutes } from "@aplikacja-konie/backend/routes";
export type * as BackendTypes from "@aplikacja-konie/backend/schema";

import { hc } from "hono/client";

// create instance to inline type in build
// https://hono.dev/docs/guides/rpc#compile-your-code-before-using-it-recommended
export const client = hc<ApiRoutes>("");
export type apiClient = typeof client;

export default (...args: Parameters<typeof hc>): apiClient =>
  hc<ApiRoutes>(...args);

export type ErrorSchema = {
  error: {
    issues: {
      code: string;
      path: (string | number)[];
      message?: string | undefined;
    }[];
    name: string;
  };
  success: boolean;
};
