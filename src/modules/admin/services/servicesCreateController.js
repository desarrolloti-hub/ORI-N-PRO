/* ========================================
   SERVICES CREATE CONTROLLER - Orién Pro
   ======================================== */

import { ServiceService } from "/src/services/serviceService.js";
import {
  showLoading,
  hideLoading,
  showNotification,
} from "/src/modules/utils/uiHelpers.js";

let serviceService = null;
let selectedVideoFile = null;

export function initServicesCreateController() {
  serviceService = new ServiceService();
  bindFormSubmit();
  bindVideoUpload();
  console.log("✅ Services Create Controller inicializado");
}

function bindFormSubmit() {
  const form = document.getElementById("serviceForm");
  if (!form) return;
  form.removeEventListener("submit", handleSubmit);
  form.addEventListener("submit", handleSubmit);
}

async function handleSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);

  const serviceData = {
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    orden: formData.get("orden"),
    activo: formData.get("status"),
    alternar: formData.get("alternar"),
  };

  if (!selectedVideoFile) {
    showNotification("Debe seleccionar un video", "error");
    return;
  }

  try {
    showLoading();
    await serviceService.createService(serviceData, selectedVideoFile);
    showNotification("Servicio creado exitosamente", "success");
    setTimeout(() => (window.location.href = "/servicesList"), 1500);
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}

function bindVideoUpload() {
  const uploadArea = document.getElementById("videoUpload");
  const fileInput = uploadArea.querySelector('input[type="file"]');
  const preview = document.getElementById("videoPreview");
  const fileNameSpan = document.getElementById("videoFileName");

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
    if (file && file.type.startsWith("video/")) handleVideoFile(file);
  });
  fileInput.addEventListener("change", (e) => {
    if (e.target.files[0]) handleVideoFile(e.target.files[0]);
  });

  function handleVideoFile(file) {
    selectedVideoFile = file;
    const url = URL.createObjectURL(file);
    preview.innerHTML = `<video controls src="${url}" style="max-width:100%; max-height:200px; border-radius:8px;"></video>`;
    if (fileNameSpan) fileNameSpan.textContent = file.name;
  }
}
