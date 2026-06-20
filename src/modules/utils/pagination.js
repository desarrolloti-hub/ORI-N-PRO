/* ========================================
   PAGINATION UTILS - Orién Pro
   Funciones reutilizables para paginación
   ======================================== */

/**
 * Inicializa la paginación en un contenedor
 * @param {string|HTMLElement} container - Contenedor o selector del contenedor de paginación
 * @param {Array} items - Lista completa de elementos
 * @param {number} itemsPerPage - Número de elementos por página
 * @param {Function} renderCallback - Función que recibe (pageItems, totalItems) y renderiza
 * @param {Object} options - Opciones adicionales
 * @param {number} options.currentPage - Página inicial (default 1)
 * @param {Function} options.onPageChange - Callback cuando cambia la página (recibe pageItems, currentPage)
 * @param {Function} options.onTotalUpdate - Callback para actualizar el total de elementos (recibe totalItems)
 * @returns {Object} Métodos para controlar la paginación
 */
export function initPagination(
  container,
  items,
  itemsPerPage,
  renderCallback,
  options = {},
) {
  const paginationContainer =
    typeof container === "string"
      ? document.querySelector(container)
      : container;

  if (!paginationContainer) {
    console.warn("⚠️ Contenedor de paginación no encontrado:", container);
    return null;
  }

  let totalItems = items.length;
  let totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  let currentPage = Math.min(options.currentPage || 1, totalPages);
  if (currentPage < 1) currentPage = 1;

  const onPageChange = options.onPageChange || null;
  const onTotalUpdate = options.onTotalUpdate || null;

  function render() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, totalItems);
    const pageItems = items.slice(start, end);

    // Llamar al callback de renderizado
    renderCallback(pageItems, totalItems);

    // Actualizar total si hay callback
    if (onTotalUpdate) {
      onTotalUpdate(totalItems);
    }

    // Renderizar controles de paginación
    renderPaginationControls(
      paginationContainer,
      currentPage,
      totalPages,
      (page) => {
        goToPage(page);
      },
    );

    if (onPageChange) {
      onPageChange(pageItems, currentPage);
    }
  }

  function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    currentPage = page;
    render();
  }

  function nextPage() {
    if (currentPage < totalPages) goToPage(currentPage + 1);
  }

  function prevPage() {
    if (currentPage > 1) goToPage(currentPage - 1);
  }

  function setItems(newItems, resetPage = true) {
    items = newItems;
    totalItems = items.length;
    totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    if (resetPage || currentPage > totalPages) {
      currentPage = 1;
    }
    render();
  }

  function getCurrentItems() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, totalItems);
    return items.slice(start, end);
  }

  function getState() {
    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
    };
  }

  // Render inicial
  render();

  return {
    goToPage,
    nextPage,
    prevPage,
    setItems,
    getCurrentItems,
    getState,
    render,
  };
}

/**
 * Renderiza los controles de paginación en el contenedor
 */
function renderPaginationControls(
  container,
  currentPage,
  totalPages,
  onPageChange,
) {
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";

  // Botón anterior
  html += `<button class="orien-pagination-item ${currentPage === 1 ? "disabled" : ""}" data-page="${currentPage - 1}">←</button>`;

  // Números de página (máximo 5 visibles)
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    html += `<button class="orien-pagination-item" data-page="1">1</button>`;
    if (startPage > 2) {
      html += `<span class="orien-pagination-ellipsis">…</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="orien-pagination-item ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<span class="orien-pagination-ellipsis">…</span>`;
    }
    html += `<button class="orien-pagination-item" data-page="${totalPages}">${totalPages}</button>`;
  }

  // Botón siguiente
  html += `<button class="orien-pagination-item ${currentPage === totalPages ? "disabled" : ""}" data-page="${currentPage + 1}">→</button>`;

  container.innerHTML = html;

  // Event listeners (delegación)
  container.querySelectorAll("[data-page]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const page = parseInt(btn.dataset.page);
      if (
        !isNaN(page) &&
        page >= 1 &&
        page <= totalPages &&
        page !== currentPage
      ) {
        onPageChange(page);
      }
    });
  });
}
