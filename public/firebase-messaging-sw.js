// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyD7XNvDm6HMZAbkcx3tI4oeWoX1GAE33aU",
    authDomain: "nada-pirthday.firebaseapp.com",
    projectId: "nada-pirthday",
    storageBucket: "nada-pirthday.firebasestorage.app",
    messagingSenderId: "247523373748",
    appId: "1:247523373748:web:2597e85896b4fa05ce5de1"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/images/icon/icon.ico', // Adjust path if needed
        badge: '/images/icon/icon.ico'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
