/* ========================================
   ROUTES - Definición de rutas - Orién Pro
   ======================================== */

// Importar controllers de vistas
import { initHomeController } from '../modules/visitor/home/homeController.js';

export const routes = {
    "/": {
        view: "/modules/visitor/home/home.html",
        controller: initHomeController
    },
    "/inicio": {
        view: "/modules/visitor/home/home.html",
        controller: initHomeController
    },
    "/productos": {
        view: "/modules/visitor/products/products.html",
        controller: null
    },
    "/servicios": {
        view: "/modules/visitor/services/services.html",
        controller: null
    },
    "/nosotros": {
        view: "/modules/visitor/nosotros/nosotros.html",
        controller: null
    },
    "/contacto": {
        view: "/modules/visitor/contacto/contacto.html",
        controller: null
    },
    '/404': {
        view: '/modules/shared/errors/404.html',
        controller: null
    }
};