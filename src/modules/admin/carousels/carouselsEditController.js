/* ========================================
   CAROUSELS EDIT CONTROLLER - Orién Pro
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

export function initCarouselsEditController(id) {
  if (!id) return;
  currentCarouselId = id;
  carouselService = new CarouselService();
  loadCarouselData();
  bindFormSubmit();
  bindAddSlide();
  bindDeleteButton();
  console.log("✅ Carousels Edit Controller inicializado para id:", id);
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
    slides = [...carousel.slides];
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
  if (nombreInput) nombreInput.value = carousel.nombre;
  if (descInput) descInput.value = carousel.descripcion || "";
  const idSpan = document.getElementById("carouselId");
  if (idSpan) idSpan.textContent = `ID: ${carousel.id.substring(0, 8)}...`;
}

function renderSlides(slidesArray) {
  const container = document.getElementById("slidesContainer");
  if (!container) return;
  container.innerHTML = "";
  slidesArray.forEach((slide, idx) => {
    const slideId = `edit-${Date.now()}-${idx}`;
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
              <span>Cambiar imagen</span>
              <input type="file" accept="image/*" style="display: none;">
            </div>
          </div>
          <div class="orien-slide-fields-col">
            <div class="orien-form-group">
              <label>Título</label>
              <input type="text" class="orien-input slide-title" value="${escapeHtml(slide.titulo)}">
            </div>
            <div class="orien-form-group">
              <label>Subtítulo</label>
              <input type="text" class="orien-input slide-subtitle" value="${escapeHtml(slide.subtitulo)}">
            </div>
            <div class="orien-form-row">
              <div class="orien-form-group">
                <label>Texto CTA</label>
                <input type="text" class="orien-input slide-cta-text" value="${escapeHtml(slide.ctaTexto)}">
              </div>
              <div class="orien-form-group">
                <label>URL CTA</label>
                <input type="text" class="orien-input slide-cta-url" value="${escapeHtml(slide.ctaUrl)}">
              </div>
            </div>
          </div>
        </div>
        <hr>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", slideHtml);
    bindSlideEventsForId(slideId, idx, slide.imagen);
  });
  bindSlideEvents();
}

function bindSlideEventsForId(slideId, originalIndex, existingImage) {
  const card = document.querySelector(
    `.orien-slide-card[data-slide-id="${slideId}"]`,
  );
  if (!card) return;

  const removeBtn = card.querySelector(".remove-slide-btn");
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      card.remove();
      const idx = slides.findIndex((s) => s.tempId === slideId);
      if (idx !== -1) slides.splice(idx, 1);
      updateSlideNumbers();
    });
  }

  const uploadArea = card.querySelector(".slide-upload");
  const fileInput = uploadArea.querySelector("input");
  const previewDiv = card.querySelector(".slide-preview");
  if (uploadArea) {
    uploadArea.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file && file.type.match("image.*")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (previewDiv)
            previewDiv.innerHTML = `<img src="${ev.target.result}" alt="Preview">`;
          const idx = slides.findIndex((s) => s.tempId === slideId);
          if (idx !== -1) slides[idx].imagen = ev.target.result;
          else {
            slides.push({
              tempId: slideId,
              imagen: ev.target.result,
              titulo: "",
              subtitulo: "",
              ctaTexto: "",
              ctaUrl: "",
              orden: slides.length + 1,
            });
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  const inputs = card.querySelectorAll(
    ".slide-title, .slide-subtitle, .slide-cta-text, .slide-cta-url",
  );
  inputs.forEach((input) => {
    input.addEventListener("input", () => updateSlideFromDom(slideId));
  });

  if (!slides.some((s) => s.tempId === slideId)) {
    slides.push({
      tempId: slideId,
      imagen: existingImage || "",
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

function bindSlideEvents() {
  document.getElementById("slidesContainer")?.addEventListener("input", (e) => {
    const target = e.target;
    if (
      target.classList.contains("slide-title") ||
      target.classList.contains("slide-subtitle") ||
      target.classList.contains("slide-cta-text") ||
      target.classList.contains("slide-cta-url")
    ) {
      const card = target.closest(".orien-slide-card");
      if (card) updateSlideFromDom(card.dataset.slideId);
    }
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
            <span>Subir imagen</span>
            <input type="file" accept="image/*" style="display: none;">
          </div>
        </div>
        <div class="orien-slide-fields-col">
          <div class="orien-form-group">
            <label>Título</label>
            <input type="text" class="orien-input slide-title">
          </div>
          <div class="orien-form-group">
            <label>Subtítulo</label>
            <input type="text" class="orien-input slide-subtitle">
          </div>
          <div class="orien-form-row">
            <div class="orien-form-group">
              <label>Texto CTA</label>
              <input type="text" class="orien-input slide-cta-text">
            </div>
            <div class="orien-form-group">
              <label>URL CTA</label>
              <input type="text" class="orien-input slide-cta-url">
            </div>
          </div>
        </div>
      </div>
      <hr>
    </div>
  `;
  container.insertAdjacentHTML("beforeend", slideHtml);
  bindSlideEventsForId(newId, -1, "");
  slides.push({
    tempId: newId,
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
  const nombre = formData.get("nombre");
  const descripcion = formData.get("descripcion") || "";

  if (slides.length === 0) {
    showNotification("Debe tener al menos un slide", "error");
    return;
  }

  const finalSlides = slides.map((s) => ({
    imagen: s.imagen || "",
    titulo: s.titulo || "",
    subtitulo: s.subtitulo || "",
    ctaTexto: s.ctaTexto || "",
    ctaUrl: s.ctaUrl || "",
    orden: s.orden,
  }));

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
