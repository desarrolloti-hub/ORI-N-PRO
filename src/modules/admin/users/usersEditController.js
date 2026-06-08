/* ========================================
   USERS EDIT CONTROLLER - Orién Pro
   ======================================== */

import { UserService } from "/src/services/userService";
import {
  showLoading,
  hideLoading,
  showNotification,
} from "/src/modules/utils/uiHelpers.js";
import { getCurrentUser, isAdmin } from "/src/modules/utils/auth.js";

let userService = null;
let currentUserUid = null;
let initialized = false;
let currentAvatarBase64 = "";
let currentUserData = null;

export function initUsersEditController(uid) {
  if (initialized && currentUserUid === uid) return;

  // Verificar permisos: solo admin o el propio usuario pueden editar
  const loggedUser = getCurrentUser();
  if (!loggedUser) {
    showNotification("Debes iniciar sesión", "error");
    setTimeout(() => (window.location.href = "/login"), 1500);
    return;
  }
  if (!isAdmin() && loggedUser.uid !== uid) {
    showNotification("No tienes permiso para editar este usuario", "error");
    setTimeout(() => (window.location.href = "/usersList"), 1500);
    return;
  }

  initialized = true;
  currentUserUid = uid;
  userService = new UserService();
  loadUserData();
  bindFormSubmit();
  bindAvatarUpload();
  console.log("✅ Users Edit Controller inicializado para uid:", uid);
}

export function destroyUsersEditController() {
  const form = document.getElementById("userForm");
  if (form) form.removeEventListener("submit", handleSubmit);
  initialized = false;
  currentUserUid = null;
  userService = null;
}

async function loadUserData() {
  try {
    showLoading();
    const user = await userService.getUserById(currentUserUid);
    if (!user) {
      showNotification("Usuario no encontrado", "error");
      setTimeout(() => (window.location.href = "/usersList"), 1500);
      return;
    }
    currentUserData = user;
    currentAvatarBase64 = user.fotoURL || "";
    populateForm(user);
    updateAuditInfo(user);
    updateStatusBadge(user);
    hideLoading();
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}

function populateForm(user) {
  const nombreParts = user.nombre.split(" ");
  const nombre = nombreParts[0] || "";
  const apellidos = nombreParts.slice(1).join(" ") || "";

  document.querySelector('input[name="nombre"]').value = nombre;
  document.querySelector('input[name="apellidos"]').value = apellidos;
  document.querySelector('input[name="email"]').value = user.email;
  document.querySelector('select[name="cargo"]').value = user.cargo;
  document.getElementById("userUid").textContent =
    `ID: ${user.uid.substring(0, 8)}...`;

  const statusRadios = document.querySelectorAll('input[name="status"]');
  statusRadios.forEach((radio) => {
    if ((radio.value === "active") === user.activo) radio.checked = true;
  });

  const preview = document.getElementById("avatarPreview");
  if (user.fotoURL) {
    preview.innerHTML = `<img src="${user.fotoURL}" alt="Avatar">`;
  } else {
    preview.innerHTML = '<i class="fas fa-user-circle"></i>';
  }
  document.getElementById("fotoURL").value = user.fotoURL || "";
}

function updateAuditInfo(user) {
  const auditDiv = document.getElementById("auditInfo");
  if (!auditDiv) return;
  const lastAccess = user.fechaActualizacion
    ? new Date(user.fechaActualizacion).toLocaleString()
    : "Nunca";
  const createdAt = user.fechaCreacion
    ? new Date(user.fechaCreacion).toLocaleDateString()
    : "Desconocido";
  auditDiv.innerHTML = `<i class="fas fa-history"></i> Última actualización: ${lastAccess} | <i class="fas fa-calendar-alt"></i> Creado: ${createdAt}`;
}

function updateStatusBadge(user) {
  const badge = document.getElementById("userStatusBadge");
  if (badge) {
    badge.textContent = user.activo ? "Activo" : "Inactivo";
    badge.className = `orien-badge ${user.activo ? "orien-badge-primary" : "orien-badge-secondary"}`;
  }
}

function bindFormSubmit() {
  const form = document.getElementById("userForm");
  if (!form) return;
  form.removeEventListener("submit", handleSubmit);
  form.addEventListener("submit", handleSubmit);
}

async function handleSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const nombre = formData.get("nombre");
  const apellidos = formData.get("apellidos");
  const nombreCompleto = `${nombre} ${apellidos}`.trim();

  const updateData = {
    nombre: nombreCompleto,
    cargo: formData.get("cargo"),
    activo: formData.get("status") === "active",
    fotoURL: currentAvatarBase64,
  };

  const newPassword = formData.get("new_password");
  const confirmPassword = formData.get("confirm_password");

  try {
    showLoading();
    await userService.updateUser(currentUserUid, updateData);
    if (newPassword && newPassword.trim() !== "") {
      if (newPassword !== confirmPassword) {
        showNotification("Las contraseñas nuevas no coinciden", "error");
        hideLoading();
        return;
      }
      if (newPassword.length < 6) {
        showNotification(
          "La contraseña debe tener al menos 6 caracteres",
          "error",
        );
        hideLoading();
        return;
      }
      await userService.changeUserPassword(currentUserUid, newPassword);
    }
    showNotification("Usuario actualizado exitosamente", "success");
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
