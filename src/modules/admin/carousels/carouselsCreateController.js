/* ========================================
   CAROUSELS CREATE CONTROLLER - Orién Pro
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

export function initCarouselsCreateController() {
  carouselService = new CarouselService();
  bindFormSubmit();
  bindAddSlide();
  bindImageUploadHandlers();
  bindSlideEvents();
  console.log("✅ Carousels Create Controller inicializado");
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
  const nombre = formData.get("nombre");
  const descripcion = formData.get("descripcion") || "";

  if (slides.length === 0) {
    showNotification("Debe agregar al menos un slide", "error");
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
            <span>Subir imagen</span>
            <input type="file" accept="image/*" style="display: none;">
          </div>
        </div>
        <div class="orien-slide-fields-col">
          <div class="orien-form-group">
            <label>Título</label>
            <input type="text" class="orien-input slide-title" placeholder="Título del slide">
          </div>
          <div class="orien-form-group">
            <label>Subtítulo</label>
            <input type="text" class="orien-input slide-subtitle" placeholder="Subtítulo">
          </div>
          <div class="orien-form-row">
            <div class="orien-form-group">
              <label>Texto CTA</label>
              <input type="text" class="orien-input slide-cta-text" placeholder="Ej: Ver más">
            </div>
            <div class="orien-form-group">
              <label>URL CTA</label>
              <input type="text" class="orien-input slide-cta-url" placeholder="/products">
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
}

function handleImageUpload(file, slideId) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const preview = document.getElementById(`preview-${slideId}`);
    if (preview) {
      preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
    }
    const index = slides.findIndex((s) => s.tempId === slideId);
    if (index !== -1) {
      slides[index].imagen = event.target.result;
    } else {
      slides.push({
        tempId: slideId,
        imagen: event.target.result,
        titulo: "",
        subtitulo: "",
        ctaTexto: "",
        ctaUrl: "",
        orden: slides.length + 1,
      });
    }
    updateSlideDataFromDom(slideId);
  };
  reader.readAsDataURL(file);
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

function bindImageUploadHandlers() {
  document.addEventListener("input", (e) => {
    const target = e.target;
    if (
      target.classList.contains("slide-title") ||
      target.classList.contains("slide-subtitle") ||
      target.classList.contains("slide-cta-text") ||
      target.classList.contains("slide-cta-url")
    ) {
      const card = target.closest(".orien-slide-card");
      if (card) updateSlideDataFromDom(card.dataset.slideId);
    }
  });
}
