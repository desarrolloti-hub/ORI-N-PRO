import { ProductService } from "/src/services/productService.js";
import { CategoryService } from "/src/services/categoryService.js";

let productService = null;
let categoryService = null;
let currentProduct = null;
let allCategories = [];

export async function initProductDetailController() {
  productService = new ProductService();
  categoryService = new CategoryService();

  const path = window.location.pathname;
  const id = path.split("/").pop();

  if (!id) {
    showErrorAndRedirect();
    return;
  }

  await loadCategories();
  await loadProduct(id);
  bindEvents();
}

async function loadCategories() {
  try {
    allCategories = await categoryService.getAllCategories(true);
  } catch (error) {
    console.error("Error cargando categorías:", error);
  }
}

async function loadProduct(id) {
  try {
    showLoading();
    currentProduct = await productService.getProductById(id);
    if (!currentProduct) {
      showErrorAndRedirect();
      return;
    }
    // Incrementar contador de vistas
    await productService.incrementProductVistas(id);
    renderProductDetails();
    hideLoading();
  } catch (error) {
    console.error("Error cargando producto:", error);
    showNotification(error.message, "error");
    hideLoading();
  }
}

function renderProductDetails() {
  document.getElementById("productDetailTitle").textContent =
    currentProduct.nombre;
  document.getElementById("productName").textContent = currentProduct.nombre;

  const precioFormateado = currentProduct.getPrecioFormateado();
  document.getElementById("productPrice").textContent =
    precioFormateado || "Consultar precio";

  const tipoTexto = currentProduct.getTipoTexto();
  const tipoClass = currentProduct.tipo === "venta" ? "sale" : "rental";
  document.getElementById("productType").innerHTML =
    `<span class="orien-badge orien-badge-${tipoClass}">${tipoTexto}</span>`;

  const categoria = allCategories.find(
    (c) => c.id === currentProduct.categoriaId,
  );
  const categoriaNombre = categoria ? categoria.nombre : "Sin categoría";
  document.getElementById("productCategory").innerHTML =
    `<span class="orien-badge orien-badge-outline">${categoriaNombre}</span>`;

  document.getElementById("productDescription").textContent =
    currentProduct.caracteristicas;

  renderCarousel();
}

function renderCarousel() {
  const mainImage = document.getElementById("carouselMainImage");
  const thumbnailsContainer = document.getElementById("carouselThumbnails");
  const prevBtn = document.getElementById("carouselPrev");
  const nextBtn = document.getElementById("carouselNext");

  const imagenes = currentProduct.imagenes || [];

  if (imagenes.length === 0) {
    mainImage.src = "/assets/images/placeholder.png";
    thumbnailsContainer.innerHTML = "";
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
    return;
  }

  let currentIndex = 0;
  mainImage.src = imagenes[0];

  thumbnailsContainer.innerHTML = imagenes
    .map(
      (img, idx) => `
    <div class="orien-carousel-thumb ${idx === 0 ? "active" : ""}" data-index="${idx}">
      <img src="${img}" alt="Miniatura ${idx + 1}">
    </div>
  `,
    )
    .join("");

  document.querySelectorAll(".orien-carousel-thumb").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const index = parseInt(thumb.dataset.index);
      setActiveImage(index);
    });
  });

  const setActiveImage = (index) => {
    currentIndex = index;
    mainImage.src = imagenes[currentIndex];
    document.querySelectorAll(".orien-carousel-thumb").forEach((thumb, i) => {
      thumb.classList.toggle("active", i === currentIndex);
    });
  };

  prevBtn.addEventListener("click", () => {
    const newIndex = (currentIndex - 1 + imagenes.length) % imagenes.length;
    setActiveImage(newIndex);
  });

  nextBtn.addEventListener("click", () => {
    const newIndex = (currentIndex + 1) % imagenes.length;
    setActiveImage(newIndex);
  });

  if (imagenes.length <= 1) {
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
  }
}

function bindEvents() {
  const whatsappBtn = document.getElementById("whatsappBtn");
  if (whatsappBtn && currentProduct) {
    whatsappBtn.addEventListener("click", async () => {
      // Incrementar cotizaciones
      await productService.incrementProductCotizaciones(currentProduct.id);
      const categoria = allCategories.find(
        (c) => c.id === currentProduct.categoriaId,
      );
      const categoriaNombre = categoria ? categoria.nombre : "Producto";
      sendToWhatsApp(currentProduct, categoriaNombre);
    });
  }
}

function sendToWhatsApp(product, categoriaNombre) {
  const phone = "5215551391533";
  const precio = product.getPrecioFormateado();
  const productUrl = window.location.href;
  const msg = `*Solicitud de cotización - Orién Pro*

*Producto:* ${product.nombre}
*Tipo:* ${product.getTipoTexto()}
*Precio:* ${precio || "Consultar"}
*Categoría:* ${categoriaNombre}

*Características:*
${product.caracteristicas.substring(0, 500)}${product.caracteristicas.length > 500 ? "..." : ""}

*Enlace del producto:* ${productUrl}

---
¡Hola! Me gustaría recibir más información sobre este producto.`;
  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
    "_blank",
  );
}

function showErrorAndRedirect() {
  showNotification("Producto no encontrado", "error");
  setTimeout(() => {
    window.location.href = "/products";
  }, 1500);
}

function showLoading() {
  let loader = document.querySelector(".orien-page-loader");
  if (!loader) {
    loader = document.createElement("div");
    loader.className = "orien-page-loader";
    loader.innerHTML = '<div class="orien-spinner"></div>';
    document.body.appendChild(loader);
  }
  loader.classList.remove("hidden");
}

function hideLoading() {
  const loader = document.querySelector(".orien-page-loader");
  if (loader) loader.classList.add("hidden");
}

function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `orien-notification orien-notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${type === "success" ? "#28a745" : "#dc3545"};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-size: 0.85rem;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}
