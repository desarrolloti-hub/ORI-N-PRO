/* ========================================
   CATEGORIES CREATE CONTROLLER - Orién Pro
   Con límite de caracteres
   ======================================== */

import { CategoryService } from "/src/services/categoryService.js";
import {
  showLoading,
  hideLoading,
  showNotification,
} from "/src/modules/utils/uiHelpers.js";

let categoryService = null;
let initialized = false;

const LIMITS = {
  nombre: 50,
  descripcion: 200,
};

export function initCategoriesCreateController() {
  if (initialized) return;
  initialized = true;
  categoryService = new CategoryService();
  bindFormSubmit();
  console.log("✅ Categories Create Controller inicializado");
}

export function destroyCategoriesCreateController() {
  const form = document.getElementById("categoryForm");
  if (form) {
    form.removeEventListener("submit", handleSubmit);
  }
  initialized = false;
  categoryService = null;
}

function bindFormSubmit() {
  const form = document.getElementById("categoryForm");
  if (!form) return;
  form.addEventListener("submit", handleSubmit);
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  const nombre = formData.get("nombre")?.trim() || "";
  const descripcion = formData.get("descripcion")?.trim() || "";

  // Validar longitud
  if (nombre.length === 0) {
    showNotification("El nombre de la categoría es obligatorio", "error");
    return;
  }
  if (nombre.length > LIMITS.nombre) {
    showNotification(
      `El nombre no puede exceder ${LIMITS.nombre} caracteres`,
      "error",
    );
    return;
  }
  if (descripcion.length > LIMITS.descripcion) {
    showNotification(
      `La descripción no puede exceder ${LIMITS.descripcion} caracteres`,
      "error",
    );
    return;
  }

  const categoryData = {
    nombre: nombre,
    descripcion: descripcion,
    activo: formData.get("status") === "active",
  };

  try {
    showLoading();
    await categoryService.createCategory(categoryData);
    showNotification("Categoría creada exitosamente", "success");
    setTimeout(() => {
      window.location.href = "/categoriesList";
    }, 1500);
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}
