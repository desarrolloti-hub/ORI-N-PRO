/* ========================================
   SERVICES EDIT CONTROLLER - Orién Pro (con Carrusel)
   ======================================== */

import { ServiceService } from "/src/services/serviceService.js";
import {
  showLoading,
  hideLoading,
  showNotification,
} from "/src/modules/utils/uiHelpers.js";

let serviceService = null;
let currentServiceId = null;
let carouselItemsArray = [];

export function initServicesEditController(id) {
  if (!id) return;
  currentServiceId = id;
  serviceService = new ServiceService();
  loadServiceData();
  bindFormSubmit();
  bindDeleteButton();
  bindYoutubePreview();
  bindContentTypeToggle();
  bindCarouselEvents();
}

async function loadServiceData() {
  try {
    showLoading();
    const service = await serviceService.getServiceById(currentServiceId);
    if (!service) {
      showNotification("Servicio no encontrado", "error");
      setTimeout(() => (window.location.href = "/servicesList"), 1500);
      return;
    }
    populateForm(service);
    hideLoading();
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}

function populateForm(service) {
  document.querySelector('input[name="titulo"]').value = service.titulo;
  document.querySelector('textarea[name="descripcion"]').value =
    service.descripcion;
  document.querySelector('input[name="orden"]').value = service.orden;
  document.querySelector('input[name="youtubeUrl"]').value = service.youtubeUrl;
  document.querySelector(
    `input[name="status"][value="${service.activo ? "active" : "inactive"}"]`,
  ).checked = true;
  document.querySelector(`select[name="alternar"]`).value = service.alternar
    ? "true"
    : "false";

  const contentTypeRadios = document.querySelectorAll(
    'input[name="contentType"]',
  );
  if (service.carouselEnabled) {
    contentTypeRadios.forEach((r) => {
      if (r.value === "carousel") r.checked = true;
    });
    carouselItemsArray = JSON.parse(JSON.stringify(service.carouselItems));
    renderCarouselItems();
    document.getElementById("textContentGroup").style.display = "none";
    document.getElementById("carouselContentGroup").style.display = "block";
  } else {
    contentTypeRadios.forEach((r) => {
      if (r.value === "text") r.checked = true;
    });
    document.getElementById("textContentGroup").style.display = "block";
    document.getElementById("carouselContentGroup").style.display = "none";
  }

  updateYoutubePreview(service.youtubeUrl);
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
  const contentType = formData.get("contentType");
  const carouselEnabled = contentType === "carousel";
  formData.set("carouselEnabled", carouselEnabled ? "true" : "false");

  try {
    showLoading();
    if (carouselEnabled) {
      if (carouselItemsArray.length === 0)
        throw new Error("Debe agregar al menos una imagen");
      await serviceService.updateService(
        currentServiceId,
        formData,
        carouselItemsArray,
      );
    } else {
      await serviceService.updateService(currentServiceId, formData, []);
    }
    showNotification("Servicio actualizado", "success");
    setTimeout(() => (window.location.href = "/servicesList"), 1500);
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}

function bindDeleteButton() {
  const deleteBtn = document.getElementById("deleteBtn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar este servicio?")) return;
      try {
        showLoading();
        await serviceService.deleteService(currentServiceId);
        showNotification("Servicio eliminado", "success");
        setTimeout(() => (window.location.href = "/servicesList"), 1500);
      } catch (error) {
        showNotification(error.message, "error");
        hideLoading();
      }
    });
  }
}

function bindYoutubePreview() {
  const input = document.getElementById("youtubeUrlInput");
  if (!input) return;
  input.addEventListener("input", (e) => updateYoutubePreview(e.target.value));
}

function updateYoutubePreview(url) {
  const previewDiv = document.getElementById("youtubePreview");
  if (!previewDiv) return;
  const embedUrl = serviceService.getEmbedUrl(url);
  if (embedUrl) {
    previewDiv.innerHTML = `<div class="orien-video-wrapper"><iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe></div>`;
  } else {
    previewDiv.innerHTML = "";
  }
}

function bindContentTypeToggle() {
  const radios = document.querySelectorAll('input[name="contentType"]');
  const textGroup = document.getElementById("textContentGroup");
  const carouselGroup = document.getElementById("carouselContentGroup");
  radios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      if (e.target.value === "text") {
        textGroup.style.display = "block";
        carouselGroup.style.display = "none";
      } else {
        textGroup.style.display = "none";
        carouselGroup.style.display = "block";
      }
    });
  });
}

function bindCarouselEvents() {
  const addBtn = document.getElementById("addCarouselImageBtn");
  const fileInput = document.getElementById("tempImageUpload");
  if (!addBtn) return;
  addBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const base64 = await fileToBase64(file);
      carouselItemsArray.push({ imageBase64: base64, caption: "" });
    }
    renderCarouselItems();
    fileInput.value = "";
  });
}

function renderCarouselItems() {
  const container = document.getElementById("carouselItemsContainer");
  if (!container) return;
  container.innerHTML = "";
  carouselItemsArray.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "orien-carousel-item-card";
    card.innerHTML = `
      <img src="${item.imageBase64}" class="carousel-preview-img" style="max-width:100px; max-height:100px; object-fit:cover; border-radius:8px;">
      <input type="text" class="orien-input carousel-caption" placeholder="Texto sobre la imagen" value="${escapeHtml(item.caption)}" data-index="${idx}">
      <button type="button" class="orien-btn orien-btn-sm orien-btn-outline remove-carousel-item" data-index="${idx}" style="color:#dc3545;">Eliminar</button>
    `;
    container.appendChild(card);
  });
  document.querySelectorAll(".carousel-caption").forEach((input) => {
    input.removeEventListener("change", updateCaption);
    input.addEventListener("change", updateCaption);
  });
  document.querySelectorAll(".remove-carousel-item").forEach((btn) => {
    btn.removeEventListener("click", removeItem);
    btn.addEventListener("click", removeItem);
  });
}

function updateCaption(e) {
  const idx = parseInt(e.target.dataset.index);
  if (!isNaN(idx) && carouselItemsArray[idx]) {
    carouselItemsArray[idx].caption = e.target.value;
  }
}

function removeItem(e) {
  const idx = parseInt(e.target.dataset.index);
  if (!isNaN(idx)) {
    carouselItemsArray.splice(idx, 1);
    renderCarouselItems();
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, (m) => {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}
