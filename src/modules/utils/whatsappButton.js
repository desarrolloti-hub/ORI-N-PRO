/* ========================================
   WHATSAPP BUTTON - Componente flotante
   ======================================== */

let whatsappButtonElement = null;

export function initWhatsAppButton() {
  if (whatsappButtonElement) {
    updateVisibility();
    return;
  }

  const phone = "525551391533";
  const message = "Hola%2C%20me%20gustar%C3%ADa%20cotizar%20sus%20servicios.";
  const url = `https://wa.me/${phone}?text=${message}`;

  const container = document.createElement("div");
  container.id = "whatsapp-float-btn";
  container.className = "orien-whatsapp-float";
  container.innerHTML = `
    <a href="${url}" target="_blank" rel="noopener noreferrer" aria-label="Cotizar por WhatsApp">
      <i class="fab fa-whatsapp"></i>
    </a>
  `;

  document.body.appendChild(container);
  whatsappButtonElement = container;

  // Escuchar cambios de ruta (SPA)
  document.addEventListener("route:changed", updateVisibility);
  // También al cargar la página
  updateVisibility();
}

function updateVisibility() {
  if (!whatsappButtonElement) return;

  // Detectamos si estamos en el panel de administración
  const isAdminPage =
    !!document.querySelector(".orien-admin-list-header") ||
    !!document.querySelector(".orien-admin-nav-link") ||
    !!document.querySelector(".orien-admin-dashboard");

  whatsappButtonElement.style.display = isAdminPage ? "none" : "flex";
}
