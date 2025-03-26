// import { precacheAndRoute } from 'workbox-precaching'
// console.log("import ok")

// precacheAndRoute(__WB_MANIFEST)
// console.log("wb manifest ok")

// Import and configure the Firebase SDK
// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js');
// console.log("import scripts ok")

// // Initialize the Firebase app in the service worker by passing in
// // your app's Firebase config object.
// // https://firebase.google.com/docs/web/setup#config-object
const _resp = await fetch('/api/notifications/config');
const firebaseConfig = await _resp.json();
console.log("firebase config fetch ok")

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// // If you would like to customize notifications that are received in the
// // background (Web app is closed or not in browser focus) then you should
// // implement this optional method.
// // Keep in mind that FCM will still show notification messages automatically 
// // and you should use data messages for custom notifications.
// // For more info see: 
// // https://firebase.google.com/docs/cloud-messaging/concept-options
messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});