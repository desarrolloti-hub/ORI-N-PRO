/* ========================================
   PRODUCTS EDIT CONTROLLER - Orién Pro
   Con límite de caracteres
   ======================================== */

import { ProductService } from "/src/services/productService.js";
import { CategoryService } from "/src/services/categoryService.js";
import { Product } from "/src/classes/Product.js";
import {
  showLoading,
  hideLoading,
  showNotification,
} from "/src/modules/utils/uiHelpers";

let productService = null;
let categoryService = null;
let currentProductId = null;
let initialized = false;
let currentImagenes = [];

const LIMITS = {
  nombre: 80,
  caracteristicas: 500,
  precio: 12,
};

export function initProductsEditController(id) {
  if (initialized && currentProductId === id) return;
  initialized = true;
  currentProductId = id;
  productService = new ProductService();
  categoryService = new CategoryService();
  loadCategories();
  loadProductData();
  bindFormSubmit();
  bindImageUpload();
  bindPasteImage();
  bindDeleteButton();
  bindOfertaCheckbox();
  console.log("✅ Products Edit Controller inicializado para id:", id);
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

function bindOfertaCheckbox() {
  const checkbox = document.getElementById("enOfertaCheckbox");
  const precioOfertaGroup = document.getElementById("precioOfertaGroup");
  if (checkbox) {
    checkbox.addEventListener("change", (e) => {
      if (precioOfertaGroup)
        precioOfertaGroup.style.display = e.target.checked ? "block" : "none";
    });
  }
}

export function destroyProductsEditController() {
  const form = document.getElementById("productForm");
  if (form) form.removeEventListener("submit", handleSubmit);
  const deleteBtn = document.getElementById("deleteBtn");
  if (deleteBtn) deleteBtn.removeEventListener("click", handleDelete);
  initialized = false;
  currentProductId = null;
  productService = null;
  currentImagenes = [];
}

function bindPasteImage() {
  document.addEventListener("paste", (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        handleNewFiles([file]);
        showNotification("Imagen pegada correctamente", "success");
        break;
      }
    }
  });
}

async function loadProductData() {
  try {
    showLoading();
    const product = await productService.getProductById(currentProductId);
    if (!product) {
      showNotification("Producto no encontrado", "error");
      setTimeout(() => (window.location.href = "/productsList"), 1500);
      return;
    }
    currentImagenes = [...(product.imagenes || [])];
    populateForm(product);
    renderImagePreview();
    hideLoading();
  } catch (error) {
    console.error("Error cargando producto:", error);
    showNotification(error.message, "error");
    hideLoading();
  }
}

function populateForm(product) {
  const nombreInput = document.querySelector('input[name="nombre"]');
  const caracteristicasTextarea = document.querySelector(
    'textarea[name="caracteristicas"]',
  );
  const precioInput = document.querySelector('input[name="precio"]');
  const precioOfertaInput = document.querySelector(
    'input[name="precioOferta"]',
  );
  const idSpan = document.getElementById("productId");
  const categoriaSelect = document.getElementById("categoriaSelect");
  const tipoRadios = document.querySelectorAll('input[name="tipo"]');
  const ofertaCheckbox = document.getElementById("enOfertaCheckbox");
  const precioOfertaGroup = document.getElementById("precioOfertaGroup");

  if (nombreInput) {
    nombreInput.value = product.nombre;
    nombreInput.maxLength = LIMITS.nombre;
  }
  if (caracteristicasTextarea) {
    caracteristicasTextarea.value = product.caracteristicas;
    caracteristicasTextarea.maxLength = LIMITS.caracteristicas;
  }
  const precioNumeros = product.precio?.replace(/[^0-9]/g, "") || "";
  if (precioInput) {
    precioInput.value = precioNumeros;
    precioInput.maxLength = LIMITS.precio;
  }
  if (precioOfertaInput && product.precioOferta) {
    const precioOfertaNumeros = product.precioOferta.replace(/[^0-9]/g, "");
    precioOfertaInput.value = precioOfertaNumeros;
    precioOfertaInput.maxLength = LIMITS.precio;
  }
  if (idSpan) idSpan.textContent = `ID: ${product.id.substring(0, 8)}...`;
  if (categoriaSelect && product.categoriaId)
    categoriaSelect.value = product.categoriaId;
  tipoRadios.forEach((radio) => {
    if (radio.value === product.tipo) radio.checked = true;
  });
  if (ofertaCheckbox && product.enOferta) {
    ofertaCheckbox.checked = true;
    if (precioOfertaGroup) precioOfertaGroup.style.display = "block";
  }
}

function renderImagePreview() {
  const gallery = document.getElementById("imageGallery");
  if (!gallery) return;
  if (currentImagenes.length === 0) {
    gallery.innerHTML =
      '<p class="orien-no-images">No hay imágenes subidas</p>';
    return;
  }
  gallery.innerHTML = currentImagenes
    .map(
      (img, index) => `
        <div class="orien-image-item">
            <img src="${img}" alt="Imagen ${index + 1}">
            <button type="button" class="orien-image-remove" data-index="${index}" aria-label="Remove image">&times;</button>
        </div>
    `,
    )
    .join("");
}

function bindImageUpload() {
  const uploadArea = document.getElementById("imageUpload");
  const fileInput = uploadArea?.querySelector('input[type="file"]');
  const gallery = document.getElementById("imageGallery");
  if (!uploadArea || !fileInput) return;
  uploadArea.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    handleNewFiles(files);
    fileInput.value = "";
  });
  if (gallery) {
    gallery.addEventListener("click", (e) => {
      const removeBtn = e.target.closest(".orien-image-remove");
      if (removeBtn) {
        const index = parseInt(removeBtn.dataset.index);
        removeImage(index);
      }
    });
  }
}

function handleNewFiles(files) {
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

function bindFormSubmit() {
  const form = document.getElementById("productForm");
  if (!form) return;
  form.removeEventListener("submit", handleSubmit);
  form.addEventListener("submit", handleSubmit);
}

function bindDeleteButton() {
  const deleteBtn = document.getElementById("deleteBtn");
  if (deleteBtn) {
    deleteBtn.removeEventListener("click", handleDelete);
    deleteBtn.addEventListener("click", handleDelete);
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  const nombre = formData.get("nombre")?.trim() || "";
  const caracteristicas = formData.get("caracteristicas")?.trim() || "";
  let precioRaw = formData.get("precio")?.trim() || "";

  // Validaciones
  if (nombre.length === 0) {
    showNotification("El nombre del producto es obligatorio", "error");
    return;
  }
  if (nombre.length > LIMITS.nombre) {
    showNotification(
      `El nombre no puede exceder ${LIMITS.nombre} caracteres`,
      "error",
    );
    return;
  }
  if (caracteristicas.length === 0) {
    showNotification("Las características son obligatorias", "error");
    return;
  }
  if (caracteristicas.length > LIMITS.caracteristicas) {
    showNotification(
      `Las características no pueden exceder ${LIMITS.caracteristicas} caracteres`,
      "error",
    );
    return;
  }
  if (caracteristicas.length < 10) {
    showNotification(
      "Las características deben tener al menos 10 caracteres",
      "error",
    );
    return;
  }
  if (precioRaw.length > LIMITS.precio) {
    showNotification(
      `El precio no puede tener más de ${LIMITS.precio} dígitos`,
      "error",
    );
    return;
  }
  if (!/^\d+$/.test(precioRaw)) {
    showNotification("El precio solo debe contener números", "error");
    return;
  }

  const precioLimpio = Product.limpiarPrecio(precioRaw);
  const precioFormateado = precioLimpio
    ? `$${parseInt(precioLimpio).toLocaleString("es-MX")} MXN`
    : "";

  let precioOfertaFormateado = "";
  const enOferta = formData.get("enOferta") === "on";
  if (enOferta) {
    const precioOfertaRaw = formData.get("precioOferta")?.trim() || "";
    if (precioOfertaRaw.length > LIMITS.precio) {
      showNotification(
        `El precio de oferta no puede tener más de ${LIMITS.precio} dígitos`,
        "error",
      );
      return;
    }
    if (precioOfertaRaw && !/^\d+$/.test(precioOfertaRaw)) {
      showNotification(
        "El precio de oferta solo debe contener números",
        "error",
      );
      return;
    }
    const precioOfertaLimpio = Product.limpiarPrecio(precioOfertaRaw);
    if (precioOfertaLimpio) {
      precioOfertaFormateado = `$${parseInt(precioOfertaLimpio).toLocaleString("es-MX")} MXN`;
    }
  }

  const categoriaId = document.getElementById("categoriaSelect")?.value || "";
  const productData = {
    nombre: nombre,
    caracteristicas: caracteristicas,
    precio: precioFormateado,
    precioOferta: precioOfertaFormateado,
    enOferta: enOferta,
    tipo: formData.get("tipo"),
    categoriaId: categoriaId,
  };

  if (!categoriaId) {
    showNotification("Seleccione una categoría", "error");
    return;
  }
  if (currentImagenes.length === 0) {
    showNotification("Debe tener al menos una imagen", "error");
    return;
  }

  try {
    showLoading();
    await productService.updateProduct(
      currentProductId,
      productData,
      currentImagenes,
    );
    showNotification("Producto actualizado exitosamente", "success");
    setTimeout(() => (window.location.href = "/productsList"), 1500);
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}

async function handleDelete() {
  if (!confirm("¿Está seguro de que desea eliminar este producto?")) return;
  try {
    showLoading();
    await productService.deleteProduct(currentProductId);
    showNotification("Producto eliminado exitosamente", "success");
    setTimeout(() => (window.location.href = "/productsList"), 1500);
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}
