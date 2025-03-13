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
// import { z } from "zod";
// import { randomUUID } from "node:crypto";
// import { imageSize } from "image-size";
import { GetSignedUrlConfig, Storage } from "@google-cloud/storage";

const images = new Hono<{ Variables: UserPayload }>();

const storage = new Storage({
  projectId: "aplikacjakonie",
  keyFilename: "/home/niebieskirekin/Dokumenty/AplikacjaKonie/Kod/key.json",
});
images.use(authMiddleware);

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

images.get("/upload/:filename", async (c) => {
  // Creates a client
  const filename = c.req.param("filename");
  const signed_url = await generateV4UploadSignedUrl(filename);

  return c.json({
    url: signed_url,
  });
});

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

images.get("/read/:filename", async (c) => {
  // Creates a client
  const filename = c.req.param("filename");
  const signed_url = await generateV4ReadSignedUrl(filename);

  return c.json({
    url: signed_url,
  });
});

export default images;
