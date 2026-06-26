/* ========================================
   SERVICES LIST CONTROLLER - Orién Pro
   ======================================== */

import { ServiceService } from "/src/services/serviceService.js";
import {
  showLoading,
  hideLoading,
  showNotification,
} from "/src/modules/utils/uiHelpers.js";
import { initPagination } from "/src/modules/utils/pagination.js";

let serviceService = null;
let currentServices = [];
let pagination = null;

export function initServicesListController() {
  serviceService = new ServiceService();
  loadServices();
  bindEvents();
}

async function loadServices() {
  try {
    showLoading();
    currentServices = await serviceService.getAllServices(false);
    initPaginationForServices(currentServices);
    hideLoading();
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}

function initPaginationForServices(services) {
  const container = document.getElementById("paginationControls");
  if (!container) {
    renderServicesTable(services);
    return;
  }

  pagination = initPagination(container, services, 10, (pageItems) => {
    renderServicesTable(pageItems);
  });
}

function renderServicesTable(services) {
  const tbody = document.querySelector("#servicesTable tbody");
  if (!tbody) return;
  if (services.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">No hay servicios registrados</td></tr>`;
    return;
  }
  tbody.innerHTML = services
    .map(
      (service) => `
    <tr data-id="${service.id}">
      <td data-label="Orden"><span class="orien-service-order">${service.orden}</span></td>
      <td data-label="Título">
        <strong>${escapeHtml(service.titulo)}</strong>
        <div class="orien-table-subtitle">${service.carouselEnabled ? "📸 Carrusel de imágenes" : escapeHtml(service.descripcion.substring(0, 80))}${!service.carouselEnabled && service.descripcion.length > 80 ? "..." : ""}</div>
      </td>
      <td data-label="YouTube">${service.youtubeUrl ? '<i class="fab fa-youtube" style="color:#ff0000"></i> <a href="' + service.youtubeUrl + '" target="_blank">Ver video</a>' : '<span class="orien-badge orien-badge-secondary">Sin video</span>'}</td>
      <td data-label="Disposición"><span class="orien-badge">${service.alternar ? "Video izquierda" : "Video derecha"}</span></td>
      <td data-label="Estado">${service.activo ? '<span class="orien-badge orien-badge-primary">Activo</span>' : '<span class="orien-badge orien-badge-secondary">Inactivo</span>'}</td>
      <td data-label="Acciones">
        <div class="orien-table-actions">
          <a href="/servicesEdit/${service.id}" class="orien-btn orien-btn-sm orien-btn-outline" title="Editar"><i class="fas fa-edit"></i></a>
          <button class="orien-btn orien-btn-sm orien-btn-outline toggle-status" data-id="${service.id}" style="border-color:${service.activo ? "#28a745" : "#dc3545"}; color:${service.activo ? "#28a745" : "#dc3545"};" title="${service.activo ? "Inactivar" : "Activar"}">
            <i class="fas ${service.activo ? "fa-toggle-on" : "fa-toggle-off"}"></i>
          </button>
          <button class="orien-btn orien-btn-sm orien-btn-outline delete-service" data-id="${service.id}" style="color:#dc3545; border-color:#dc3545;" title="Eliminar"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("");

  // Asignar eventos a los botones
  document.querySelectorAll(".toggle-status").forEach((btn) => {
    btn.removeEventListener("click", toggleHandler);
    btn.addEventListener("click", toggleHandler);
  });
  document.querySelectorAll(".delete-service").forEach((btn) => {
    btn.removeEventListener("click", deleteHandler);
    btn.addEventListener("click", deleteHandler);
  });
}

// ===== Manejadores de eventos =====
function toggleHandler(e) {
  const id = e.currentTarget.dataset.id;
  toggleServiceStatus(id);
}

function deleteHandler(e) {
  const id = e.currentTarget.dataset.id;
  deleteService(id);
}

// ===== Función para cambiar estado (Activar/Inactivar) =====
async function toggleServiceStatus(id) {
  try {
    showLoading();

    // Obtener el servicio completo
    const service = await serviceService.getServiceById(id);
    if (!service) {
      showNotification("Servicio no encontrado", "error");
      hideLoading();
      return;
    }

    // Construir FormData con todos los campos actuales
    const formData = new FormData();
    formData.append("titulo", service.titulo || "");
    formData.append("youtubeUrl", service.youtubeUrl || "");
    formData.append("orden", service.orden || 0);
    formData.append("status", service.activo ? "inactive" : "active");
    formData.append("alternar", service.alternar ? "true" : "false");
    formData.append(
      "carouselEnabled",
      service.carouselEnabled ? "true" : "false",
    );

    // Si NO tiene carrusel, debe enviar descripcion
    if (!service.carouselEnabled) {
      formData.append("descripcion", service.descripcion || "");
    }

    // Los items del carrusel (si existen)
    const carouselItems = service.carouselItems || [];

    // Llamar al servicio de actualización
    await serviceService.updateService(id, formData, carouselItems);

    showNotification(
      `Servicio ${service.activo ? "inactivado" : "activado"} correctamente`,
      "success",
    );

    // Recargar la lista
    currentServices = await serviceService.getAllServices(false);
    if (pagination) {
      pagination.setItems(currentServices);
    } else {
      renderServicesTable(currentServices);
    }

    hideLoading();
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}

// ===== Función para eliminar (SIN CONFIRMACIÓN) =====
async function deleteService(id) {
  try {
    showLoading();
    await serviceService.deleteService(id);
    showNotification("Servicio eliminado", "success");
    // Recargar
    currentServices = await serviceService.getAllServices(false);
    if (pagination) {
      pagination.setItems(currentServices);
    } else {
      renderServicesTable(currentServices);
    }
    hideLoading();
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}

// ===== Búsqueda =====
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
    if (pagination) {
      pagination.setItems(currentServices);
    } else {
      renderServicesTable(currentServices);
    }
    return;
  }
  const filtered = currentServices.filter(
    (s) =>
      s.titulo.toLowerCase().includes(term.toLowerCase()) ||
      s.descripcion.toLowerCase().includes(term.toLowerCase()),
  );
  if (pagination) {
    pagination.setItems(filtered);
  } else {
    renderServicesTable(filtered);
  }
}

// ===== Utilidad =====
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, (m) => {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}
