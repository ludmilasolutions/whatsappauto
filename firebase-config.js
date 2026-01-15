// Configuración de Firebase
// REEMPLAZA ESTOS VALORES CON TUS PROPIAS CREDENCIALES DE FIREBASE

const firebaseConfig = {
  apiKey: "AIzaSyCtOiUy2tUQeixUiJxTdI_ESULY4WpqXzw",
  authDomain: "whatsappau-30dc1.firebaseapp.com",
  projectId: "whatsappau-30dc1",
  storageBucket: "whatsappau-30dc1.firebasestorage.app",
  messagingSenderId: "456068013185",
  appId: "1:456068013185:web:5bdd49337fb622e56f0180"
};
// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar servicios
const auth = firebase.auth();
const db = firebase.firestore();

// Configuración para mensajes de WhatsApp
const whatsappConfig = {
    maxMessagesPerDay: 100,
    defaultCountryCode: "54",
    enableAnalytics: true
};
