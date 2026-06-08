/* ========================================
   SERVICES EDIT CONTROLLER - Orién Pro
   ======================================== */

import { ServiceService } from "/src/services/serviceService.js";
import {
  showLoading,
  hideLoading,
  showNotification
} from "/src/modules/utils/uiHelpers.js";

let serviceService = null;
let currentServiceId = null;
let currentVideoURL = null;
let newVideoFile = null;

export function initServicesEditController(id) {
  if (!id) return;
  currentServiceId = id;
  serviceService = new ServiceService();
  loadServiceData();
  bindFormSubmit();
  bindVideoUpload();
  bindDeleteButton();
  console.log("✅ Services Edit Controller inicializado para id:", id);
}

async function loadServiceData() {
  try {
    showLoading();
    const service = await serviceService.getServiceById(currentServiceId);
    if (!service) {
      showNotification("Servicio no encontrado", "error");
      setTimeout(() => window.location.href = "/servicesList", 1500);
      return;
    }
    currentVideoURL = service.videoURL;
    populateForm(service);
    hideLoading();
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}

function populateForm(service) {
  document.querySelector('input[name="titulo"]').value = service.titulo;
  document.querySelector('textarea[name="descripcion"]').value = service.descripcion;
  document.querySelector('input[name="orden"]').value = service.orden;
  document.querySelector(`input[name="status"][value="${service.activo ? "active" : "inactive"}"]`).checked = true;
  document.querySelector(`input[name="alternar"][value="${service.alternar ? "true" : "false"}"]`).checked = true;
  
  const videoPreview = document.getElementById("videoPreview");
  if (service.videoURL) {
    videoPreview.innerHTML = `<video controls src="${service.videoURL}" style="max-width:100%; max-height:200px; border-radius:8px;"></video>`;
  }
  const idSpan = document.getElementById("serviceId");
  if (idSpan) idSpan.textContent = `ID: ${service.id.substring(0, 8)}...`;
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
    alternar: formData.get("alternar")
  };
  
  try {
    showLoading();
    await serviceService.updateService(currentServiceId, serviceData, newVideoFile, currentVideoURL);
    showNotification("Servicio actualizado", "success");
    setTimeout(() => window.location.href = "/servicesList", 1500);
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
  fileInput.addEventListener("change", (e) => {
    if (e.target.files[0]) {
      newVideoFile = e.target.files[0];
      const url = URL.createObjectURL(newVideoFile);
      preview.innerHTML = `<video controls src="${url}" style="max-width:100%; max-height:200px; border-radius:8px;"></video>`;
      if (fileNameSpan) fileNameSpan.textContent = newVideoFile.name;
    }
  });
}

function bindDeleteButton() {
  const deleteBtn = document.getElementById("deleteBtn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar este servicio? También se eliminará el video asociado.")) return;
      try {
        showLoading();
        await serviceService.deleteService(currentServiceId, currentVideoURL);
        showNotification("Servicio eliminado", "success");
        setTimeout(() => window.location.href = "/servicesList", 1500);
      } catch (error) {
        showNotification(error.message, "error");
        hideLoading();
      }
    });
  }
}