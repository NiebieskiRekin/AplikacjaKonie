import z from "zod";
import { Storage,  } from "@google-cloud/storage";
import { ProcessEnv } from "../env";

export const key_schema = z.object({
  "type": z.string(),
  "project_id": z.string(),
  "private_key_id": z.string(),
  "private_key": z.string(),
  "client_email": z.string().email(),
  "client_id": z.string(),
  "auth_uri": z.string().url(),
  "token_uri": z.string().url(),
  "auth_provider_x509_cert_url": z.string().url(),
  "client_x509_cert_url": z.string().url(),
  "universe_domain": z.string()
})

const key = key_schema.parse(JSON.parse(Buffer.from(ProcessEnv.GOOGLE_API_KEY_BASE64, 'base64').toString()));

export const storage = new Storage({
  projectId: "aplikacjakonie",
  credentials: key
});

export const bucketName = "aplikacjakonie-zdjecia-koni";