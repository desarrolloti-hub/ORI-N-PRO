/* ========================================
   PRODUCTS LIST CONTROLLER - Orién Pro
   ======================================== */

import { ProductService } from "/src/services/productService.js";
import { CategoryService } from "/src/services/categoryService.js";
import {
  showLoading,
  hideLoading,
  showNotification,
} from "/src/modules/utils/uiHelpers";

let productService = null;
let categoryService = null;
let currentProducts = [];
let categoriesMap = new Map();

export function initProductsListController() {
  productService = new ProductService();
  categoryService = new CategoryService();
  loadCategories();
  loadProducts();
  bindEvents();
  console.log("✅ Products List Controller inicializado");
}

async function loadCategories() {
  try {
    const categories = await categoryService.getAllCategories(true);
    categoriesMap.clear();
    categories.forEach((cat) => categoriesMap.set(cat.id, cat.nombre));
  } catch (error) {
    console.error("Error cargando categorías:", error);
  }
}

async function loadProducts() {
  try {
    showLoading();
    currentProducts = await productService.getAllProducts();
    renderProductTable(currentProducts);
    updateProductCount(currentProducts.length);
    hideLoading();
  } catch (error) {
    console.error("Error cargando productos:", error);
    showNotification(error.message, "error");
    hideLoading();
  }
}

function getCategoriaNombre(categoriaId) {
  return categoriesMap.get(categoriaId) || "Sin categoría";
}

function renderProductTable(products) {
  const tbody = document.querySelector("#productsTable tbody");
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px;">
            <i class="fas fa-box" style="font-size: 2rem; color: var(--color-gray);"></i>
            <p>No hay productos registrados</p>
        </td></tr>`;
    return;
  }

  tbody.innerHTML = products
    .map((product) => {
      const mainImage = product.getMainImage();
      const categoriaNombre = getCategoriaNombre(product.categoriaId);
      return `
            <tr data-id="${product.id}">
                <td data-label="Imagen">
                    ${
                      mainImage
                        ? `<img src="${mainImage}" alt="${product.nombre}" class="orien-table-image">`
                        : `<div class="orien-table-image-placeholder"><i class="fas fa-image"></i></div>`
                    }
                </td>
                <td data-label="Producto">
                    <strong>${product.nombre}</strong>
                    <div class="orien-table-subtitle">${categoriaNombre}</div>
                </td>
                <td data-label="Características">
                    <div class="orien-table-subtitle">${product.caracteristicas.substring(0, 100)}${product.caracteristicas.length > 100 ? "..." : ""}</div>
                </td>
                <td data-label="Precio">
                    <span class="orien-table-price">${product.getPrecioFormateado()}</span>
                </td>
                <td data-label="Acciones">
                    <div class="orien-table-actions">
                        <a href="/productsEdit/${product.id}" class="orien-btn orien-btn-sm orien-btn-outline" data-link>
                            <i class="fas fa-edit"></i>
                        </a>
                        <button class="orien-btn orien-btn-sm orien-btn-outline delete-product" data-id="${product.id}" style="color:#dc3545; border-color:#dc3545;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    })
    .join("");

  document.querySelectorAll(".delete-product").forEach((btn) => {
    btn.removeEventListener("click", handleDeleteClick);
    btn.addEventListener("click", handleDeleteClick);
  });
}

async function handleDeleteClick(e) {
  e.stopPropagation();
  const id = e.currentTarget.dataset.id;
  await deleteProduct(id);
}

async function deleteProduct(id) {
  if (!confirm("¿Está seguro de que desea eliminar este producto?")) return;
  try {
    showLoading();
    await productService.deleteProduct(id);
    showNotification("Producto eliminado exitosamente", "success");
    await loadProducts();
  } catch (error) {
    showNotification(error.message, "error");
  } finally {
    hideLoading();
  }
}

function updateProductCount(count) {
  const countElement = document.getElementById("productsCount");
  if (countElement) countElement.textContent = `${count} productos registrados`;
}

function bindEvents() {
  const searchInput = document.getElementById("searchProducts");
  if (searchInput)
    searchInput.addEventListener("input", () => filterProducts());
}

async function filterProducts() {
  const searchTerm = document.getElementById("searchProducts")?.value || "";
  try {
    showLoading();
    const filtered = await productService.searchProducts(searchTerm);
    renderProductTable(filtered);
    updateProductCount(filtered.length);
    hideLoading();
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}
