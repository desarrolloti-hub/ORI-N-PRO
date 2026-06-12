/* ========================================
   FOOTER CONTROLLER - Orién Pro
   Controlador del layout persistente footer
   ======================================== */

// Elementos DOM cacheados
let elements = {};

/**
 * Inicializa el controlador del footer
 */
export function initFooterController() {
  cacheElements();
  bindEvents();
  updateCurrentYear();
  initSocialLinks(); // Ahora no bloquea
  initFooterLinks(); // También puede ajustarse si es necesario

  console.log("✅ Footer Controller - Orién Pro inicializado");
}

/**
 * Cachea elementos del DOM
 */
function cacheElements() {
  elements = {
    footer: document.querySelector(".orien-footer"),
    yearElement: document.querySelector(".current-year"),
    socialIcons: document.querySelectorAll(".orien-social-icon"),
    footerLinks: document.querySelectorAll(".orien-footer-links a"),
  };
}

/**
 * Vincula eventos del DOM
 */
function bindEvents() {
  window.addEventListener("scroll", handleFooterScroll);
}

/**
 * Actualiza año actual en el footer
 */
function updateCurrentYear() {
  if (elements.yearElement) {
    elements.yearElement.textContent = new Date().getFullYear();
  }
}

/**
 * Inicializa enlaces de redes sociales
 * Ahora NO previene el comportamiento por defecto si el enlace es real
 */
function initSocialLinks() {
  if (elements.socialIcons.length === 0) return;

  elements.socialIcons.forEach((icon) => {
    // No hacer preventDefault si el href es una URL real
    // Solo registrar el clic para analytics si se desea, pero dejar navegar
    icon.addEventListener("click", (e) => {
      const href = icon.getAttribute("href");
      // Si es un enlace válido (no "#" ni vacío), dejar que el navegador lo maneje
      if (href && href !== "#" && href !== "javascript:void(0)") {
        return; // No hacemos nada, el navegador seguirá el enlace
      }
      // Si es un enlace vacío o ficticio, prevenir y mostrar mensaje
      e.preventDefault();
      const socialNetworks = ["facebook", "instagram", "twitter", "linkedin"];
      const network = socialNetworks.find((n) => href?.includes(n)) || "social";
      console.log(`🔗 Click en ${network}`);
      showSocialAlert(network);
    });
  });
}

/**
 * Inicializa enlaces del footer (términos, garantía, etc.)
 * Ahora no bloquea los enlaces que son rutas internas con data-link
 * El router ya se encarga de ellos.
 */
function initFooterLinks() {
  // No es necesario prevenir nada, los enlaces con data-link ya son manejados por el router
  // Solo podemos loguear si se desea, pero sin preventDefault
  if (elements.footerLinks.length > 0) {
    elements.footerLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (!href || href === "#") {
          e.preventDefault();
          showLinkMessage(link.textContent);
        }
        // Si tiene href real, el router o el navegador lo manejan
      });
    });
  }
}

/**
 * Muestra alerta temporal para redes sociales (solo cuando el enlace no es válido)
 */
function showSocialAlert(network) {
  const toast = document.createElement("div");
  toast.textContent = `🚀 Redirigiendo a ${network.toUpperCase()}...`;
  toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 20px;
        background: #333;
        color: #E6E6E6;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 0.85rem;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
    `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
  }, 10);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

/**
 * Muestra mensaje temporal para enlaces no válidos
 */
function showLinkMessage(linkName) {
  const toast = document.createElement("div");
  toast.textContent = `📄 ${linkName} - Próximamente`;
  toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 20px;
        background: #162542;
        color: #D9D9D9;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 0.85rem;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
    `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
  }, 10);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

/**
 * Maneja animación del footer al hacer scroll
 */
function handleFooterScroll() {
  if (!elements.footer) return;

  const footerPosition = elements.footer.getBoundingClientRect();
  const windowHeight = window.innerHeight;

  if (footerPosition.top <= windowHeight - 100) {
    elements.footer.classList.add("orien-footer-visible");
  }
}

/**
 * Obtiene estado del footer
 */
export function getFooterState() {
  return {
    isLoaded: true,
    currentYear: new Date().getFullYear(),
    socialLinksCount: elements.socialIcons?.length || 0,
    footerLinksCount: elements.footerLinks?.length || 0,
  };
}
