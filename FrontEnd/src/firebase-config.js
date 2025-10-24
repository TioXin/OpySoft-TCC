// FrontEnd/src/firebase-config.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
export const auth = getAuth(app);
export const db = getFirestore(app);