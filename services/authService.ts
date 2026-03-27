
import * as firebaseAuth from "firebase/auth";
import { auth } from "./firebase";

export const signInWithEmail = async (email: string, pass: string) => {
  return firebaseAuth.signInWithEmailAndPassword(auth, email, pass);
};

export const signUpWithEmail = async (email: string, pass: string, name: string) => {
  const credential = await firebaseAuth.createUserWithEmailAndPassword(auth, email, pass);
  await firebaseAuth.updateProfile(credential.user, { displayName: name });
  return credential;
};

export const signOut = async () => {
  return firebaseAuth.signOut(auth);
};

export const subscribeToAuth = (callback: (user: any) => void) => {
  return firebaseAuth.onAuthStateChanged(auth, callback);
};
