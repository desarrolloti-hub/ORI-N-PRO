/* ========================================
   CATEGORIES LIST CONTROLLER - Orién Pro
   ======================================== */

import { CategoryService } from "/src/services/categoryService.js";
import {
  showLoading,
  hideLoading,
  showNotification,
} from "/src/modules/utils/uiHelpers.js";

let categoryService = null;
let currentCategories = [];

export function initCategoriesListController() {
  categoryService = new CategoryService();
  loadCategories();
  bindEvents();
  console.log("✅ Categories List Controller inicializado");
}

async function loadCategories() {
  try {
    showLoading();
    currentCategories = await categoryService.getAllCategories(false);
    renderCategoriesTable(currentCategories);
    updateCategoriesCount(currentCategories.length);
    hideLoading();
  } catch (error) {
    console.error("Error cargando categorías:", error);
    showNotification(error.message, "error");
    hideLoading();
  }
}

function renderCategoriesTable(categories) {
  const tbody = document.querySelector("#categoriesTable tbody");
  if (!tbody) return;

  if (categories.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px;">
                    <i class="fas fa-tags" style="font-size: 2rem; color: var(--color-gray);"></i>
                    <p>No hay categorías registradas</p>
                </td>
            </tr>
        `;
    return;
  }

  tbody.innerHTML = categories
    .map(
      (category) => `
        <tr data-id="${category.id}">
            <td data-label="Nombre"><strong>${category.nombre}</strong></td>
            <td data-label="Slug"><code>${category.slug}</code></td>
            <td data-label="Descripción">${category.descripcion || "—"}</td>
            <td data-label="Estado">
                <span class="orien-badge ${category.activo ? "orien-badge-primary" : "orien-badge-secondary"}">
                    ${category.activo ? "Activo" : "Inactivo"}
                </span>
            </td>
            <td data-label="Acciones">
                <div class="orien-table-actions">
                    <a href="/categoriesEdit/${category.id}" class="orien-btn orien-btn-sm orien-btn-outline" data-link>
                        <i class="fas fa-edit"></i>
                    </a>
                    <button class="orien-btn orien-btn-sm orien-btn-outline delete-category" data-id="${category.id}" style="color:#dc3545; border-color:#dc3545;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `,
    )
    .join("");

  document.querySelectorAll(".delete-category").forEach((btn) => {
    btn.removeEventListener("click", handleDeleteClick);
    btn.addEventListener("click", handleDeleteClick);
  });
}

async function handleDeleteClick(e) {
  e.stopPropagation();
  const id = e.currentTarget.dataset.id;
  await deleteCategory(id);
}

async function deleteCategory(id) {
  if (!confirm("¿Está seguro de que desea eliminar esta categoría?")) return;
  try {
    showLoading();
    await categoryService.deleteCategory(id);
    showNotification("Categoría eliminada exitosamente", "success");
    await loadCategories();
  } catch (error) {
    showNotification(error.message, "error");
  } finally {
    hideLoading();
  }
}

function updateCategoriesCount(count) {
  const countElement = document.getElementById("categoriesCount");
  if (countElement) {
    countElement.textContent = `${count} categorías registradas`;
  }
}

function bindEvents() {
  const searchInput = document.getElementById("searchCategories");
  if (searchInput) {
    searchInput.addEventListener("input", filterCategories);
  }
}

function filterCategories() {
  const searchTerm =
    document.getElementById("searchCategories")?.value.toLowerCase() || "";
  const filtered = currentCategories.filter((cat) =>
    cat.nombre.toLowerCase().includes(searchTerm),
  );
  renderCategoriesTable(filtered);
  updateCategoriesCount(filtered.length);
}
