/* ========================================
   SERVICES LIST CONTROLLER - Orién Pro
   ======================================== */

import { ServiceService } from "/src/services/serviceService.js";
import {
  showLoading,
  hideLoading,
  showNotification,
} from "/src/modules/utils/uiHelpers.js";

let serviceService = null;
let currentServices = [];

export function initServicesListController() {
  serviceService = new ServiceService();
  loadServices();
  bindEvents();
  console.log("✅ Services List Controller inicializado");
}

async function loadServices() {
  try {
    showLoading();
    currentServices = await serviceService.getAllServices(false);
    renderServicesTable(currentServices);
    hideLoading();
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}

function renderServicesTable(services) {
  const tbody = document.querySelector("#servicesTable tbody");
  if (!tbody) return;

  if (services.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">No hay servicios registrados</td</tr>`;
    return;
  }

  tbody.innerHTML = services
    .map(
      (service) => `
    <tr data-id="${service.id}">
      <td data-label="Orden">
        <span class="orien-service-order">${service.orden}</span>
      </td>
      <td data-label="Título">
        <strong>${escapeHtml(service.titulo)}</strong>
        <div class="orien-table-subtitle">${escapeHtml(service.descripcion.substring(0, 80))}${service.descripcion.length > 80 ? "..." : ""}</div>
      </td>
      <td data-label="Video">
        ${service.videoURL ? '<i class="fas fa-video"></i> Video subido' : '<span class="orien-badge orien-badge-secondary">Sin video</span>'}
      </td>
      <td data-label="Disposición">
        <span class="orien-badge">${service.alternar ? "Video izquierda" : "Video derecha"}</span>
      </td>
      <td data-label="Estado">
        ${service.activo ? '<span class="orien-badge orien-badge-primary">Activo</span>' : '<span class="orien-badge orien-badge-secondary">Inactivo</span>'}
      </td>
      <td data-label="Acciones">
        <div class="orien-table-actions">
          <a href="/servicesEdit/${service.id}" class="orien-btn orien-btn-sm orien-btn-outline" title="Editar">
            <i class="fas fa-edit"></i>
          </a>
          <button class="orien-btn orien-btn-sm orien-btn-outline delete-service" data-id="${service.id}" data-video="${service.videoURL}" style="color:#dc3545; border-color:#dc3545;" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("");

  document.querySelectorAll(".delete-service").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = btn.dataset.id;
      const videoURL = btn.dataset.video;
      deleteService(id, videoURL);
    });
  });
}

async function deleteService(id, videoURL) {
  if (
    !confirm("¿Eliminar este servicio? También se eliminará el video asociado.")
  )
    return;
  try {
    showLoading();
    await serviceService.deleteService(id, videoURL);
    showNotification("Servicio eliminado", "success");
    await loadServices();
  } catch (error) {
    showNotification(error.message, "error");
  } finally {
    hideLoading();
  }
}

function bindEvents() {
  const searchInput = document.getElementById("searchServices");
  if (searchInput) {
    searchInput.addEventListener("input", (e) =>
      filterServices(e.target.value),
    );
  }
}

function filterServices(term) {
  if (!term.trim()) {
    renderServicesTable(currentServices);
    return;
  }
  const filtered = currentServices.filter(
    (s) =>
      s.titulo.toLowerCase().includes(term.toLowerCase()) ||
      s.descripcion.toLowerCase().includes(term.toLowerCase()),
  );
  renderServicesTable(filtered);
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
