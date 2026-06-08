/* ========================================
   USERS CREATE CONTROLLER - Orién Pro
   ======================================== */

import { UserService } from "/src/services/userService";
import {
  showLoading,
  hideLoading,
  showNotification,
} from "/src/modules/utils/uiHelpers.js";

let userService = null;
let initialized = false;
let currentAvatarBase64 = "";

export function initUsersCreateController() {
  if (initialized) return;
  initialized = true;
  userService = new UserService();
  bindFormSubmit();
  bindAvatarUpload();
  console.log("✅ Users Create Controller inicializado");
}

export function destroyUsersCreateController() {
  const form = document.getElementById("userForm");
  if (form) form.removeEventListener("submit", handleSubmit);
  initialized = false;
  userService = null;
}

function bindFormSubmit() {
  const form = document.getElementById("userForm");
  if (!form) return;
  form.removeEventListener("submit", handleSubmit);
  form.addEventListener("submit", handleSubmit);
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  const nombre = formData.get("nombre");
  const apellidos = formData.get("apellidos");
  const nombreCompleto = `${nombre} ${apellidos}`.trim();

  const userData = {
    nombre: nombreCompleto,
    email: formData.get("email"),
    cargo: formData.get("cargo"),
    activo: formData.get("status") === "active",
    fotoURL: currentAvatarBase64,
  };

  const password = formData.get("password");
  const confirmPassword = formData.get("confirm_password");

  if (password !== confirmPassword) {
    showNotification("Las contraseñas no coinciden", "error");
    return;
  }
  if (!userData.nombre) {
    showNotification("El nombre es obligatorio", "error");
    return;
  }
  if (!userData.email || !userData.email.includes("@")) {
    showNotification("El correo electrónico no es válido", "error");
    return;
  }
  if (!password || password.length < 6) {
    showNotification("La contraseña debe tener al menos 6 caracteres", "error");
    return;
  }

  try {
    showLoading();
    await userService.createUser(userData, password);
    showNotification("Usuario creado exitosamente", "success");
    setTimeout(() => (window.location.href = "/usersList"), 1500);
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}

function bindAvatarUpload() {
  const uploadArea = document.getElementById("avatarUpload");
  const fileInput = uploadArea.querySelector("input");
  const preview = document.getElementById("avatarPreview");
  const removeBtn = document.getElementById("removeAvatarBtn");

  uploadArea.addEventListener("click", () => fileInput.click());
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
  });
  uploadArea.addEventListener("dragleave", () =>
    uploadArea.classList.remove("dragover"),
  );
  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (file && file.type.match("image.*")) handleImageFile(file);
  });
  fileInput.addEventListener("change", (e) => {
    if (e.target.files[0]) handleImageFile(e.target.files[0]);
  });
  removeBtn.addEventListener("click", () => {
    currentAvatarBase64 = "";
    preview.innerHTML = '<i class="fas fa-user-circle"></i>';
    document.getElementById("fotoURL").value = "";
  });
}

function handleImageFile(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    currentAvatarBase64 = event.target.result;
    const preview = document.getElementById("avatarPreview");
    preview.innerHTML = `<img src="${currentAvatarBase64}" alt="Avatar">`;
    document.getElementById("fotoURL").value = currentAvatarBase64;
  };
  reader.readAsDataURL(file);
}
