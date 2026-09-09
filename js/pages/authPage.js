import "./registerServiceWorker.js";
import { auth } from "../core/firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFriendlyError } from "../core/auth.js";

const form = document.getElementById("authForm");
const loginButton = document.getElementById("loginButton");
const registerButton = document.getElementById("registerButton");
const error = document.getElementById("authError");

async function authenticate(action) {
  error.hidden = true;
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    error.textContent = "Email and password are required.";
    error.hidden = false;
    return;
  }

  loginButton.disabled = true;
  registerButton.disabled = true;

  try {
    await action(email, password);
    window.location.href = "index.html";
  } catch (err) {
    error.textContent = getFriendlyError(err);
    error.hidden = false;
  } finally {
    loginButton.disabled = false;
    registerButton.disabled = false;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  authenticate((email, password) => signInWithEmailAndPassword(auth, email, password));
});

registerButton.addEventListener("click", () => {
  authenticate((email, password) => createUserWithEmailAndPassword(auth, email, password));
});
