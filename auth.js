import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  await signInWithEmailAndPassword(auth, email, password);
  window.location.href = "app.html";
};

window.register = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  await createUserWithEmailAndPassword(auth, email, password);
  window.location.href = "app.html";
};