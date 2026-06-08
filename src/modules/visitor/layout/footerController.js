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
    initSocialLinks();
    initFooterLinks();
    
    console.log('✅ Footer Controller - Orién Pro inicializado');
}

/**
 * Cachea elementos del DOM
 */
function cacheElements() {
    elements = {
        footer: document.querySelector('.orien-footer'),
        yearElement: document.querySelector('.current-year'),
        socialIcons: document.querySelectorAll('.orien-social-icon'),
        footerLinks: document.querySelectorAll('.orien-footer-links a')
    };
}

/**
 * Vincula eventos del DOM
 */
function bindEvents() {
    // Evento scroll para animación
    window.addEventListener('scroll', handleFooterScroll);
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
 */
function initSocialLinks() {
    if (elements.socialIcons.length > 0) {
        elements.socialIcons.forEach((icon, index) => {
            icon.addEventListener('click', (e) => {
                e.preventDefault();
                const socialNetworks = ['facebook', 'instagram', 'twitter', 'linkedin'];
                const network = socialNetworks[index] || 'social';
                console.log(`🔗 Click en ${network}`);
                showSocialAlert(network);
            });
        });
    }
}

/**
 * Inicializa enlaces del footer
 */
function initFooterLinks() {
    if (elements.footerLinks.length > 0) {
        elements.footerLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const linkText = link.textContent;
                console.log(`🔗 Click en enlace: ${linkText}`);
                showLinkMessage(linkText);
            });
        });
    }
}

/**
 * Muestra alerta temporal para redes sociales
 */
function showSocialAlert(network) {
    const toast = document.createElement('div');
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
    
    setTimeout(() => { toast.style.opacity = '1'; }, 10);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

/**
 * Muestra mensaje temporal para enlaces

function showLinkMessage(linkName) {
    const toast = document.createElement('div');
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
    
    setTimeout(() => { toast.style.opacity = '1'; }, 10);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}
 */

/**
 * Maneja animación del footer al hacer scroll
 */
function handleFooterScroll() {
    if (!elements.footer) return;
    
    const footerPosition = elements.footer.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    if (footerPosition.top <= windowHeight - 100) {
        elements.footer.classList.add('orien-footer-visible');
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
        footerLinksCount: elements.footerLinks?.length || 0
    };
}