// FrontEnd/src/firebase-config.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; 

// Substitua PELAS SUAS PRÓPRIAS CHAVES DO PROJETO FIREBASE!
const firebaseConfig = {

};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // Objeto para usar em signIn, createUser, etc.