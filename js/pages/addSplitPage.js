import { createSplit } from "../services/splitService.js";
import { initPage, runSafely } from "./common.js";

const form = document.getElementById("splitForm");
const input = document.getElementById("newSplit");
const button = document.getElementById("addSplitButton");

initPage(async (user) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    runSafely(async () => {
      button.disabled = true;
      try {
        await createSplit(user, input.value);
        window.location.href = "index.html";
      } finally {
        button.disabled = false;
      }
    });
  });
}).catch(console.error);
