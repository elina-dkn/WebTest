import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export function requireAuth(callback) {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();

      try {
        if (!user) {
          window.location.href = "login.html";
          resolve();
          return;
        }

        await callback(user);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function logout() {
  await signOut(auth);
  window.location.href = "auth.html";
}

export function showGlobalError(error) {
  console.error(error);

  const message = document.getElementById("globalError");
  if (!message) return;

  message.textContent = getFriendlyError(error);
  message.hidden = false;
}

export function getFriendlyError(error) {
  const code = error?.code ?? "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "An account already exists with this email.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "permission-denied":
      return "You do not have permission to perform that action.";
    default:
      return "Something went wrong. Please try again.";
  }
}
