/* ========================================
   PRODUCTS CREATE CONTROLLER - Orién Pro
   ======================================== */

import { ProductService } from "/src/services/productService.js";
import { CategoryService } from "/src/services/categoryService.js";
import { Product } from "/src/classes/Product.js";
import {
  showLoading,
  hideLoading,
  showNotification,
} from "/src/modules/utils/uiHelpers.js";

let productService = null;
let categoryService = null;
let initialized = false;
let currentImagenes = [];

export function initProductsCreateController() {
  if (initialized) return;
  initialized = true;
  productService = new ProductService();
  categoryService = new CategoryService();
  loadCategories();
  bindFormSubmit();
  bindImageUpload();
  bindPasteImage();
  console.log("✅ Products Create Controller inicializado");
}

async function loadCategories() {
  try {
    const categories = await categoryService.getAllCategories(true);
    const select = document.getElementById("categoriaSelect");
    if (select && categories.length) {
      select.innerHTML =
        '<option value="">Seleccionar categoría</option>' +
        categories
          .map((cat) => `<option value="${cat.id}">${cat.nombre}</option>`)
          .join("");
    }
  } catch (error) {
    console.error("Error cargando categorías:", error);
  }
}

export function destroyProductsCreateController() {
  const form = document.getElementById("productForm");
  if (form) form.removeEventListener("submit", handleSubmit);
  initialized = false;
  productService = null;
  currentImagenes = [];
}

function bindFormSubmit() {
  const form = document.getElementById("productForm");
  if (!form) return;
  form.removeEventListener("submit", handleSubmit);
  form.addEventListener("submit", handleSubmit);
}

function bindPasteImage() {
  document.addEventListener("paste", (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        handleFiles([file]);
        showNotification("Imagen pegada correctamente", "success");
        break;
      }
    }
  });
}

function bindImageUpload() {
  const uploadArea = document.getElementById("imageUpload");
  const fileInput = uploadArea?.querySelector('input[type="file"]');
  const previewContainer = document.getElementById("imagePreview");
  if (!uploadArea || !fileInput) return;

  uploadArea.addEventListener("click", () => fileInput.click());
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
  });
  uploadArea.addEventListener("dragleave", () =>
    uploadArea.classList.remove("dragover"),
  );
  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
    handleFiles(Array.from(e.dataTransfer.files));
  });
  fileInput.addEventListener("change", (e) => {
    handleFiles(Array.from(e.target.files));
    fileInput.value = "";
  });
  previewContainer.addEventListener("click", (e) => {
    const removeBtn = e.target.closest(".orien-image-remove");
    if (removeBtn) {
      const index = parseInt(removeBtn.dataset.index);
      removeImage(index);
    }
  });
}

function handleFiles(files) {
  const remainingSlots = 10 - currentImagenes.length;
  const filesToProcess = files.slice(0, remainingSlots);
  if (files.length > remainingSlots) {
    showNotification(
      `Solo se pueden agregar ${remainingSlots} imágenes más. Máximo 10.`,
      "warning",
    );
  }
  filesToProcess.forEach((file) => {
    if (!file.type.match("image.*")) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      currentImagenes.push(event.target.result);
      renderImagePreview();
    };
    reader.readAsDataURL(file);
  });
}

function removeImage(index) {
  currentImagenes.splice(index, 1);
  renderImagePreview();
}

function renderImagePreview() {
  const previewContainer = document.getElementById("imagePreview");
  if (!previewContainer) return;
  if (currentImagenes.length === 0) {
    previewContainer.innerHTML =
      '<p class="orien-no-images">No hay imágenes seleccionadas</p>';
    return;
  }
  previewContainer.innerHTML = currentImagenes
    .map(
      (img, index) => `
        <div class="orien-image-preview-item">
            <img src="${img}" alt="Preview ${index + 1}">
            <button type="button" class="orien-image-remove" data-index="${index}" aria-label="Remove image">&times;</button>
        </div>
    `,
    )
    .join("");
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  let precioRaw = formData.get("precio");
  const precioLimpio = Product.limpiarPrecio(precioRaw);
  const precioFormateado = precioLimpio
    ? `$${parseInt(precioLimpio).toLocaleString("es-MX")} MXN`
    : "";
  const categoriaId = document.getElementById("categoriaSelect")?.value || "";
  const productData = {
    nombre: formData.get("nombre"),
    caracteristicas: formData.get("caracteristicas"),
    precio: precioFormateado,
    tipo: formData.get("tipo"),
    categoriaId: categoriaId,
  };
  if (!categoriaId) {
    showNotification("Seleccione una categoría", "error");
    return;
  }
  try {
    showLoading();
    await productService.createProduct(productData, currentImagenes);
    showNotification("Producto creado exitosamente", "success");
    setTimeout(() => (window.location.href = "/productsList"), 1500);
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}
