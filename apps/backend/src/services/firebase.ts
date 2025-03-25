import z from "zod";
import { ProcessEnv } from "../env";
import { key_schema } from "./gcp";
import * as admin from 'firebase-admin';

const firebase_notifications_public_config_schema = z.object({
  "apiKey": z.string().nonempty(), // The "api" key is public as per the docs, but google flags all api key string occurences in public repos... see https://firebase.google.com/docs/projects/api-keys
  "authDomain": z.string().url().nonempty(),
  "projectId": z.string().nonempty(),
  "storageBucket": z.string().url().nonempty(),
  "messagingSenderId": z.string(z.number()),
  "appId": z.string(),
})

export const firebaseNotificationsPublicConfig = firebase_notifications_public_config_schema.parse(JSON.parse(Buffer.from(ProcessEnv.FIREBASE_PUBLIC_NOTIFICATIONS_CONFIG_BASE64, 'base64').toString()));

// --- 

const firebase_admin_config_schema = key_schema;

export const firebaseAdminConfig = firebase_admin_config_schema.parse(JSON.parse(Buffer.from(ProcessEnv.FIREBASE_ADMIN_CONFIG_BASE64, 'base64').toString()));

export const firebase_app = admin.initializeApp({
    credential: admin.credential.cert({
        projectId: firebaseAdminConfig.project_id,
        clientEmail: firebaseAdminConfig.client_email,
        privateKey: firebaseAdminConfig.private_key
    })
});

