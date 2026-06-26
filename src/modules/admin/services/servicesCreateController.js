/* ========================================
   SERVICES CREATE CONTROLLER - Orién Pro (con Carrusel)
   Con límite de caracteres y validación de YouTube
   ======================================== */

import { ServiceService } from "/src/services/serviceService.js";
import {
  showLoading,
  hideLoading,
  showNotification,
} from "/src/modules/utils/uiHelpers.js";

let serviceService = null;
let carouselItemsArray = [];

const LIMITS = {
  titulo: 80,
  descripcion: 500,
  youtubeUrl: 200,
  caption: 100,
};

export function initServicesCreateController() {
  serviceService = new ServiceService();
  bindFormSubmit();
  bindYoutubePreview();
  bindContentTypeToggle();
  bindCarouselEvents();
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

  const titulo = formData.get("titulo")?.trim() || "";
  const descripcion = formData.get("descripcion")?.trim() || "";
  const youtubeUrl = formData.get("youtubeUrl")?.trim() || "";

  // Validaciones de longitud
  if (titulo.length === 0) {
    showNotification("El título es obligatorio", "error");
    return;
  }
  if (titulo.length > LIMITS.titulo) {
    showNotification(
      `El título no puede exceder ${LIMITS.titulo} caracteres`,
      "error",
    );
    return;
  }
  if (youtubeUrl.length === 0) {
    showNotification("La URL de YouTube es obligatoria", "error");
    return;
  }
  if (youtubeUrl.length > LIMITS.youtubeUrl) {
    showNotification(
      `La URL de YouTube no puede exceder ${LIMITS.youtubeUrl} caracteres`,
      "error",
    );
    return;
  }

  // Validación de YouTube
  const embedUrl = serviceService.getEmbedUrl(youtubeUrl);
  if (!embedUrl) {
    showNotification("La URL de YouTube no es válida", "error");
    return;
  }

  // Validación de contenido
  if (!carouselEnabled) {
    if (descripcion.length === 0) {
      showNotification("La descripción es obligatoria", "error");
      return;
    }
    if (descripcion.length < 10) {
      showNotification(
        "La descripción debe tener al menos 10 caracteres",
        "error",
      );
      return;
    }
    if (descripcion.length > LIMITS.descripcion) {
      showNotification(
        `La descripción no puede exceder ${LIMITS.descripcion} caracteres`,
        "error",
      );
      return;
    }
  } else {
    if (carouselItemsArray.length === 0) {
      showNotification("Debe agregar al menos una imagen al carrusel", "error");
      return;
    }
    // Validar captions
    for (let i = 0; i < carouselItemsArray.length; i++) {
      if (carouselItemsArray[i].caption?.length > LIMITS.caption) {
        showNotification(
          `Caption de la imagen ${i + 1} excede ${LIMITS.caption} caracteres`,
          "error",
        );
        return;
      }
    }
  }

  formData.set("carouselEnabled", carouselEnabled ? "true" : "false");

  try {
    showLoading();
    if (carouselEnabled) {
      await serviceService.createService(formData, carouselItemsArray);
    } else {
      await serviceService.createService(formData, []);
    }
    showNotification("Servicio creado exitosamente", "success");
    setTimeout(() => (window.location.href = "/servicesList"), 1500);
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}

function bindYoutubePreview() {
  const input = document.getElementById("youtubeUrlInput");
  const previewDiv = document.getElementById("youtubePreview");
  if (!input || !previewDiv) return;

  const updatePreview = () => {
    const url = input.value.trim();
    const embedUrl = serviceService.getEmbedUrl(url);
    if (embedUrl) {
      previewDiv.innerHTML = `<div class="orien-video-wrapper"><iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe></div>`;
    } else {
      previewDiv.innerHTML = "";
    }
  };
  input.addEventListener("input", updatePreview);
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
  const container = document.getElementById("carouselItemsContainer");

  addBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files);
    const remaining = 10 - carouselItemsArray.length;
    if (files.length > remaining) {
      showNotification(
        `Solo puedes agregar ${remaining} imágenes más. Máximo 10.`,
        "warning",
      );
    }
    const toProcess = files.slice(0, remaining);
    for (const file of toProcess) {
      if (!file.type.startsWith("image/")) continue;
      const base64 = await fileToBase64(file);
      carouselItemsArray.push({ imageBase64: base64, caption: "" });
      renderCarouselItems();
    }
    fileInput.value = "";
  });

  function renderCarouselItems() {
    container.innerHTML = "";
    carouselItemsArray.forEach((item, idx) => {
      const card = document.createElement("div");
      card.className = "orien-carousel-item-card";
      card.innerHTML = `
        <img src="${item.imageBase64}" class="carousel-preview-img" style="max-width:100px; max-height:100px; object-fit:cover; border-radius:8px;">
        <input type="text" class="orien-input carousel-caption" placeholder="Texto sobre la imagen (máx ${LIMITS.caption} caracteres)" value="${escapeHtml(item.caption)}" data-index="${idx}" maxlength="${LIMITS.caption}">
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
