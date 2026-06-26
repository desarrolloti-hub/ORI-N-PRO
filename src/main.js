import { loadLayout } from './modules/visitor/layout/loadLayout.js';
import { initNavbarController } from './modules/visitor/layout/navbarController.js';
import { initFooterController } from './modules/visitor/layout/footerController.js';
import { initRouter } from './router/router.js';

/**
 * Inicializa la aplicación
 */
async function initApp() {
    try {
        // 1. Cargar layouts persistentes
        await loadLayout();
        
        // 2. Inicializar controllers de layout
        initNavbarController();
        initFooterController();
        
        // 3. Inicializar router
        initRouter();       
    } catch (error) {
        console.error('❌ Error inicializando aplicación:', error);
    }
}

// Iniciar aplicación
initApp();