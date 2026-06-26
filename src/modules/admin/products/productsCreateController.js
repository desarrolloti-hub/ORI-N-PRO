/* ========================================
   PRODUCTS CREATE CONTROLLER - Orién Pro
   Con compresión agresiva de imágenes (50KB)
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

const LIMITS = {
  nombre: 80,
  caracteristicas: 500,
  precio: 12, // dígitos
  maxImages: 10,
  maxImageSizeKB: 50, // COMPRESIÓN A 50KB
};

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

/**
 * Comprime una imagen agresivamente a ~50KB (misma función que en carruseles)
 */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const MAX_DIMENSION = 800;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.85;
        let result = canvas.toDataURL("image/jpeg", quality);

        let attempts = 0;
        while (
          result.length > LIMITS.maxImageSizeKB * 1024 &&
          quality > 0.1 &&
          attempts < 20
        ) {
          quality -= 0.05;
          result = canvas.toDataURL("image/jpeg", quality);
          attempts++;
        }

        if (result.length > LIMITS.maxImageSizeKB * 1024) {
          const canvas2 = document.createElement("canvas");
          canvas2.width = Math.round(width * 0.5);
          canvas2.height = Math.round(height * 0.5);
          const ctx2 = canvas2.getContext("2d");
          ctx2.drawImage(canvas, 0, 0, canvas2.width, canvas2.height);
          result = canvas2.toDataURL("image/jpeg", 0.5);
        }

        resolve(result);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

async function handleFiles(files) {
  const remainingSlots = LIMITS.maxImages - currentImagenes.length;
  const filesToProcess = files.slice(0, remainingSlots);
  if (files.length > remainingSlots) {
    showNotification(
      `Solo se pueden agregar ${remainingSlots} imágenes más. Máximo ${LIMITS.maxImages}.`,
      "warning",
    );
  }

  for (const file of filesToProcess) {
    if (!file.type.match("image.*")) continue;
    try {
      const compressedImage = await compressImage(file);
      const sizeKB = Math.round(compressedImage.length / 1024);
      if (sizeKB > LIMITS.maxImageSizeKB) {
        showNotification(
          `Imagen comprimida a ${sizeKB}KB (recomendado < ${LIMITS.maxImageSizeKB}KB)`,
          "warning",
        );
      }
      currentImagenes.push(compressedImage);
    } catch (error) {
      console.error("Error comprimiendo imagen:", error);
      showNotification("Error al procesar la imagen", "error");
    }
  }
  renderImagePreview();
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

  const nombre = formData.get("nombre")?.trim() || "";
  const caracteristicas = formData.get("caracteristicas")?.trim() || "";
  let precioRaw = formData.get("precio")?.trim() || "";

  // Validaciones de longitud
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
  const categoriaId = document.getElementById("categoriaSelect")?.value || "";

  const productData = {
    nombre: nombre,
    caracteristicas: caracteristicas,
    precio: precioFormateado,
    tipo: formData.get("tipo"),
    categoriaId: categoriaId,
  };

  if (!categoriaId) {
    showNotification("Seleccione una categoría", "error");
    return;
  }
  if (currentImagenes.length === 0) {
    showNotification("Debe subir al menos una imagen", "error");
    return;
  }

  // Verificar tamaño total de imágenes (límite 850 KB)
  const totalSize = currentImagenes.reduce((sum, img) => sum + img.length, 0);
  if (totalSize > 850 * 1024) {
    showNotification(
      `El tamaño total de las imágenes (${Math.round(totalSize / 1024)} KB) excede el límite de 850 KB. Por favor, reduce la cantidad de imágenes o comprime más.`,
      "error",
    );
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
