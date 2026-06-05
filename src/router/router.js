/* src/router/router.js */

/* ========================================
   ROUTER - Orién Pro
   Sistema de enrutamiento SPA con soporte para parámetros
   ======================================== */

import { routes } from './routes.js';

let currentController = null;
let currentPath = window.location.pathname;

/**
 * Inicializa el router
 */
export function initRouter() {
    window.addEventListener('popstate', () => {
        handleRoute();
    });
    
    document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-link]');
        if (link) {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href && href !== '#') {
                navigateTo(href);
            }
        }
    });
    
    handleRoute();
    
    console.log('✅ Router inicializado');
}

/**
 * Maneja el cambio de ruta
 */
async function handleRoute() {
    const path = window.location.pathname;
    currentPath = path;
    
    let route = null;
    let params = {};
    
    // Buscar coincidencia exacta primero
    if (routes[path]) {
        route = routes[path];
    } else {
        // Buscar ruta con parámetros (ej: /usersEdit/:uid)
        for (const [routePath, routeConfig] of Object.entries(routes)) {
            if (routePath.includes(':')) {
                const routeParts = routePath.split('/');
                const pathParts = path.split('/');
                
                if (routeParts.length === pathParts.length) {
                    let match = true;
                    const extractedParams = {};
                    
                    for (let i = 0; i < routeParts.length; i++) {
                        if (routeParts[i].startsWith(':')) {
                            const paramName = routeParts[i].substring(1);
                            extractedParams[paramName] = pathParts[i];
                        } else if (routeParts[i] !== pathParts[i]) {
                            match = false;
                            break;
                        }
                    }
                    
                    if (match) {
                        route = routeConfig;
                        params = extractedParams;
                        break;
                    }
                }
            }
        }
    }
    
    if (!route) {
        console.warn(`Ruta no encontrada: ${path}`);
        route = routes['/404'];
        
        if (!route) {
            console.error('No hay ruta de 404 definida');
            return;
        }
    }
    
    // Destruir controller anterior si existe
    if (currentController && typeof currentController.destroy === 'function') {
        currentController.destroy();
        currentController = null;
    }
    
    // Cargar la vista
    await loadView(route.view);
    
    // Esperar a que el DOM se actualice antes de inicializar el controller
    setTimeout(() => {
        // Inicializar controller si existe
        if (route.controller) {
            if (typeof route.controller === 'function') {
                // Pasar los parámetros de la ruta
                currentController = route.controller(params);
            } else {
                currentController = route.controller;
            }
        }
        
        // Disparar evento de cambio de ruta
        const event = new CustomEvent('route:changed', { 
            detail: { path, route, params } 
        });
        document.dispatchEvent(event);
    }, 100);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Carga una vista HTML en el contenedor principal
 */
async function loadView(viewPath) {
    const app = document.getElementById('app');
    
    if (!app) {
        console.error('Contenedor #app no encontrado');
        return;
    }
    
    try {
        showLoader();
        
        const response = await fetch(viewPath);
        
        if (!response.ok) {
            throw new Error(`Error cargando vista: ${response.status}`);
        }
        
        const html = await response.text();
        
        app.innerHTML = html;
        
        setTimeout(() => {
            hideLoader();
        }, 50);
        
    } catch (error) {
        console.error('Error cargando vista:', error);
        hideLoader();
        app.innerHTML = `
            <div class="error-container">
                <h2>Error cargando la página</h2>
                <p>${error.message}</p>
                <a href="/" data-link>Volver al inicio</a>
            </div>
        `;
    }
}

/**
 * Muestra el loader
 */
function showLoader() {
    let loader = document.querySelector('.orien-page-loader');
    
    if (!loader) {
        loader = document.createElement('div');
        loader.className = 'orien-page-loader';
        loader.innerHTML = '<div class="orien-spinner"></div>';
        document.body.appendChild(loader);
    }
    
    loader.classList.remove('hidden');
}

/**
 * Oculta el loader
 */
function hideLoader() {
    const loader = document.querySelector('.orien-page-loader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => {
            if (loader && loader.remove) {
                loader.remove();
            }
        }, 500);
    }
}

/**
 * Navega a una ruta específica
 */
export function navigateTo(path) {
    if (path === currentPath) return;
    window.history.pushState({}, '', path);
    handleRoute();
}

/**
 * Obtiene la ruta actual
 */
export function getCurrentPath() {
    return currentPath;
}

/**
 * Obtiene el controller actual
 */
export function getCurrentController() {
    return currentController;
}