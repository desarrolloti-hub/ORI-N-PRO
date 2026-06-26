/* ========================================
   LOGIN CONTROLLER - Orién Pro
   ======================================== */

import { auth } from "/config/firebaseConfig.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import {
  showLoading,
  hideLoading,
  showNotification,
} from "/src/modules/utils/uiHelpers.js";
import { initAuth } from "/src/modules/utils/auth.js";

export function initLoginController() {
  // Si ya hay sesión, redirigir al dashboard
  const user = JSON.parse(localStorage.getItem("orien_user") || "null");
  if (user) {
    window.location.href = "/adminDashboard";
    return;
  }

  bindFormSubmit();
}

function bindFormSubmit() {
  const form = document.getElementById("loginForm");
  if (!form) return;
  form.removeEventListener("submit", handleSubmit);
  form.addEventListener("submit", handleSubmit);
}

async function handleSubmit(e) {
  e.preventDefault();
  // Obtener el formulario desde el evento
  const form = e.currentTarget;
  const email = form.querySelector('input[type="email"]').value;
  const password = form.querySelector('input[type="password"]').value;

  if (!email || !password) {
    showNotification("Completa todos los campos", "error");
    return;
  }

  try {
    showLoading();
    await signInWithEmailAndPassword(auth, email, password);
    // Esperar a que initAuth guarde en localStorage
    await new Promise((resolve) => setTimeout(resolve, 500));
    await initAuth(); // refrescar usuario actual
    showNotification("Inicio de sesión exitoso", "success");
    setTimeout(() => (window.location.href = "/adminDashboard"), 1000);
  } catch (error) {
    let message = "Error al iniciar sesión";
    if (error.code === "auth/user-not-found") message = "Usuario no encontrado";
    else if (error.code === "auth/wrong-password")
      message = "Contraseña incorrecta";
    else if (error.code === "auth/invalid-email") message = "Correo inválido";
    showNotification(message, "error");
    hideLoading();
  }
}
