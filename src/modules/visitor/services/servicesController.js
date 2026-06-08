/* ========================================
   SERVICES VISITOR CONTROLLER - Orién Pro
   Muestra servicios activos con disposición alternada
   ======================================== */

import { ServiceService } from "/src/services/serviceService.js";

let serviceService = null;
let services = [];

export async function initServicesController() {
  serviceService = new ServiceService();
  await loadServices();
  console.log("✅ Services Visitor Controller inicializado");
}

async function loadServices() {
  try {
    showLoading();
    services = await serviceService.getAllServices(true);
    renderServices(services);
    hideLoading();
  } catch (error) {
    console.error("Error cargando servicios:", error);
    showNotification(error.message, "error");
    hideLoading();
  }
}

function renderServices(services) {
  const container = document.getElementById("servicesContainer");
  if (!container) return;

  if (services.length === 0) {
    container.innerHTML = `<div class="orien-empty-state"><i class="fas fa-concierge-bell"></i><p>Pronto agregaremos nuestros servicios</p></div>`;
    return;
  }

  container.innerHTML = services
    .map((service, index) => {
      const isAlternate = service.alternar;
      const layoutClass = isAlternate ? "orien-service-alternate" : "";

      return `
      <div class="orien-service-item ${layoutClass}" data-aos="fade-up">
        <div class="orien-service-content">
          <h3>${escapeHtml(service.titulo)}</h3>
          <p>${escapeHtml(service.descripcion)}</p>
        </div>
        <div class="orien-service-media">
          <video controls src="${service.videoURL}" poster="/assets/images/video-placeholder.jpg"></video>
        </div>
      </div>
    `;
    })
    .join("");
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

function showLoading() {
  const container = document.getElementById("servicesContainer");
  if (container)
    container.innerHTML =
      '<div class="orien-loading"><div class="orien-spinner"></div><p>Cargando servicios...</p></div>';
}
function hideLoading() {}
function showNotification(msg, type) {
  const notif = document.createElement("div");
  notif.className = `orien-notification orien-notification-${type}`;
  notif.textContent = msg;
  notif.style.cssText = `position:fixed;bottom:20px;right:20px;background:${type === "success" ? "#28a745" : "#dc3545"};color:white;padding:12px 20px;border-radius:8px;z-index:10000;`;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}
