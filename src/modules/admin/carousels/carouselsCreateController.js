/* ========================================
   CAROUSELS CREATE CONTROLLER - Orién Pro
   Con compresión agresiva de imágenes (50KB)
   ======================================== */

import { CarouselService } from "/src/services/carouselService.js";
import {
  showLoading,
  hideLoading,
  showNotification,
} from "/src/modules/utils/uiHelpers.js";

let carouselService = null;
let slides = [];
let nextSlideIndex = 1;

const LIMITS = {
  nombre: 50,
  descripcion: 200,
  titulo: 60,
  subtitulo: 100,
  ctaTexto: 30,
  ctaUrl: 200,
  maxImages: 8,
  maxImageSizeKB: 50, // COMPRESIÓN A 50KB
};

export function initCarouselsCreateController() {
  carouselService = new CarouselService();
  bindFormSubmit();
  bindAddSlide();
  bindImageUploadHandlers();
  bindSlideEvents();
  if (document.getElementById("slidesContainer")?.children.length === 0) {
    addSlide();
  }
}

function bindFormSubmit() {
  const form = document.getElementById("carouselForm");
  if (!form) return;
  form.removeEventListener("submit", handleSubmit);
  form.addEventListener("submit", handleSubmit);
}

async function handleSubmit(e) {
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

  if (slides.length === 0) {
    showNotification("Debe agregar al menos un slide", "error");
    return;
  }

  // Validar cada slide
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    if (!s.imagen) {
      showNotification(`Slide ${i + 1}: debe subir una imagen`, "error");
      return;
    }
    // Verificar tamaño de la imagen
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

  // Verificar tamaño total (con margen de seguridad)
  const totalSize = slides.reduce((sum, s) => sum + (s.imagen?.length || 0), 0);
  if (totalSize > 850 * 1024) {
    showNotification(
      `El tamaño total de las imágenes (${Math.round(totalSize / 1024)} KB) excede el límite de 850 KB. Por favor, reduce la cantidad de imágenes o comprime más.`,
      "error",
    );
    return;
  }

  try {
    showLoading();
    await carouselService.createCarousel({ nombre, descripcion }, slides);
    showNotification("Carrusel creado exitosamente", "success");
    setTimeout(() => (window.location.href = "/carouselsList"), 1500);
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}

function bindAddSlide() {
  const btn = document.getElementById("addSlideBtn");
  if (btn) {
    btn.removeEventListener("click", addSlide);
    btn.addEventListener("click", addSlide);
  }
}

function addSlide() {
  const container = document.getElementById("slidesContainer");
  if (!container) return;

  if (container.children.length >= LIMITS.maxImages) {
    showNotification(
      `Máximo ${LIMITS.maxImages} slides por carrusel`,
      "warning",
    );
    return;
  }

  const slideId = Date.now();
  const slideHtml = `
    <div class="orien-slide-card" data-slide-id="${slideId}">
      <div class="orien-slide-header">
        <h4>Slide ${nextSlideIndex}</h4>
        <button type="button" class="orien-btn orien-btn-sm remove-slide-btn" data-id="${slideId}" style="color:#dc3545;">&times;</button>
      </div>
      <div class="orien-slide-body">
        <div class="orien-slide-image-col">
          <div class="slide-preview" id="preview-${slideId}">
            <div class="orien-image-placeholder">
              <i class="fas fa-image"></i>
              <span>Sin imagen</span>
            </div>
          </div>
          <div class="orien-upload-area slide-upload" data-slide-id="${slideId}">
            <i class="fas fa-cloud-upload-alt"></i>
            <span>Subir imagen (máx ${LIMITS.maxImageSizeKB}KB)</span>
            <input type="file" accept="image/*" style="display: none;">
          </div>
        </div>
        <div class="orien-slide-fields-col">
          <div class="orien-form-group">
            <label>Título (máx ${LIMITS.titulo} caracteres)</label>
            <input type="text" class="orien-input slide-title" maxlength="${LIMITS.titulo}" placeholder="Título del slide">
          </div>
          <div class="orien-form-group">
            <label>Subtítulo (máx ${LIMITS.subtitulo} caracteres)</label>
            <input type="text" class="orien-input slide-subtitle" maxlength="${LIMITS.subtitulo}" placeholder="Subtítulo">
          </div>
          <div class="orien-form-row">
            <div class="orien-form-group">
              <label>Texto CTA (máx ${LIMITS.ctaTexto} caracteres)</label>
              <input type="text" class="orien-input slide-cta-text" maxlength="${LIMITS.ctaTexto}" placeholder="Ej: Ver más">
            </div>
            <div class="orien-form-group">
              <label>URL CTA (máx ${LIMITS.ctaUrl} caracteres)</label>
              <input type="text" class="orien-input slide-cta-url" maxlength="${LIMITS.ctaUrl}" placeholder="/products">
            </div>
          </div>
        </div>
      </div>
      <hr>
    </div>
  `;
  container.insertAdjacentHTML("beforeend", slideHtml);
  bindSlideEventsForId(slideId);
  nextSlideIndex++;
}

function bindSlideEvents() {
  document.querySelectorAll(".remove-slide-btn").forEach((btn) => {
    btn.removeEventListener("click", handleRemoveSlide);
    btn.addEventListener("click", handleRemoveSlide);
  });
}

function bindSlideEventsForId(slideId) {
  const card = document.querySelector(
    `.orien-slide-card[data-slide-id="${slideId}"]`,
  );
  if (!card) return;

  const removeBtn = card.querySelector(".remove-slide-btn");
  if (removeBtn) {
    removeBtn.removeEventListener("click", handleRemoveSlide);
    removeBtn.addEventListener("click", handleRemoveSlide);
  }

  const uploadArea = card.querySelector(".slide-upload");
  const fileInput = uploadArea.querySelector("input");
  if (uploadArea) {
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
      if (file && file.type.match("image.*")) handleImageUpload(file, slideId);
    });
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file && file.type.match("image.*")) handleImageUpload(file, slideId);
    });
  }

  const inputs = card.querySelectorAll(
    ".slide-title, .slide-subtitle, .slide-cta-text, .slide-cta-url",
  );
  inputs.forEach((input) => {
    input.removeEventListener("input", () => updateSlideDataFromDom(slideId));
    input.addEventListener("input", () => updateSlideDataFromDom(slideId));
  });
}

/**
 * Comprime una imagen agresivamente a ~50KB
 */
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

        // Reducir dimensión significativamente
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

        // Comprimir con calidad baja para lograr ~50KB
        let quality = 0.85;
        let result = canvas.toDataURL("image/jpeg", quality);

        // Reducir calidad progresivamente hasta alcanzar 50KB
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

        // Si aún es muy grande, redimensionar más
        if (result.length > LIMITS.maxImageSizeKB * 1024) {
          // Reducir tamaño al 50% y repetir
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

async function handleImageUpload(file, slideId) {
  try {
    const preview = document.getElementById(`preview-${slideId}`);
    if (preview) {
      preview.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f0f0f0;font-size:0.8rem;color:#666;"><i class="fas fa-spinner fa-spin"></i> Comprimiendo...</div>`;
    }

    const compressedImage = await compressImage(file);
    const sizeKB = Math.round(compressedImage.length / 1024);

    if (preview) {
      preview.innerHTML = `<img src="${compressedImage}" alt="Preview">`;
    }

    // Mostrar tamaño de la imagen comprimida
    if (sizeKB > LIMITS.maxImageSizeKB) {
      showNotification(
        `Imagen comprimida a ${sizeKB}KB (recomendado < ${LIMITS.maxImageSizeKB}KB)`,
        "warning",
      );
    }

    const index = slides.findIndex((s) => s.tempId === slideId);
    if (index !== -1) {
      slides[index].imagen = compressedImage;
    } else {
      slides.push({
        tempId: slideId,
        imagen: compressedImage,
        titulo: "",
        subtitulo: "",
        ctaTexto: "",
        ctaUrl: "",
        orden: slides.length + 1,
      });
    }
    updateSlideDataFromDom(slideId);
  } catch (error) {
    console.error("Error comprimiendo imagen:", error);
    showNotification("Error al procesar la imagen", "error");
  }
}

function handleRemoveSlide(e) {
  const btn = e.currentTarget;
  const slideId = btn.dataset.id;
  const card = document.querySelector(
    `.orien-slide-card[data-slide-id="${slideId}"]`,
  );
  if (card) card.remove();
  const index = slides.findIndex((s) => s.tempId == slideId);
  if (index !== -1) slides.splice(index, 1);
  updateSlideNumbers();
}

function updateSlideDataFromDom(slideId) {
  const card = document.querySelector(
    `.orien-slide-card[data-slide-id="${slideId}"]`,
  );
  if (!card) return;
  const titulo = card.querySelector(".slide-title")?.value || "";
  const subtitulo = card.querySelector(".slide-subtitle")?.value || "";
  const ctaTexto = card.querySelector(".slide-cta-text")?.value || "";
  const ctaUrl = card.querySelector(".slide-cta-url")?.value || "";

  const index = slides.findIndex((s) => s.tempId == slideId);
  if (index !== -1) {
    slides[index].titulo = titulo;
    slides[index].subtitulo = subtitulo;
    slides[index].ctaTexto = ctaTexto;
    slides[index].ctaUrl = ctaUrl;
  } else {
    slides.push({
      tempId: slideId,
      imagen: "",
      titulo,
      subtitulo,
      ctaTexto,
      ctaUrl,
      orden: slides.length + 1,
    });
  }
}

function updateSlideNumbers() {
  const cards = document.querySelectorAll(".orien-slide-card");
  cards.forEach((card, idx) => {
    const header = card.querySelector(".orien-slide-header h4");
    if (header) header.innerText = `Slide ${idx + 1}`;
    const slideId = card.dataset.slideId;
    const slide = slides.find((s) => s.tempId == slideId);
    if (slide) slide.orden = idx + 1;
  });
  nextSlideIndex = cards.length + 1;
}

function bindImageUploadHandlers() {}
