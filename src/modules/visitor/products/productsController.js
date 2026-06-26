/* ========================================
   PRODUCTS VISITOR CONTROLLER - Orién Pro
   ======================================== */

import { ProductService } from "/src/services/productService";
import { CategoryService } from "/src/services/categoryService";
import { initPagination } from "/src/modules/utils/pagination.js";

let productService = null;
let categoryService = null;
let allProducts = [];
let allCategories = [];
let currentSort = "default";
let pagination = null;

export function initProductsVisitorController() {
  productService = new ProductService();
  categoryService = new CategoryService();
  loadData();
  bindEvents();
}

async function loadData() {
  try {
    showLoading();
    // Leer parámetros de URL
    const params = new URLSearchParams(window.location.search);
    const urlCategory = params.get("categoria");
    const ofertaParam = params.get("oferta") === "true";

    allProducts = await productService.getAllProducts();
    allCategories = await categoryService.getAllCategories(true);

    let filtered = [...allProducts];
    if (urlCategory && urlCategory !== "all") {
      filtered = filtered.filter((p) => p.categoriaId === urlCategory);
    }
    if (ofertaParam) {
      filtered = filtered.filter((p) => p.enOferta === true);
    }

    // Inicializar paginación con 9 productos por página
    const container = document.getElementById("paginationControls");
    if (container) {
      pagination = initPagination(
        container,
        filtered,
        9,
        (pageItems, totalItems) => {
          renderProducts(pageItems);
          updateProductsCount(totalItems);
        },
        {
          onTotalUpdate: (total) => updateProductsCount(total),
        },
      );
    } else {
      // Si no hay contenedor, renderizar todo
      renderProducts(filtered);
      updateProductsCount(filtered.length);
    }

    renderCategoryFilters(urlCategory, ofertaParam);
    hideLoading();
  } catch (error) {
    console.error("Error cargando productos:", error);
    showNotification(error.message, "error");
    hideLoading();
  }
}

function renderCategoryFilters(activeCategory = null, ofertaActiva = false) {
  // Sidebar - categorías
  const categoriaGroup = Array.from(
    document.querySelectorAll(".orien-filter-group"),
  ).find(
    (group) =>
      group.querySelector(".orien-filter-title")?.innerText === "Categoría",
  );
  const sidebarContainer = categoriaGroup?.querySelector(
    ".orien-filter-options",
  );

  if (sidebarContainer) {
    if (allCategories.length === 0) {
      sidebarContainer.innerHTML =
        '<p class="orien-no-data">No hay categorías</p>';
    } else {
      sidebarContainer.innerHTML = allCategories
        .map(
          (cat) => `
        <label class="orien-filter-option">
          <input type="checkbox" value="${cat.id}" class="filter-category">
          ${cat.nombre}
        </label>
      `,
        )
        .join("");
    }
  }

  // Tabs superiores
  const tabsContainer = document.querySelector(".orien-category-tabs");
  if (tabsContainer) {
    tabsContainer.innerHTML = `
      <button class="orien-category-tab active" data-category="all">Todos</button>
      ${allCategories
        .map(
          (cat) => `
        <button class="orien-category-tab" data-category="${cat.id}">${cat.nombre}</button>
      `,
        )
        .join("")}
    `;
  }

  // Marcar tab activo según URL
  if (activeCategory) {
    const tab = document.querySelector(
      `.orien-category-tab[data-category="${activeCategory}"]`,
    );
    if (tab) {
      document
        .querySelectorAll(".orien-category-tab")
        .forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      document
        .querySelectorAll(".filter-category")
        .forEach((cb) => (cb.checked = false));
    }
  }

  // Marcar checkbox de oferta si viene activo
  const ofertaCheckbox = document.getElementById("filterOferta");
  if (ofertaCheckbox && ofertaActiva) {
    ofertaCheckbox.checked = true;
  }

  // Rebindear eventos
  document.querySelectorAll(".filter-category").forEach((cb) => {
    cb.removeEventListener("change", handleFilterChange);
    cb.addEventListener("change", handleFilterChange);
  });
  document.querySelectorAll(".orien-category-tab").forEach((tab) => {
    tab.removeEventListener("click", handleCategoryTabClick);
    tab.addEventListener("click", handleCategoryTabClick);
  });
}

function handleFilterChange() {
  filterProducts();
}

function handleCategoryTabClick(e) {
  const categoryId = e.currentTarget.dataset.category;
  document
    .querySelectorAll(".orien-category-tab")
    .forEach((t) => t.classList.remove("active"));
  e.currentTarget.classList.add("active");
  document
    .querySelectorAll(".filter-category")
    .forEach((cb) => (cb.checked = false));

  let filtered = [...allProducts];
  if (categoryId !== "all")
    filtered = filtered.filter((p) => p.categoriaId === categoryId);
  filtered = sortProducts(filtered, currentSort);

  if (pagination) {
    pagination.setItems(filtered);
  } else {
    renderProducts(filtered);
    updateProductsCount(filtered.length);
  }
  updateURL({ categoria: categoryId !== "all" ? categoryId : null });
}

function filterProducts() {
  const selectedCategories = Array.from(
    document.querySelectorAll(".filter-category:checked"),
  ).map((cb) => cb.value);
  const selectedTypes = Array.from(
    document.querySelectorAll(".filter-type:checked"),
  ).map((cb) => cb.value);
  const ofertaChecked =
    document.getElementById("filterOferta")?.checked || false;

  let filtered = [...allProducts];
  if (selectedCategories.length > 0) {
    filtered = filtered.filter((p) =>
      selectedCategories.includes(p.categoriaId),
    );
  }
  if (selectedTypes.length === 1) {
    filtered = filtered.filter((p) => p.tipo === selectedTypes[0]);
  }
  if (ofertaChecked) {
    filtered = filtered.filter((p) => p.enOferta === true);
  }
  filtered = sortProducts(filtered, currentSort);

  if (pagination) {
    pagination.setItems(filtered);
  } else {
    renderProducts(filtered);
    updateProductsCount(filtered.length);
  }

  // Sincronizar tabs con filtros
  const hasFilters =
    selectedCategories.length > 0 || selectedTypes.length > 0 || ofertaChecked;
  if (hasFilters) {
    document
      .querySelectorAll(".orien-category-tab")
      .forEach((t) => t.classList.remove("active"));
    const allTab = document.querySelector(
      '.orien-category-tab[data-category="all"]',
    );
    if (allTab) allTab.classList.add("active");
  }
  if (selectedCategories.length === 1) {
    updateURL({ categoria: selectedCategories[0] });
  } else if (selectedCategories.length === 0) {
    updateURL({ categoria: null });
  }
}

function updateURL(params) {
  const url = new URL(window.location.href);
  if (params.categoria) {
    url.searchParams.set("categoria", params.categoria);
  } else {
    url.searchParams.delete("categoria");
  }
  if (params.oferta !== undefined) {
    if (params.oferta) url.searchParams.set("oferta", "true");
    else url.searchParams.delete("oferta");
  }
  window.history.replaceState({}, "", url);
}

function sortProducts(products, sortType) {
  const sorted = [...products];
  switch (sortType) {
    case "name-asc":
      sorted.sort((a, b) => a.nombre.localeCompare(b.nombre));
      break;
    case "name-desc":
      sorted.sort((a, b) => b.nombre.localeCompare(a.nombre));
      break;
    case "price-asc":
      sorted.sort(
        (a, b) =>
          (parseInt(a.precio.replace(/[^0-9]/g, "")) || 0) -
          (parseInt(b.precio.replace(/[^0-9]/g, "")) || 0),
      );
      break;
    case "price-desc":
      sorted.sort(
        (a, b) =>
          (parseInt(b.precio.replace(/[^0-9]/g, "")) || 0) -
          (parseInt(a.precio.replace(/[^0-9]/g, "")) || 0),
      );
      break;
    case "destacados":
      sorted.sort((a, b) => {
        const scoreA = (a.vistas || 0) + (a.cotizaciones || 0) * 10;
        const scoreB = (b.vistas || 0) + (b.cotizaciones || 0) * 10;
        return scoreB - scoreA;
      });
      break;
    default:
      sorted.sort(
        (a, b) =>
          (b.fechaCreacion?.toMillis?.() || 0) -
          (a.fechaCreacion?.toMillis?.() || 0),
      );
      break;
  }
  return sorted;
}

function updateProductsCount(count) {
  const countEl = document.getElementById("productsCount");
  if (countEl) countEl.textContent = `Mostrando ${count} productos`;
}

function handleSortChange(e) {
  currentSort = e.currentTarget.value;
  filterProducts();
}

function handleClearFilters(e) {
  e.preventDefault();
  document
    .querySelectorAll(".filter-category, .filter-type")
    .forEach((cb) => (cb.checked = false));
  const ofertaCheckbox = document.getElementById("filterOferta");
  if (ofertaCheckbox) ofertaCheckbox.checked = false;
  const sortSelect = document.getElementById("sortProducts");
  if (sortSelect) {
    sortSelect.value = "default";
    currentSort = "default";
  }
  document
    .querySelectorAll(".orien-category-tab")
    .forEach((t) => t.classList.remove("active"));
  const allTab = document.querySelector(
    '.orien-category-tab[data-category="all"]',
  );
  if (allTab) allTab.classList.add("active");

  const filtered = sortProducts([...allProducts], currentSort);
  if (pagination) {
    pagination.setItems(filtered);
  } else {
    renderProducts(filtered);
    updateProductsCount(filtered.length);
  }
  updateURL({ categoria: null, oferta: false });
}

function handleViewDetail(e) {
  const id = e.currentTarget.dataset.id;
  window.location.href = `/productDetail/${id}`;
}

function renderProducts(products) {
  const container = document.getElementById("productsGrid");
  if (!container) return;
  if (products.length === 0) {
    container.innerHTML = `<div class="orien-products-empty"><i class="fas fa-box-open"></i><h3>No hay productos disponibles</h3><p>Pronto agregaremos nuevos productos a nuestro catálogo.</p></div>`;
    return;
  }
  container.innerHTML = products
    .map((product) => {
      const hasMultipleImages = product.imagenes && product.imagenes.length > 1;
      const categoria = allCategories.find((c) => c.id === product.categoriaId);
      const categoriaNombre = categoria ? categoria.nombre : "Producto";
      let imageHtml = "";
      if (hasMultipleImages) {
        const carouselId = `carousel-${product.id}`;
        imageHtml = `
          <div class="orien-card-image-container">
            <div class="orien-card-carousel" id="${carouselId}">
              <div class="orien-carousel-slides">
                ${product.imagenes
                  .map(
                    (img, idx) => `
                  <div class="orien-carousel-slide ${idx === 0 ? "active" : ""}" data-index="${idx}">
                    <img src="${img}" alt="${product.nombre}" loading="lazy">
                  </div>
                `,
                  )
                  .join("")}
              </div>
              <button class="orien-carousel-prev"><i class="fas fa-chevron-left"></i></button>
              <button class="orien-carousel-next"><i class="fas fa-chevron-right"></i></button>
              <div class="orien-carousel-dots">
                ${product.imagenes.map((_, idx) => `<span class="orien-carousel-dot ${idx === 0 ? "active" : ""}" data-index="${idx}"></span>`).join("")}
              </div>
            </div>
          </div>
        `;
      } else {
        imageHtml = `
          <div class="orien-card-image-container">
            <div class="orien-card-image-single">
              ${product.getMainImage() ? `<img src="${product.getMainImage()}" alt="${product.nombre}" loading="lazy">` : '<div class="orien-card-image-placeholder"><i class="fas fa-box"></i></div>'}
            </div>
          </div>
        `;
      }

      let precioHtml = "";
      if (product.enOferta && product.precioOferta) {
        const precioOriginal = product.getPrecioOriginalFormateado();
        const precioOferta = product.getPrecioFormateado();
        precioHtml = `<span class="orien-card-price old-price">${precioOriginal}</span> <span class="orien-card-price sale-price">${precioOferta}</span>`;
      } else {
        precioHtml = `<span class="orien-card-price">${product.getPrecioFormateado() || "Consultar precio"}</span>`;
      }

      return `
        <div class="orien-card" data-category="${product.categoriaId}" data-type="${product.tipo}" data-id="${product.id}">
          ${imageHtml}
          <div class="orien-card-badges">
            <span class="orien-card-badge orien-card-badge-left">${categoriaNombre}</span>
            <span class="orien-card-badge orien-card-badge-right ${product.tipo === "venta" ? "sale" : "rental"}">${product.getTipoTexto()}</span>
          </div>
          <div class="orien-card-content">
            <h3 class="orien-card-title">${product.nombre}</h3>
            <p class="orien-card-text">${product.caracteristicas.substring(0, 120)}${product.caracteristicas.length > 120 ? "..." : ""}</p>
            <div class="orien-card-footer">
              ${precioHtml}
              <button class="orien-btn orien-btn-sm orien-btn-outline btn-view-detail" data-id="${product.id}">Ver más</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  if (document.querySelectorAll(".orien-card-carousel").length)
    initAllCarousels();
  document.querySelectorAll(".btn-view-detail").forEach((btn) => {
    btn.removeEventListener("click", handleViewDetail);
    btn.addEventListener("click", handleViewDetail);
  });
}

function initAllCarousels() {
  document.querySelectorAll(".orien-card-carousel").forEach((carousel) => {
    let current = 0;
    const slides = carousel.querySelectorAll(".orien-carousel-slide");
    const dots = carousel.querySelectorAll(".orien-carousel-dot");
    const prev = carousel.querySelector(".orien-carousel-prev");
    const next = carousel.querySelector(".orien-carousel-next");
    if (!slides.length) return;
    const update = (index) => {
      slides.forEach((s, i) => s.classList.toggle("active", i === index));
      dots.forEach((d, i) => d.classList.toggle("active", i === index));
      current = index;
    };
    prev?.addEventListener("click", (e) => {
      e.stopPropagation();
      update((current - 1 + slides.length) % slides.length);
    });
    next?.addEventListener("click", (e) => {
      e.stopPropagation();
      update((current + 1) % slides.length);
    });
    dots.forEach((dot, idx) =>
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        update(idx);
      }),
    );
    let interval = setInterval(() => {
      if (!carousel.closest(".orien-card")?.matches(":hover"))
        update((current + 1) % slides.length);
    }, 5000);
    carousel.addEventListener("mouseenter", () => clearInterval(interval));
    carousel.addEventListener("mouseleave", () => {
      interval = setInterval(() => {
        if (!carousel.closest(".orien-card")?.matches(":hover"))
          update((current + 1) % slides.length);
      }, 5000);
    });
  });
}

function bindEvents() {
  const sortSelect = document.getElementById("sortProducts");
  if (sortSelect) {
    sortSelect.removeEventListener("change", handleSortChange);
    sortSelect.addEventListener("change", handleSortChange);
  }
  const clearFilters = document.getElementById("clearFilters");
  if (clearFilters) {
    clearFilters.removeEventListener("click", handleClearFilters);
    clearFilters.addEventListener("click", handleClearFilters);
  }
  document.querySelectorAll(".filter-type").forEach((cb) => {
    cb.removeEventListener("change", handleFilterChange);
    cb.addEventListener("change", handleFilterChange);
  });
  const ofertaCheckbox = document.getElementById("filterOferta");
  if (ofertaCheckbox) {
    ofertaCheckbox.addEventListener("change", handleFilterChange);
  }
}

function showLoading() {
  const container = document.getElementById("productsGrid");
  if (container)
    container.innerHTML = `<div class="orien-loading"><div class="orien-spinner"></div><p>Cargando productos...</p></div>`;
}
function hideLoading() {}
function showNotification(message, type) {
  const notif = document.createElement("div");
  notif.className = `orien-notification orien-notification-${type}`;
  notif.textContent = message;
  notif.style.cssText = `position:fixed;bottom:20px;right:20px;background:${type === "success" ? "#28a745" : "#dc3545"};color:white;padding:12px 20px;border-radius:8px;z-index:10000;font-size:0.85rem;box-shadow:0 2px 10px rgba(0,0,0,0.2);`;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}
