import { Hono } from "hono";
import { GetSignedUrlConfig, Storage } from "@google-cloud/storage";
import { ProcessEnv } from "@/backend/env";
import { JsonMime, response_failure_schema } from "./constants";
import { resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { auth, auth_vars } from "../auth";
import { zValidator } from "@hono/zod-validator";

const key_schema = z.object({
  type: z.string(),
  project_id: z.string(),
  private_key_id: z.string(),
  private_key: z.string(),
  client_email: z.email(),
  client_id: z.string(),
  auth_uri: z.url(),
  token_uri: z.url(),
  auth_provider_x509_cert_url: z.url(),
  client_x509_cert_url: z.url(),
  universe_domain: z.string(),
});

const key = key_schema.parse(
  JSON.parse(Buffer.from(ProcessEnv.GOOGLE_API_KEY_BASE64, "base64").toString())
);

const storage = new Storage({
  projectId: ProcessEnv.BUCKET_PROJECT_ID,
  credentials: key,
});

const bucketName = ProcessEnv.BUCKET_NAME;

// https://github.com/googleapis/nodejs-storage/blob/main/samples/generateV4UploadSignedUrl.js
export async function generateV4UploadSignedUrl(
  filename: string,
  contentType: string
) {
  const options: GetSignedUrlConfig = {
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType: contentType,
  };

  const [url] = await storage
    .bucket(bucketName)
    .file(filename)
    .getSignedUrl(options);

  return url;
}

// https://github.com/googleapis/nodejs-storage/blob/main/samples/generateV4ReadSignedUrl.js
export async function generateV4ReadSignedUrl(filename: string) {
  const options: GetSignedUrlConfig = {
    version: "v4",
    action: "read",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  };

  const [url] = await storage
    .bucket(bucketName)
    .file(filename)
    .getSignedUrl(options);

  return url;
}

const success_response_schema = z.object({ url: z.url() });

const images = new Hono<auth_vars>()
  .get(
    "/upload/:filename",
    zValidator(
      "query",
      z
        .object({
          contentType: z.string().openapi({ example: "image/jpeg" }),
        })
        .strict()
    ),
    describeRoute({
      description:
        "Pobierz link do przesłania zdjęcia o wskazanym id (filename)",
      responses: {
        200: {
          description: "Pomyślne zapytanie",
          content: {
            [JsonMime]: { schema: resolver(success_response_schema) },
          },
        },
        500: {
          description: "Bład serwera",
          content: {
            [JsonMime]: { schema: resolver(response_failure_schema) },
          },
        },
      },
    }),
    async (c) => {
      try {
        const session = await auth.api.getSession({
          headers: c.req.raw.headers,
        });

        const userId = session?.user.id;
        const orgId = session?.session.activeOrganizationId;
        if (!userId || !orgId)
          return c.json({ error: "Błąd autoryzacji" }, 401);

        const filename = c.req.param("filename");
        const { contentType } = c.req.valid("query");
        const signed_url = await generateV4UploadSignedUrl(
          filename,
          contentType
        );

        return c.json({ url: signed_url }, 200);
      } catch (e) {
        console.error("Error generating upload URL:", e);
        return c.json({ error: "Błąd serwera" }, 500);
      }
    }
  )
  .get(
    "/read/:filename",
    describeRoute({
      description:
        "Pobierz link do wyświetlenia zdjęcia o wskazanym id (filename)",
      responses: {
        200: {
          description: "Pomyślne zapytanie",
          content: {
            [JsonMime]: { schema: resolver(success_response_schema) },
          },
        },
        500: {
          description: "Bład serwera",
          content: {
            [JsonMime]: { schema: resolver(response_failure_schema) },
          },
        },
      },
    }),
    async (c) => {
      try {
        const filename = c.req.param("filename");
        const signed_url = await generateV4ReadSignedUrl(filename);

        return c.json({
          url: signed_url,
        });
      } catch {
        return c.json({ error: "Błąd serwera" }, 500);
      }
    }
  );

export default images;
