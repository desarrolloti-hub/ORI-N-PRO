/* ========================================
   ROUTES - Definición de rutas - Orién Pro
   ======================================== */

// Importar controllers de vistas visitor
import { initHomeController } from "../modules/visitor/home/homeController.js";
import { initProductsVisitorController } from "../modules/visitor/products/productsController.js";
import { initProductDetailController } from "../modules/visitor/products/productsDetailController.js";

// Importar controllers de vistas admin
import { initCategoriesCreateController } from "../modules/admin/categories/categoriesCreateController.js";
import { initCategoriesEditController } from "../modules/admin/categories/categoriesEditController.js";
import { initCategoriesListController } from "../modules/admin/categories/categoriesListController.js";
import { initProductsCreateController } from "../modules/admin/products/productsCreateController.js";
import { initProductsEditController } from "../modules/admin/products/productsEditController.js";
import { initProductsListController } from "../modules/admin/products/productsListController.js";
import { initUsersCreateController } from "../modules/admin/users/usersCreateController.js";
import { initUsersEditController } from "../modules/admin/users/usersEditController.js";
import { initUsersListController } from "../modules/admin/users/usersListController.js";

export const routes = {
  // Visitor Routes
  "/": {
    view: "/modules/visitor/home/home.html",
    controller: initHomeController,
  },
  "/inicio": {
    view: "/modules/visitor/home/home.html",
    controller: initHomeController,
  },
  "/products": {
    view: "/modules/visitor/products/products.html",
    controller: initProductsVisitorController,
  },
  "/productDetail/:id": {
    view: "/modules/visitor/products/productsDetail.html",
    controller: (params) => {
      if (params && params.id) {
        initProductDetailController(params.id);
      }
    },
  },
  "/servicios": {
    view: "/modules/visitor/services/services.html",
    controller: null,
  },
  "/about": {
    view: "/modules/visitor/about/about.html",
    controller: null,
  },
  "/contact": {
    view: "/modules/visitor/contact/contact.html",
    controller: null,
  },
  "/login": {
    view: "/modules/visitor/login/login.html",
    controller: null,
  },

  // Admin Routes
  "/adminDashboard": {
    view: "/modules/admin/adminDashboard/adminDashboard.html",
    controller: null,
  },

  // Categories Routes
  "/categoriesList": {
    view: "/modules/admin/categories/categoriesList.html",
    controller: initCategoriesListController,
  },
  "/categoriesCreate": {
    view: "/modules/admin/categories/categoriesCreate.html",
    controller: initCategoriesCreateController,
  },
  "/categoriesEdit/:id": {
    view: "/modules/admin/categories/categoriesEdit.html",
    controller: (params) => {
      if (params && params.id) {
        initCategoriesEditController(params.id);
      }
    },
  },

  // Products Routes
  "/productsList": {
    view: "/modules/admin/products/productsList.html",
    controller: initProductsListController,
  },
  "/productsCreate": {
    view: "/modules/admin/products/productsCreate.html",
    controller: initProductsCreateController,
  },
  "/productsEdit/:id": {
    view: "/modules/admin/products/productsEdit.html",
    controller: (params) => {
      if (params && params.id) {
        initProductsEditController(params.id);
      }
    },
  },

  // Sliders Routes
  "/slidersList": {
    view: "/modules/admin/sliders/slidersList.html",
    controller: null,
  },
  "/slidersCreate": {
    view: "/modules/admin/sliders/slidersCreate.html",
    controller: null,
  },
  "/slidersEdit": {
    view: "/modules/admin/sliders/slidersEdit.html",
    controller: null,
  },

  // Users Routes
  "/usersList": {
    view: "/modules/admin/users/usersList.html",
    controller: initUsersListController,
  },
  "/usersCreate": {
    view: "/modules/admin/users/usersCreate.html",
    controller: initUsersCreateController,
  },
  "/usersEdit/:uid": {
    view: "/modules/admin/users/usersEdit.html",
    controller: (params) => {
      if (params && params.uid) {
        initUsersEditController(params.uid);
      }
    },
  },

  // 404 Error Page
  "/404": {
    view: "/modules/shared/errors/404.html",
    controller: null,
  },

  // Legal Routes
  "/termsAndConditions": {
    view: "/modules/shared/legal/termsAndConditions.html",
    controller: null,
  },
  "/warranty": {
    view: "/modules/shared/legal/warranty.html",
    controller: null,
  },
};
