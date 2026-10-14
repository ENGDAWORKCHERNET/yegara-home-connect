import { initializeApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAtQkqEVpi0bBK89cxRuQvnd7dcZyeuzM",
  authDomain: "michael-9bb45.firebaseapp.com",
  projectId: "michael-9bb45",
  storageBucket: "michael-9bb45.firebasestorage.app",
  messagingSenderId: "596854079650",
  appId: "1:596854079650:web:0bcff713b5c0fcced3497fb",
  measurementId: "G-58BFDSHXCZ",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export { RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };
