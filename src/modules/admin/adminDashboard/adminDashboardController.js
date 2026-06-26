/* ========================================
   ADMIN DASHBOARD CONTROLLER - Orién Pro
   ======================================== */

import { getCurrentUser, isAdmin, logout } from "/src/modules/utils/auth.js";
import { showNotification } from "/src/modules/utils/uiHelpers.js";
import { ProductService } from "/src/services/productService.js";
import { UserService } from "/src/services/userService.js";
import { CarouselService } from "/src/services/carouselService.js";

let productService = null;
let userService = null;
let carouselService = null;

export async function initAdminDashboardController() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "/login";
    return;
  }

  // Mostrar/ocultar módulo de usuarios según rol
  const usersModule = document.getElementById("usersModuleCard");
  if (usersModule) {
    usersModule.style.display = isAdmin() ? "flex" : "none";
  }

  // Cargar estadísticas
  await loadStats();

  // Botón de cierre de sesión
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await logout();
      window.location.href = "/";
    });
  }

}

async function loadStats() {
  try {
    productService = new ProductService();
    userService = new UserService();
    carouselService = new CarouselService();

    const products = await productService.getAllProducts();
    const users = await userService.getAllUsers(false);
    const carousels = await carouselService.getAllCarousels();

    const totalProductsElem = document.getElementById("totalProducts");
    const totalUsersElem = document.getElementById("totalUsers");
    const totalCarouselsElem = document.getElementById("totalCarousels");

    if (totalProductsElem) totalProductsElem.textContent = products.length;
    if (totalUsersElem) totalUsersElem.textContent = users.length;
    if (totalCarouselsElem) totalCarouselsElem.textContent = carousels.length;
  } catch (error) {
    console.error("Error cargando estadísticas:", error);
    showNotification("Error al cargar estadísticas", "error");
  }
}
