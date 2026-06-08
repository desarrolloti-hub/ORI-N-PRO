/* ========================================
   CATEGORIES EDIT CONTROLLER - Orién Pro
   ======================================== */

import { CategoryService } from "/src/services/categoryService.js";
import {
  showLoading,
  hideLoading,
  showNotification,
} from "/src/modules/utils/uiHelpers.js";

let categoryService = null;
let currentCategoryId = null;
let initialized = false;

export function initCategoriesEditController(id) {
  if (initialized && currentCategoryId === id) return;

  initialized = true;
  currentCategoryId = id;
  categoryService = new CategoryService();

  loadCategoryData();
  bindFormSubmit();
  bindDeleteButton();

  console.log("✅ Categories Edit Controller inicializado para id:", id);
}

export function destroyCategoriesEditController() {
  const form = document.getElementById("categoryForm");
  if (form) {
    form.removeEventListener("submit", handleSubmit);
  }
  const deleteBtn = document.getElementById("deleteBtn");
  if (deleteBtn) {
    deleteBtn.removeEventListener("click", handleDelete);
  }
  initialized = false;
  currentCategoryId = null;
  categoryService = null;
}

async function loadCategoryData() {
  try {
    showLoading();
    const category = await categoryService.getCategoryById(currentCategoryId);
    if (!category) {
      showNotification("Categoría no encontrada", "error");
      setTimeout(() => {
        window.location.href = "/categoriesList";
      }, 1500);
      return;
    }
    populateForm(category);
    hideLoading();
  } catch (error) {
    console.error("Error cargando categoría:", error);
    showNotification(error.message, "error");
    hideLoading();
  }
}

function populateForm(category) {
  const nombreInput = document.querySelector('input[name="nombre"]');
  const slugInput = document.querySelector('input[name="slug"]');
  const descripcionTextarea = document.querySelector(
    'textarea[name="descripcion"]',
  );
  const statusRadios = document.querySelectorAll('input[name="status"]');
  const idSpan = document.getElementById("categoryId");

  if (nombreInput) nombreInput.value = category.nombre;
  if (slugInput) slugInput.value = category.slug;
  if (descripcionTextarea)
    descripcionTextarea.value = category.descripcion || "";
  if (idSpan) idSpan.textContent = `ID: ${category.id.substring(0, 8)}...`;

  statusRadios.forEach((radio) => {
    const isActive = radio.value === "active";
    if (isActive === category.activo) {
      radio.checked = true;
    }
  });
}

function bindFormSubmit() {
  const form = document.getElementById("categoryForm");
  if (!form) return;
  form.addEventListener("submit", handleSubmit);
}

function bindDeleteButton() {
  const deleteBtn = document.getElementById("deleteBtn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", handleDelete);
  }
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
    await categoryService.updateCategory(currentCategoryId, categoryData);
    showNotification("Categoría actualizada exitosamente", "success");
    setTimeout(() => {
      window.location.href = "/categoriesList";
    }, 1500);
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}

async function handleDelete() {
  if (!confirm("¿Está seguro de que desea eliminar esta categoría?")) return;
  try {
    showLoading();
    await categoryService.deleteCategory(currentCategoryId);
    showNotification("Categoría eliminada exitosamente", "success");
    setTimeout(() => {
      window.location.href = "/categoriesList";
    }, 1500);
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}
