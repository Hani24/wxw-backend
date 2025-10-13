importScripts('https://www.gstatic.com/firebasejs/8.2.3/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.2.3/firebase-messaging.js');
// importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js');
// importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging.js');
// import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
// import { deleteToken, getMessaging, getToken, isSupported, onMessage } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging.js';
const VAPID_KEY ='BJGjsn6-mnDpmd2ZYobkb9Il-w4UF1JmWZixPWBj4hkl_KzUW8WywC9aExFPXXKow_qAubAYQGEw7R-D6Vh8xew';

const app = firebase.initializeApp({
  apiKey: "AIzaSyBmftJf1PgDW5rPasJRpcZIq0Cff_UAOQk",
  authDomain: "morris-armstrong.firebaseapp.com",
  projectId: "morris-armstrong",
  databaseURL: 'https://morris-armstrong.firebaseio.com',
  storageBucket: "morris-armstrong.appspot.com",
  messagingSenderId: "126255475624",
  appId: "1:126255475624:web:649ad2c9918f524f230b9d",
  measurementId: 'G-measurement-id',
});


const messaging = firebase.messaging();
// console.log( Object.keys(messaging) );

// (async()=>{
//   try{
//     const tokenRes = await messaging.getToken({vapidKey: VAPID_KEY});
//     console.log({sw: {tokenRes}});
//   }catch(e){
//     console.error(` #ws: getToken: ${e.message}`);
//   }
// })();

messaging.onBackgroundMessage((payload) => {
  try{
    console.log(` #ws: onBackgroundMessage: `);
    console.log(payload);
    const params = {
      body: payload.notification.body || payload.data.body || 'no-body',
      message: payload.notification.message || payload.data.message || 'no-message',
      subtitle: payload.notification.subtitle || payload.data.subtitle || 'no-subtitle',
      icon: payload.notification.icon || payload.data.icon || '/firebase-logo.png',
      link: payload.notification.link || payload.data.link || '',
      href: payload.notification.link || payload.data.link || '',
    };
    // console.log(` onBackgroundMessage:params: >>>`);
    // console.log(params);
    self.registration.showNotification(payload.notification.title, params);    
  }catch(e){
    console.error(` #ws: onBackgroundMessage: ${e.message}`);
  }
});

// messaging.onMessage((payload) => {
//   console.log(' #ws: onMessage:');
//   console.log({payload});
// });

console.log('#sw: end');
