import { initPage } from "./common.js";
import { logout, showGlobalError } from "../core/auth.js";

initPage(async (user) => {
  const email = document.getElementById("profileEmail");
  const button = document.getElementById("logoutButton");
  if (email) email.textContent = user.email ?? "";

  button.addEventListener("click", async () => {
    try {
      button.disabled = true;
      await logout();
    } catch (error) {
      button.disabled = false;
      showGlobalError(error);
    }
  });
}).catch(console.error);
