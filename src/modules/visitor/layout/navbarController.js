/* ========================================
   NAVBAR CONTROLLER - Orién Pro
   Controlador del layout persistente navbar
   ======================================== */

// Estado privado del controller
let state = {
    isMenuOpen: false,
    isScrolled: false
};

// Elementos DOM cacheados
let elements = {};

/**
 * Inicializa el controlador del navbar
 */
export function initNavbarController() {
    cacheElements();
    
    if (!elements.navbar) {
        console.warn('⚠️ Navbar no encontrado en el DOM');
        return null;
    }
    
    bindEvents();
    setActiveLink();
    handleScroll();
    
    console.log('✅ Navbar Controller - Orién Pro inicializado');
    
    return {
        closeMenu,
        setActiveLink,
        getState
    };
}

/**
 * Cachea elementos del DOM
 */
function cacheElements() {
    elements = {
        navbar: document.querySelector('.orien-navbar'),
        hamburger: document.querySelector('.orien-hamburger'),
        closeBtn: document.querySelector('.orien-close'),
        menu: document.querySelector('.orien-menu'),
        menuLinks: document.querySelectorAll('.orien-menu li a'),
        body: document.body
    };
}

/**
 * Vincula eventos del DOM
 */
function bindEvents() {
    // Eventos menú móvil
    if (elements.hamburger) {
        elements.hamburger.addEventListener('click', openMenu);
    }
    
    if (elements.closeBtn) {
        elements.closeBtn.addEventListener('click', closeMenu);
    }
    
    // Evento scroll
    window.addEventListener('scroll', handleScroll);
    
    // Click fuera del menú
    document.addEventListener('click', handleClickOutside);
    
    // Evento resize
    window.addEventListener('resize', handleResize);
    
    // Escuchar cambios de ruta (disparado por router)
    document.addEventListener('route:changed', () => {
        setActiveLink();
        closeMenu();
    });
    
    // Delegación de eventos para enlaces
    if (elements.menu) {
        elements.menu.addEventListener('click', handleLinkClick);
    }
    
    // Dropdowns en móvil
    const dropdowns = document.querySelectorAll('.orien-dropdown');
    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('a');
        if (link) {
            link.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    dropdown.classList.toggle('active');
                }
            });
        }
    });
}

/**
 * Abre menú móvil
 */
function openMenu() {
    if (!elements.menu) return;
    
    elements.menu.classList.add('active');
    elements.body.classList.add('menu-open');
    elements.body.style.overflow = 'hidden';
    state.isMenuOpen = true;
    
    if (elements.closeBtn) {
        elements.closeBtn.style.display = 'block';
    }
    if (elements.hamburger) {
        elements.hamburger.style.display = 'none';
    }
}

/**
 * Cierra menú móvil
 */
function closeMenu() {
    if (!elements.menu) return;
    
    elements.menu.classList.remove('active');
    elements.body.classList.remove('menu-open');
    elements.body.style.overflow = '';
    state.isMenuOpen = false;
    
    if (elements.closeBtn) {
        elements.closeBtn.style.display = 'none';
    }
    if (elements.hamburger) {
        elements.hamburger.style.display = 'block';
    }
}

/**
 * Maneja evento scroll
 */
function handleScroll() {
    if (!elements.navbar) return;
    
    const scrolled = window.scrollY > 50;
    
    if (scrolled !== state.isScrolled) {
        state.isScrolled = scrolled;
        
        if (scrolled) {
            elements.navbar.classList.add('orien-navbar-scrolled');
        } else {
            elements.navbar.classList.remove('orien-navbar-scrolled');
        }
    }
}

/**
 * Maneja click fuera del menú
 */
function handleClickOutside(event) {
    if (!state.isMenuOpen) return;
    
    const isClickInsideMenu = elements.menu?.contains(event.target);
    const isClickOnHamburger = elements.hamburger?.contains(event.target);
    
    if (!isClickInsideMenu && !isClickOnHamburger) {
        closeMenu();
    }
}

/**
 * Maneja resize de ventana
 */
function handleResize() {
    if (window.innerWidth > 768 && state.isMenuOpen) {
        closeMenu();
    }
}

/**
 * Maneja click en enlaces del navbar
 */
function handleLinkClick(e) {
    const link = e.target.closest('a');
    if (link && link.getAttribute('href')) {
        const href = link.getAttribute('href');
        
        if (href && !href.startsWith('http') && href !== '#') {
            e.preventDefault();
            addLoadingEffect(link);
            
            if (typeof window.navigateTo === 'function') {
                window.navigateTo(href);
            } else {
                window.location.href = href;
            }
            
            closeMenu();
        }
    }
}

/**
 * Marca enlace activo según ruta actual
 */
function setActiveLink() {
    if (!elements.menuLinks || elements.menuLinks.length === 0) return;
    
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    
    elements.menuLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        
        if (!linkPath || linkPath === '#') return;
        
        link.classList.remove('active');
        
        // Para enlaces con hash (#id)
        if (linkPath.startsWith('#')) {
            if (currentHash === linkPath) {
                link.classList.add('active');
            }
        } else {
            // Para rutas normales
            if (currentPath === linkPath) {
                link.classList.add('active');
            } else if (linkPath !== '/' && currentPath.startsWith(linkPath)) {
                link.classList.add('active');
            } else if (currentPath === '/' && linkPath === '/') {
                link.classList.add('active');
            }
        }
    });
}

/**
 * Agrega efecto de carga a enlace clickeado
 */
function addLoadingEffect(link) {
    link.classList.add('loading');
    setTimeout(() => {
        link.classList.remove('loading');
    }, 500);
}

/**
 * Obtiene estado actual del navbar
 */
export function getState() {
    return { ...state };
}