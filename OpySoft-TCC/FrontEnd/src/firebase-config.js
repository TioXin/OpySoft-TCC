// FrontEnd/src/firebase-config.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; 

// Substitua PELAS SUAS PRÓPRIAS CHAVES DO PROJETO FIREBASE!
const firebaseConfig = {
  apiKey: "AIzaSyD1ZxgQwzLBcHsYSTN93psg11PslckYsnQ",
  authDomain: "opysoft.firebaseapp.com",
  projectId: "opysoft",
  storageBucket: "opysoft.firebasestorage.app",
  messagingSenderId: "173188857687",
  appId: "1:173188857687:web:c579ea319ffa81cdf3c812",
  measurementId: "G-9DMVCE4X5J"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // Objeto para usar em signIn, createUser, etc.