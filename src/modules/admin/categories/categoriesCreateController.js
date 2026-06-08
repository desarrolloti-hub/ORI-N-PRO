/* ========================================
   CATEGORIES CREATE CONTROLLER - Orién Pro
   ======================================== */

import { CategoryService } from "/src/services/categoryService.js";
import {
  showLoading,
  hideLoading,
  showNotification,
} from "/src/modules/utils/uiHelpers.js";

let categoryService = null;
let initialized = false;

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

  const categoryData = {
    nombre: formData.get("nombre"),
    descripcion: formData.get("descripcion"),
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
