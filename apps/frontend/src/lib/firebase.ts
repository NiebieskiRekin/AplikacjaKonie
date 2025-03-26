
import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { z } from "zod"

const firebase_notifications_public_config_schema = z.object({
  "apiKey": z.string().nonempty(), // The "api" key is public as per the docs, but google flags all api key string occurences in public repos... see https://firebase.google.com/docs/projects/api-keys
  "authDomain": z.string().nonempty(),
  "projectId": z.string().nonempty(),
  "storageBucket": z.string().nonempty(),
  "messagingSenderId": z.string(z.number()),
  "appId": z.string(),
})

// See: https://firebase.google.com/docs/web/learn-more#config-object
const _resp = await fetch('/api/notifications/config');
const firebaseConfig = firebase_notifications_public_config_schema.parse(await _resp.json());

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const messaging = async () => {
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};

const fetchToken = async () => {
  try {
    const fcmMessaging = await messaging();
    if (fcmMessaging) {
      const token = await getToken(fcmMessaging);
      return token;
    }
    return null;
  } catch (err) {
    console.error("An error occurred while fetching the token:", err);
    return null;
  }
};

export { fetchToken, app, messaging };