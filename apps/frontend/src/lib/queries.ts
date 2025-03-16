import APIClient from "../lib/api-client";
import formatApiError from "../lib/format-api-error";
import type { ErrorSchema } from "@aplikacja-konie/api-client";
import { queryOptions, QueryOptions } from "@tanstack/react-query";

export const queryKeys = {
  LIST_HORSES: { queryKey: ["list-horses"] },
  LIST_HORSE: (id: number) => ({ queryKey: [`list-horse-${id}`] }),
};

export const horsesQueryOptions = queryOptions({
  ...queryKeys.LIST_HORSES,
  queryFn: async () => {},
});
