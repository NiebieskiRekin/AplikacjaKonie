import { Hono } from "hono";
// import { eq, desc, sql, and } from "drizzle-orm";
// import {
//   konie,
//   users,
//   konieInsertSchema,
//   choroby,
//   leczenia,
//   podkucia,
//   rozrody,
//   zdarzeniaProfilaktyczne,
//   zdjeciaKoniInsertSchema,
//   zdjeciaKoni,
// } from "../db/schema";
// import { db } from "../db";
import {
  authMiddleware,
  // getUserFromContext,
  UserPayload,
} from "../middleware/auth";
// import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
// import { randomUUID } from "node:crypto";
import { GetSignedUrlConfig, Storage } from "@google-cloud/storage";
import { ProcessEnv } from "../env";
import { describeRoute } from "hono-openapi";
import { JsonMime, response_failure_schema } from "./constants";
import { resolver } from "hono-openapi/zod";

const key_schema = z.object({
  type: z.string(),
  project_id: z.string(),
  private_key_id: z.string(),
  private_key: z.string(),
  client_email: z.string().email(),
  client_id: z.string(),
  auth_uri: z.string().url(),
  token_uri: z.string().url(),
  auth_provider_x509_cert_url: z.string().url(),
  client_x509_cert_url: z.string().url(),
  universe_domain: z.string(),
});

const key = key_schema.parse(
  JSON.parse(Buffer.from(ProcessEnv.GOOGLE_API_KEY_BASE64, "base64").toString())
);

const storage = new Storage({
  projectId: "aplikacjakonie",
  credentials: key,
});

const bucketName = "aplikacjakonie-zdjecia-koni";

// const MAX_FILE_SIZE = 1024 * 1024 * 5; // 5 MB
// const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

// https://github.com/googleapis/nodejs-storage/blob/main/samples/generateV4UploadSignedUrl.js
export async function generateV4UploadSignedUrl(filename: string) {
  // These options will allow temporary uploading of the file with outgoing
  const options: GetSignedUrlConfig = {
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  };

  // Get a v4 signed URL for uploading file
  const [url] = await storage
    .bucket(bucketName)
    .file(filename)
    .getSignedUrl(options);

  return url;
}

// https://github.com/googleapis/nodejs-storage/blob/main/samples/generateV4ReadSignedUrl.js
export async function generateV4ReadSignedUrl(filename: string) {
  // These options will allow temporary read access to the file
  const options: GetSignedUrlConfig = {
    version: "v4",
    action: "read",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  };

  // Get a v4 signed URL for reading the file
  const [url] = await storage
    .bucket(bucketName)
    .file(filename)
    .getSignedUrl(options);

  return url;
}

const success_response_schema = z.object({ url: z.string().url() });

const images = new Hono<{ Variables: { jwtPayload: UserPayload } }>()
  .use(authMiddleware)
  .get(
    "/upload/:filename",
    describeRoute({
      description:
        "Pobierz link do przesłania zdjęcia o wzkazanym id (filename)",
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
        // Creates a client
        const filename = c.req.param("filename");
        const signed_url = await generateV4UploadSignedUrl(filename);

        return c.json(
          {
            url: signed_url,
          },
          200
        );
      } catch {
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
        // Creates a client
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
