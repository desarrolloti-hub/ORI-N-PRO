/* ========================================
   ROUTES - Definición de rutas - Orién Pro
   ======================================== */

// Importar controllers de vistas
import { initUsersCreateController } from '../modules/admin/users/usersCreateController.js';
import { initUsersEditController } from '../modules/admin/users/usersEditController.js';
import { initUsersListController } from '../modules/admin/users/usersListController.js';
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
    "/adminDashboard": {
        view: "/modules/admin/adminDashboard/adminDashboard.html",
        controller: null
    },
    "/productsList": {
        view: "/modules/admin/products/productsList.html",
        controller: null
    },
    "/productsCreate": {
        view: "/modules/admin/products/productsCreate.html",
        controller: null
    },
    "/productsEdit": {
        view: "/modules/admin/products/productsEdit.html",
        controller: null
    },
    "/slidersList": {
        view: "/modules/admin/sliders/slidersList.html",
        controller: null
    },
    "/slidersCreate": {
        view: "/modules/admin/sliders/slidersCreate.html",
        controller: null
    },
    "/slidersEdit": {
        view: "/modules/admin/sliders/slidersEdit.html",
        controller: null
    },
    "/usersList": {
        view: "/modules/admin/users/usersList.html",
        controller: initUsersListController
    },
    "/usersCreate": {
        view: "/modules/admin/users/usersCreate.html",
        controller: initUsersCreateController
    },
     "/usersEdit/:uid": {
        view: "/modules/admin/users/usersEdit.html",
        controller: (params) => {
            if (params && params.uid) {
                initUsersEditController(params.uid);
            }
        }
    },

    // 404 Error Page
    '/404': {
        view: '/modules/shared/errors/404.html',
        controller: null
    },

    // Legal Routes
    "/termsAndConditions": {
        view: "/modules/shared/legal/termsAndConditions.html",
        controller: null
    },
};