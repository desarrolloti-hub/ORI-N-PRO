/* ========================================
   UI HELPERS - Orién Pro
   Funciones comunes de interfaz de usuario
   ======================================== */

/**
 * Muestra el loader de página
 */
export function showLoading() {
  let loader = document.querySelector(".orien-page-loader");
  if (!loader) {
    loader = document.createElement("div");
    loader.className = "orien-page-loader";
    loader.innerHTML = '<div class="orien-spinner"></div>';
    document.body.appendChild(loader);
  }
  loader.classList.remove("hidden");
}

/**
 * Oculta el loader de página
 */
export function hideLoading() {
  const loader = document.querySelector(".orien-page-loader");
  if (loader) {
    loader.classList.add("hidden");
  }
}

/**
 * Muestra una notificación temporal
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - 'success', 'error', 'warning'
 */
export function showNotification(message, type = "success") {
  const oldNotifications = document.querySelectorAll(".orien-notification");
  oldNotifications.forEach((n) => n.remove());

  const notification = document.createElement("div");
  notification.className = `orien-notification orien-notification-${type}`;
  notification.textContent = message;

  let bgColor = "#28a745";
  if (type === "error") bgColor = "#dc3545";
  if (type === "warning") bgColor = "#ffc107";

  notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${bgColor};
        color: ${type === "warning" ? "#333" : "white"};
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 0.85rem;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transition = "opacity 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Formatea un precio a moneda mexicana
 * @param {string|number} price
 * @returns {string}
 */
export function formatPrice(price) {
  const numeric = parseInt(String(price).replace(/[^0-9]/g, ""));
  if (isNaN(numeric)) return price;
  return `$${numeric.toLocaleString("es-MX")} MXN`;
}

/**
 * Limpia un precio dejando solo números
 * @param {string} price
 * @returns {string}
 */
export function cleanPrice(price) {
  const numeric = price.replace(/[^0-9]/g, "");
  return numeric;
}
