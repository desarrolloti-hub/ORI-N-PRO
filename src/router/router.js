/* src/router/router.js */

/* ========================================
   ROUTER - Orién Pro
   Sistema de enrutamiento SPA con soporte para parámetros, fragmentos y scroll a anclas
   ======================================== */

import { routes } from "./routes.js";

let currentController = null;
let currentPath = window.location.pathname;
let currentHash = window.location.hash;

/**
 * Verifica si el usuario tiene acceso a la ruta
 */
function hasAccess(route) {
  const user = JSON.parse(localStorage.getItem("orien_user") || "null");
  const isAdminRoute =
    route.view.includes("/admin/") || route.view.includes("/modules/admin/");

  if (!isAdminRoute) return true;

  if (!user) {
    console.warn("Acceso denegado: no autenticado");
    return false;
  }

  // Si es ruta de creación de usuarios, solo admin
  if (route.view.includes("usersCreate") && user.cargo !== "admin") {
    console.warn("Acceso denegado: se requiere rol admin");
    return false;
  }

  return true;
}

/**
 * Inicializa el router
 */
export function initRouter() {
  window.addEventListener("popstate", () => {
    handleRoute();
  });

  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-link]");
    if (link) {
      e.preventDefault();
      const href = link.getAttribute("href");
      if (href && href !== "#") {
        navigateTo(href);
      }
    }
  });

  handleRoute();
}

/**
 * Maneja el cambio de ruta
 */
async function handleRoute() {
  const fullPath = window.location.pathname + window.location.hash;
  const path = window.location.pathname;
  const hash = window.location.hash.substring(1); // sin el #

  currentPath = path;
  currentHash = hash;

  let route = null;
  let params = {};

  // Buscar coincidencia exacta primero
  if (routes[path]) {
    route = routes[path];
  } else {
    // Buscar ruta con parámetros
    for (const [routePath, routeConfig] of Object.entries(routes)) {
      if (routePath.includes(":")) {
        const routeParts = routePath.split("/");
        const pathParts = path.split("/");

        if (routeParts.length === pathParts.length) {
          let match = true;
          const extractedParams = {};

          for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(":")) {
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
    route = routes["/404"];
    if (!route) {
      console.error("No hay ruta de 404 definida");
      return;
    }
  }

  // Verificar acceso
  if (!hasAccess(route)) {
    window.location.href = "/login";
    return;
  }

  // Destruir controller anterior
  if (currentController && typeof currentController.destroy === "function") {
    currentController.destroy();
    currentController = null;
  }

  // Cargar la vista
  await loadView(route.view);

  // Esperar a que el DOM se actualice
  setTimeout(() => {
    if (route.controller) {
      if (typeof route.controller === "function") {
        currentController = route.controller(params);
      } else {
        currentController = route.controller;
      }
    }

    const event = new CustomEvent("route:changed", {
      detail: { path, route, params, hash },
    });
    document.dispatchEvent(event);

    // Scroll al elemento si hay hash, de lo contrario al inicio
    if (hash) {
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        // Si no existe el elemento, ir al inicio
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, 100);
}

/**
 * Carga una vista HTML en el contenedor principal
 */
async function loadView(viewPath) {
  const app = document.getElementById("app");
  if (!app) {
    console.error("Contenedor #app no encontrado");
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
    setTimeout(() => hideLoader(), 50);
  } catch (error) {
    console.error("Error cargando vista:", error);
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

function showLoader() {
  let loader = document.querySelector(".orien-page-loader");
  if (!loader) {
    loader = document.createElement("div");
    loader.className = "orien-page-loader";
    loader.innerHTML = '<div class="orien-spinner"></div>';
    document.body.appendChild(loader);
  }
  loader.classList.remove("hidden");
}

function hideLoader() {
  const loader = document.querySelector(".orien-page-loader");
  if (loader) {
    loader.classList.add("hidden");
    setTimeout(() => {
      if (loader && loader.remove) loader.remove();
    }, 500);
  }
}

export function navigateTo(path) {
  // Extraer ruta base y hash
  const [basePath, hash] = path.split("#");
  const newFullPath = basePath + (hash ? "#" + hash : "");
  if (newFullPath === window.location.pathname + window.location.hash) return;

  window.history.pushState({}, "", newFullPath);
  handleRoute();
}

export function getCurrentPath() {
  return currentPath;
}

export function getCurrentHash() {
  return currentHash;
}

export function getCurrentController() {
  return currentController;
}
