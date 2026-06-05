/* src/router/routes.js */

/* ========================================
   ROUTES - Definición de rutas - Orién Pro
   ======================================== */

// Importar controllers de vistas
import { initHomeController } from '../modules/visitor/home/homeController.js';

export const routes = {
    // Visitor Routes
    "/": {
        view: "/modules/visitor/home/home.html",
        controller: initHomeController
    },
    "/inicio": {
        view: "/modules/visitor/home/home.html",
        controller: initHomeController
    },
    "/products": {
        view: "/modules/visitor/products/products.html",
        controller: null
    },
    "/servicios": {
        view: "/modules/visitor/services/services.html",
        controller: null
    },
    "/about": {
        view: "/modules/visitor/about/about.html",
        controller: null
    },
    "/contact": {
        view: "/modules/visitor/contact/contact.html",
        controller: null
    },
    "/login": {
        view: "/modules/visitor/login/login.html",
        controller: null
    },

    // Admin Routes
    "/admin/adminDashboard": {
        view: "/modules/admin/adminDashboard/adminDashboard.html",
        controller: null
    },
    "/admin/products/productsList": {
        view: "/modules/admin/products/productsList.html",
        controller: null
    },
    "/admin/products/productsCreate": {
        view: "/modules/admin/products/productsCreate.html",
        controller: null
    },
    "/admin/products/productsEdit": {
        view: "/modules/admin/products/productsEdit.html",
        controller: null
    },
    // Admin Sliders Routes (agregar después de las rutas de products)
    "/admin/sliders/slidersList": {
        view: "/modules/admin/sliders/slidersList.html",
        controller: null
    },
    "/admin/sliders/slidersCreate": {
        view: "/modules/admin/sliders/slidersCreate.html",
        controller: null
    },
    "/admin/sliders/slidersEdit": {
        view: "/modules/admin/sliders/slidersEdit.html",
        controller: null
    },

    // 404 Error Page
    '/404': {
        view: '/modules/shared/errors/404.html',
        controller: null
    }
};