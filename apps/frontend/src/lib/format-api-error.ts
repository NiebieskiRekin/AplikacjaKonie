// https://github.com/w3cj/monorepo-example-tasks-app/blob/main/apps/web/src/lib/format-api-error.ts
import type { ErrorSchema } from "@aplikacja-konie/api-client";

export default function formatApiError(apiError: ErrorSchema) {
  return apiError
    .error
    .issues
    .reduce((all, issue) => `${all + issue.path.join(".")}: ${issue.message}\n`, "");
}