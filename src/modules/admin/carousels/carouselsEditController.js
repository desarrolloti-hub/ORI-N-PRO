/* ========================================
   CAROUSELS EDIT CONTROLLER - Orién Pro
   Con límite de caracteres y validaciones mejoradas
   FIX: No duplica slides al editar
   ======================================== */

import { CarouselService } from "/src/services/carouselService.js";
import {
  showLoading,
  hideLoading,
  showNotification,
} from "/src/modules/utils/uiHelpers.js";

let carouselService = null;
let currentCarouselId = null;
let slides = [];
let deletedSlideIds = new Set(); // Para rastrear slides eliminados

const LIMITS = {
  nombre: 50,
  descripcion: 200,
  titulo: 60,
  subtitulo: 100,
  ctaTexto: 30,
  ctaUrl: 200,
  maxImages: 8,
  maxImageSizeKB: 50,
};

export function initCarouselsEditController(id) {
  if (!id) return;
  currentCarouselId = id;
  carouselService = new CarouselService();
  loadCarouselData();
  bindFormSubmit();
  bindAddSlide();
  bindDeleteButton();
}

async function loadCarouselData() {
  try {
    showLoading();
    const carousel = await carouselService.getCarouselById(currentCarouselId);
    if (!carousel) {
      showNotification("Carrusel no encontrado", "error");
      setTimeout(() => (window.location.href = "/carouselsList"), 1500);
      return;
    }
    populateForm(carousel);
    // IMPORTANTE: Usar los slides originales, no crear nuevos
    slides = carousel.slides.map((slide, index) => ({
      ...slide,
      tempId: `orig-${index}`,
      _isNew: false,
    }));
    renderSlides(slides);
    hideLoading();
  } catch (error) {
    console.error(error);
    showNotification(error.message, "error");
    hideLoading();
  }
}

function populateForm(carousel) {
  const nombreInput = document.querySelector('input[name="nombre"]');
  const descInput = document.querySelector('textarea[name="descripcion"]');
  if (nombreInput) {
    nombreInput.value = carousel.nombre;
    nombreInput.maxLength = LIMITS.nombre;
  }
  if (descInput) {
    descInput.value = carousel.descripcion || "";
    descInput.maxLength = LIMITS.descripcion;
  }
  const idSpan = document.getElementById("carouselId");
  if (idSpan) idSpan.textContent = `ID: ${carousel.id.substring(0, 8)}...`;
}

function renderSlides(slidesArray) {
  const container = document.getElementById("slidesContainer");
  if (!container) return;
  container.innerHTML = "";

  slidesArray.forEach((slide, idx) => {
    // Usar el tempId existente o crear uno nuevo
    const slideId = slide.tempId || `edit-${Date.now()}-${idx}`;
    slide.tempId = slideId;

    const slideHtml = `
      <div class="orien-slide-card" data-slide-id="${slideId}" data-original-index="${idx}">
        <div class="orien-slide-header">
          <h4>Slide ${idx + 1}</h4>
          <button type="button" class="orien-btn orien-btn-sm remove-slide-btn" data-id="${slideId}" style="color:#dc3545;">&times;</button>
        </div>
        <div class="orien-slide-body">
          <div class="orien-slide-image-col">
            <div class="slide-preview">
              ${slide.imagen ? `<img src="${slide.imagen}" alt="Preview">` : '<div class="orien-image-placeholder"><i class="fas fa-image"></i><span>Sin imagen</span></div>'}
            </div>
            <div class="orien-upload-area slide-upload" data-slide-id="${slideId}">
              <i class="fas fa-exchange-alt"></i>
              <span>Cambiar imagen (máx ${LIMITS.maxImageSizeKB}KB)</span>
              <input type="file" accept="image/*" style="display: none;">
            </div>
          </div>
          <div class="orien-slide-fields-col">
            <div class="orien-form-group">
              <label>Título (máx ${LIMITS.titulo} caracteres)</label>
              <input type="text" class="orien-input slide-title" maxlength="${LIMITS.titulo}" value="${escapeHtml(slide.titulo || "")}">
            </div>
            <div class="orien-form-group">
              <label>Subtítulo (máx ${LIMITS.subtitulo} caracteres)</label>
              <input type="text" class="orien-input slide-subtitle" maxlength="${LIMITS.subtitulo}" value="${escapeHtml(slide.subtitulo || "")}">
            </div>
            <div class="orien-form-row">
              <div class="orien-form-group">
                <label>Texto CTA (máx ${LIMITS.ctaTexto} caracteres)</label>
                <input type="text" class="orien-input slide-cta-text" maxlength="${LIMITS.ctaTexto}" value="${escapeHtml(slide.ctaTexto || "")}">
              </div>
              <div class="orien-form-group">
                <label>URL CTA (máx ${LIMITS.ctaUrl} caracteres)</label>
                <input type="text" class="orien-input slide-cta-url" maxlength="${LIMITS.ctaUrl}" value="${escapeHtml(slide.ctaUrl || "")}">
              </div>
            </div>
          </div>
        </div>
        <hr>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", slideHtml);
    bindSlideEventsForId(slideId, slide);
  });
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const MAX_DIMENSION = 800;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.85;
        let result = canvas.toDataURL("image/jpeg", quality);

        let attempts = 0;
        while (
          result.length > LIMITS.maxImageSizeKB * 1024 &&
          quality > 0.1 &&
          attempts < 20
        ) {
          quality -= 0.05;
          result = canvas.toDataURL("image/jpeg", quality);
          attempts++;
        }

        if (result.length > LIMITS.maxImageSizeKB * 1024) {
          const canvas2 = document.createElement("canvas");
          canvas2.width = Math.round(width * 0.5);
          canvas2.height = Math.round(height * 0.5);
          const ctx2 = canvas2.getContext("2d");
          ctx2.drawImage(canvas, 0, 0, canvas2.width, canvas2.height);
          result = canvas2.toDataURL("image/jpeg", 0.5);
        }

        resolve(result);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

function bindSlideEventsForId(slideId, existingSlide) {
  const card = document.querySelector(
    `.orien-slide-card[data-slide-id="${slideId}"]`,
  );
  if (!card) return;

  const removeBtn = card.querySelector(".remove-slide-btn");
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      card.remove();
      const idx = slides.findIndex((s) => s.tempId === slideId);
      if (idx !== -1) {
        // Marcar como eliminado si no es nuevo
        if (!slides[idx]._isNew) {
          deletedSlideIds.add(slideId);
        }
        slides.splice(idx, 1);
      }
      updateSlideNumbers();
    });
  }

  const uploadArea = card.querySelector(".slide-upload");
  const fileInput = uploadArea.querySelector("input");
  const previewDiv = card.querySelector(".slide-preview");
  if (uploadArea) {
    uploadArea.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file && file.type.match("image.*")) {
        try {
          if (previewDiv) {
            previewDiv.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f0f0f0;font-size:0.8rem;color:#666;"><i class="fas fa-spinner fa-spin"></i> Comprimiendo...</div>`;
          }

          const compressedImage = await compressImage(file);
          const sizeKB = Math.round(compressedImage.length / 1024);

          if (previewDiv) {
            previewDiv.innerHTML = `<img src="${compressedImage}" alt="Preview">`;
          }

          if (sizeKB > LIMITS.maxImageSizeKB) {
            showNotification(
              `Imagen comprimida a ${sizeKB}KB (recomendado < ${LIMITS.maxImageSizeKB}KB)`,
              "warning",
            );
          }

          const idx = slides.findIndex((s) => s.tempId === slideId);
          if (idx !== -1) {
            slides[idx].imagen = compressedImage;
          }
        } catch (error) {
          console.error("Error comprimiendo imagen:", error);
          showNotification("Error al procesar la imagen", "error");
        }
      }
    });
  }

  const inputs = card.querySelectorAll(
    ".slide-title, .slide-subtitle, .slide-cta-text, .slide-cta-url",
  );
  inputs.forEach((input) => {
    input.addEventListener("input", () => updateSlideFromDom(slideId));
  });

  // Si el slide no existe en el array, agregarlo (solo para slides nuevos)
  if (!slides.some((s) => s.tempId === slideId)) {
    slides.push({
      tempId: slideId,
      _isNew: true,
      imagen: existingSlide?.imagen || "",
      titulo: card.querySelector(".slide-title")?.value || "",
      subtitulo: card.querySelector(".slide-subtitle")?.value || "",
      ctaTexto: card.querySelector(".slide-cta-text")?.value || "",
      ctaUrl: card.querySelector(".slide-cta-url")?.value || "",
      orden: slides.length + 1,
    });
  } else {
    updateSlideFromDom(slideId);
  }
}

function updateSlideFromDom(slideId) {
  const card = document.querySelector(
    `.orien-slide-card[data-slide-id="${slideId}"]`,
  );
  if (!card) return;
  const titulo = card.querySelector(".slide-title")?.value || "";
  const subtitulo = card.querySelector(".slide-subtitle")?.value || "";
  const ctaTexto = card.querySelector(".slide-cta-text")?.value || "";
  const ctaUrl = card.querySelector(".slide-cta-url")?.value || "";
  const index = slides.findIndex((s) => s.tempId === slideId);
  if (index !== -1) {
    slides[index].titulo = titulo;
    slides[index].subtitulo = subtitulo;
    slides[index].ctaTexto = ctaTexto;
    slides[index].ctaUrl = ctaUrl;
  }
}

function updateSlideNumbers() {
  const cards = document.querySelectorAll(".orien-slide-card");
  cards.forEach((card, idx) => {
    const header = card.querySelector(".orien-slide-header h4");
    if (header) header.innerText = `Slide ${idx + 1}`;
    const slideId = card.dataset.slideId;
    const slide = slides.find((s) => s.tempId === slideId);
    if (slide) slide.orden = idx + 1;
  });
}

function bindAddSlide() {
  const btn = document.getElementById("addSlideBtn");
  if (btn) {
    btn.removeEventListener("click", addNewSlide);
    btn.addEventListener("click", addNewSlide);
  }
}

function addNewSlide() {
  const container = document.getElementById("slidesContainer");
  if (!container) return;
  if (container.children.length >= LIMITS.maxImages) {
    showNotification(
      `Máximo ${LIMITS.maxImages} slides por carrusel`,
      "warning",
    );
    return;
  }
  const newId = `new-${Date.now()}`;
  const newIndex = slides.length + 1;
  const slideHtml = `
    <div class="orien-slide-card" data-slide-id="${newId}">
      <div class="orien-slide-header">
        <h4>Slide ${newIndex}</h4>
        <button type="button" class="orien-btn orien-btn-sm remove-slide-btn" data-id="${newId}" style="color:#dc3545;">&times;</button>
      </div>
      <div class="orien-slide-body">
        <div class="orien-slide-image-col">
          <div class="slide-preview" id="preview-${newId}">
            <div class="orien-image-placeholder">
              <i class="fas fa-image"></i>
              <span>Sin imagen</span>
            </div>
          </div>
          <div class="orien-upload-area slide-upload" data-slide-id="${newId}">
            <i class="fas fa-cloud-upload-alt"></i>
            <span>Subir imagen (máx ${LIMITS.maxImageSizeKB}KB)</span>
            <input type="file" accept="image/*" style="display: none;">
          </div>
        </div>
        <div class="orien-slide-fields-col">
          <div class="orien-form-group">
            <label>Título (máx ${LIMITS.titulo} caracteres)</label>
            <input type="text" class="orien-input slide-title" maxlength="${LIMITS.titulo}">
          </div>
          <div class="orien-form-group">
            <label>Subtítulo (máx ${LIMITS.subtitulo} caracteres)</label>
            <input type="text" class="orien-input slide-subtitle" maxlength="${LIMITS.subtitulo}">
          </div>
          <div class="orien-form-row">
            <div class="orien-form-group">
              <label>Texto CTA (máx ${LIMITS.ctaTexto} caracteres)</label>
              <input type="text" class="orien-input slide-cta-text" maxlength="${LIMITS.ctaTexto}">
            </div>
            <div class="orien-form-group">
              <label>URL CTA (máx ${LIMITS.ctaUrl} caracteres)</label>
              <input type="text" class="orien-input slide-cta-url" maxlength="${LIMITS.ctaUrl}">
            </div>
          </div>
        </div>
      </div>
      <hr>
    </div>
  `;
  container.insertAdjacentHTML("beforeend", slideHtml);

  const uploadArea = document.querySelector(
    `.slide-upload[data-slide-id="${newId}"]`,
  );
  const fileInput = uploadArea?.querySelector("input");
  const previewDiv = document.getElementById(`preview-${newId}`);

  if (uploadArea && fileInput) {
    uploadArea.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file && file.type.match("image.*")) {
        try {
          if (previewDiv) {
            previewDiv.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f0f0f0;font-size:0.8rem;color:#666;"><i class="fas fa-spinner fa-spin"></i> Comprimiendo...</div>`;
          }
          const compressedImage = await compressImage(file);
          const sizeKB = Math.round(compressedImage.length / 1024);
          if (previewDiv) {
            previewDiv.innerHTML = `<img src="${compressedImage}" alt="Preview">`;
          }
          if (sizeKB > LIMITS.maxImageSizeKB) {
            showNotification(
              `Imagen comprimida a ${sizeKB}KB (recomendado < ${LIMITS.maxImageSizeKB}KB)`,
              "warning",
            );
          }
          const idx = slides.findIndex((s) => s.tempId === newId);
          if (idx !== -1) slides[idx].imagen = compressedImage;
        } catch (error) {
          console.error("Error comprimiendo imagen:", error);
          showNotification("Error al procesar la imagen", "error");
        }
      }
    });
  }

  const card = document.querySelector(
    `.orien-slide-card[data-slide-id="${newId}"]`,
  );
  const inputs = card?.querySelectorAll(
    ".slide-title, .slide-subtitle, .slide-cta-text, .slide-cta-url",
  );
  inputs?.forEach((input) => {
    input.addEventListener("input", () => updateSlideFromDom(newId));
  });

  const removeBtn = card?.querySelector(".remove-slide-btn");
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      card.remove();
      const idx = slides.findIndex((s) => s.tempId === newId);
      if (idx !== -1) slides.splice(idx, 1);
      updateSlideNumbers();
    });
  }

  slides.push({
    tempId: newId,
    _isNew: true,
    imagen: "",
    titulo: "",
    subtitulo: "",
    ctaTexto: "",
    ctaUrl: "",
    orden: newIndex,
  });
  updateSlideNumbers();
}

function bindFormSubmit() {
  const form = document.getElementById("carouselForm");
  if (!form) return;
  form.removeEventListener("submit", handleUpdate);
  form.addEventListener("submit", handleUpdate);
}

async function handleUpdate(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const nombre = formData.get("nombre")?.trim() || "";
  const descripcion = formData.get("descripcion")?.trim() || "";

  if (nombre.length === 0) {
    showNotification("El nombre del carrusel es obligatorio", "error");
    return;
  }
  if (nombre.length > LIMITS.nombre) {
    showNotification(
      `El nombre no puede exceder ${LIMITS.nombre} caracteres`,
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

  // Filtrar slides eliminados
  const finalSlides = slides
    .filter((s) => !deletedSlideIds.has(s.tempId))
    .map((s, idx) => ({
      imagen: s.imagen || "",
      titulo: s.titulo || "",
      subtitulo: s.subtitulo || "",
      ctaTexto: s.ctaTexto || "",
      ctaUrl: s.ctaUrl || "",
      orden: idx + 1,
    }));

  if (finalSlides.length === 0) {
    showNotification("Debe tener al menos un slide", "error");
    return;
  }

  for (let i = 0; i < finalSlides.length; i++) {
    const s = finalSlides[i];
    if (!s.imagen) {
      showNotification(`Slide ${i + 1}: debe tener una imagen`, "error");
      return;
    }
    const sizeKB = Math.round(s.imagen.length / 1024);
    if (sizeKB > LIMITS.maxImageSizeKB * 2) {
      showNotification(
        `Slide ${i + 1}: la imagen es demasiado grande (${sizeKB}KB). Máximo ${LIMITS.maxImageSizeKB}KB.`,
        "error",
      );
      return;
    }
    if (s.titulo?.length > LIMITS.titulo) {
      showNotification(
        `Slide ${i + 1}: el título excede ${LIMITS.titulo} caracteres`,
        "error",
      );
      return;
    }
    if (s.subtitulo?.length > LIMITS.subtitulo) {
      showNotification(
        `Slide ${i + 1}: el subtítulo excede ${LIMITS.subtitulo} caracteres`,
        "error",
      );
      return;
    }
    if (s.ctaTexto?.length > LIMITS.ctaTexto) {
      showNotification(
        `Slide ${i + 1}: el texto CTA excede ${LIMITS.ctaTexto} caracteres`,
        "error",
      );
      return;
    }
    if (s.ctaUrl?.length > LIMITS.ctaUrl) {
      showNotification(
        `Slide ${i + 1}: la URL CTA excede ${LIMITS.ctaUrl} caracteres`,
        "error",
      );
      return;
    }
  }

  const totalSize = finalSlides.reduce(
    (sum, s) => sum + (s.imagen?.length || 0),
    0,
  );
  if (totalSize > 850 * 1024) {
    showNotification(
      `El tamaño total de las imágenes (${Math.round(totalSize / 1024)} KB) excede el límite de 850 KB.`,
      "error",
    );
    return;
  }

  try {
    showLoading();
    await carouselService.updateCarousel(
      currentCarouselId,
      { nombre, descripcion },
      finalSlides,
    );
    showNotification("Carrusel actualizado", "success");
    setTimeout(() => (window.location.href = "/carouselsList"), 1500);
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}

function bindDeleteButton() {
  const deleteBtn = document.getElementById("deleteBtn");
  if (deleteBtn) {
    deleteBtn.removeEventListener("click", handleDelete);
    deleteBtn.addEventListener("click", handleDelete);
  }
}

async function handleDelete() {
  if (!confirm("¿Eliminar este carrusel permanentemente?")) return;
  try {
    showLoading();
    await carouselService.deleteCarousel(currentCarouselId);
    showNotification("Carrusel eliminado", "success");
    setTimeout(() => (window.location.href = "/carouselsList"), 1500);
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
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
