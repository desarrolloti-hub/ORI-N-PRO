/* ========================================
   CAROUSELS LIST CONTROLLER - Orién Pro
   ======================================== */

import { CarouselService } from "/src/services/carouselService.js";
import {
  showLoading,
  hideLoading,
  showNotification,
} from "/src/modules/utils/uiHelpers.js";
import { initPagination } from "/src/modules/utils/pagination.js";

let carouselService = null;
let currentCarousels = [];
let pagination = null;

export function initCarouselsListController() {
  carouselService = new CarouselService();
  loadCarousels();
  bindEvents();
}

async function loadCarousels() {
  try {
    showLoading();
    currentCarousels = await carouselService.getAllCarousels();
    initPaginationForCarousels(currentCarousels);
    hideLoading();
  } catch (error) {
    console.error("Error cargando carruseles:", error);
    showNotification(error.message, "error");
    hideLoading();
  }
}

function initPaginationForCarousels(carousels) {
  const container = document.getElementById("paginationControls");
  if (!container) {
    renderCarouselTable(carousels);
    return;
  }

  pagination = initPagination(container, carousels, 10, (pageItems) => {
    renderCarouselTable(pageItems);
  });
}

function renderCarouselTable(carousels) {
  const tbody = document.querySelector("#carouselsTable tbody");
  if (!tbody) return;

  if (carousels.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px;">
      <i class="fas fa-images"></i><p>No hay carruseles registrados</p>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = carousels
    .map(
      (carousel) => `
    <tr data-id="${carousel.id}">
      <td data-label="Nombre">
        <strong>${escapeHtml(carousel.nombre)}</strong>
        ${carousel.descripcion ? `<div class="orien-table-subtitle">${escapeHtml(carousel.descripcion)}</div>` : ""}
      </td>
      <td data-label="Slides">
        <span class="orien-badge">${carousel.slides.length} slides</span>
      </td>
      <td data-label="Estado">
        ${
          carousel.activo
            ? '<span class="orien-badge orien-badge-primary">Activo</span>'
            : '<span class="orien-badge orien-badge-secondary">Inactivo</span>'
        }
      </td>
      <td data-label="Fecha creación">
        ${formatDate(carousel.fechaCreacion)}
      </td>
      <td data-label="Acciones">
        <div class="orien-table-actions">
          <a href="/carouselsEdit/${carousel.id}" class="orien-btn orien-btn-sm orien-btn-outline" title="Editar">
            <i class="fas fa-edit"></i>
          </a>
          ${
            carousel.activo
              ? `<button class="orien-btn orien-btn-sm orien-btn-outline deactivate-carousel" data-id="${carousel.id}" title="Desactivar" style="color:#dc3545; border-color:#dc3545;">
                  <i class="fas fa-toggle-off"></i>
                </button>`
              : `<button class="orien-btn orien-btn-sm orien-btn-outline set-active-btn" data-id="${carousel.id}" title="Activar" style="color:#28a745; border-color:#28a745;">
                  <i class="fas fa-check-circle"></i>
                </button>`
          }
          <button class="orien-btn orien-btn-sm orien-btn-outline delete-carousel" data-id="${carousel.id}" title="Eliminar" style="color:#dc3545; border-color:#dc3545;">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("");

  // Asignar eventos a los botones
  document.querySelectorAll(".set-active-btn").forEach((btn) => {
    btn.removeEventListener("click", handleSetActive);
    btn.addEventListener("click", handleSetActive);
  });
  document.querySelectorAll(".deactivate-carousel").forEach((btn) => {
    btn.removeEventListener("click", handleDeactivate);
    btn.addEventListener("click", handleDeactivate);
  });
  document.querySelectorAll(".delete-carousel").forEach((btn) => {
    btn.removeEventListener("click", handleDelete);
    btn.addEventListener("click", handleDelete);
  });
}

async function handleSetActive(e) {
  const id = e.currentTarget.dataset.id;
  try {
    showLoading();
    await carouselService.setActiveCarousel(id);
    showNotification("Carrusel activado correctamente", "success");
    // Recargar
    currentCarousels = await carouselService.getAllCarousels();
    if (pagination) {
      pagination.setItems(currentCarousels);
    } else {
      renderCarouselTable(currentCarousels);
    }
    hideLoading();
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}

async function handleDeactivate(e) {
  const id = e.currentTarget.dataset.id;
  try {
    showLoading();
    await carouselService.deactivateCarousel(id);
    showNotification("Carrusel desactivado correctamente", "success");
    // Recargar
    currentCarousels = await carouselService.getAllCarousels();
    if (pagination) {
      pagination.setItems(currentCarousels);
    } else {
      renderCarouselTable(currentCarousels);
    }
    hideLoading();
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}

async function handleDelete(e) {
  const id = e.currentTarget.dataset.id;
  if (!confirm("¿Eliminar este carrusel? Esta acción no se puede deshacer."))
    return;
  try {
    showLoading();
    await carouselService.deleteCarousel(id);
    showNotification("Carrusel eliminado", "success");
    currentCarousels = await carouselService.getAllCarousels();
    if (pagination) {
      pagination.setItems(currentCarousels);
    } else {
      renderCarouselTable(currentCarousels);
    }
    hideLoading();
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}

function bindEvents() {
  const searchInput = document.getElementById("searchCarousels");
  if (searchInput) {
    searchInput.addEventListener("input", (e) =>
      filterCarousels(e.target.value),
    );
  }
}

function filterCarousels(term) {
  if (!term.trim()) {
    if (pagination) {
      pagination.setItems(currentCarousels);
    } else {
      renderCarouselTable(currentCarousels);
    }
    return;
  }
  const filtered = currentCarousels.filter((c) =>
    c.nombre.toLowerCase().includes(term.toLowerCase()),
  );
  if (pagination) {
    pagination.setItems(filtered);
  } else {
    renderCarouselTable(filtered);
  }
}

function formatDate(timestamp) {
  if (!timestamp) return "—";
  let date;
  if (timestamp.toDate) date = timestamp.toDate();
  else if (timestamp instanceof Date) date = timestamp;
  else date = new Date(timestamp);
  if (isNaN(date.getTime())) return "—";
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
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
