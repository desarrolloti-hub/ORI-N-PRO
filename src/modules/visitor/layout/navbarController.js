/* ========================================
   NAVBAR CONTROLLER - Orién Pro
   Controlador del layout persistente navbar
   ======================================== */

import { CategoryService } from "/src/services/categoryService.js";

let state = {
  isMenuOpen: false,
  isScrolled: false,
};

let elements = {};

export async function initNavbarController() {
  cacheElements();
  if (!elements.navbar) {
    console.warn("⚠️ Navbar no encontrado en el DOM");
    return null;
  }
  bindEvents();
  setActiveLink();
  handleScroll();
  await loadCategoriesToDropdown();
  console.log("✅ Navbar Controller - Orién Pro inicializado");
  return {
    closeMenu,
    setActiveLink,
    getState,
  };
}

function cacheElements() {
  elements = {
    navbar: document.querySelector(".orien-navbar"),
    hamburger: document.querySelector(".orien-hamburger"),
    closeBtn: document.querySelector(".orien-close"),
    menu: document.querySelector(".orien-menu"),
    menuLinks: document.querySelectorAll(".orien-menu li a"),
    body: document.body,
  };
}

function bindEvents() {
  if (elements.hamburger) {
    elements.hamburger.addEventListener("click", openMenu);
  }
  if (elements.closeBtn) {
    elements.closeBtn.addEventListener("click", closeMenu);
  }
  window.addEventListener("scroll", handleScroll);
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("resize", handleResize);
  document.addEventListener("route:changed", () => {
    setActiveLink();
    closeMenu();
  });
  if (elements.menu) {
    elements.menu.addEventListener("click", handleLinkClick);
  }
  const dropdowns = document.querySelectorAll(".orien-dropdown");
  dropdowns.forEach((dropdown) => {
    const link = dropdown.querySelector("a");
    if (link) {
      link.addEventListener("click", (e) => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          dropdown.classList.toggle("active");
        }
      });
    }
  });
}

function openMenu() {
  if (!elements.menu) return;
  elements.menu.classList.add("active");
  elements.body.classList.add("menu-open");
  elements.body.style.overflow = "hidden";
  state.isMenuOpen = true;
  if (elements.closeBtn) elements.closeBtn.style.display = "block";
  if (elements.hamburger) elements.hamburger.style.display = "none";
}

function closeMenu() {
  if (!elements.menu) return;
  elements.menu.classList.remove("active");
  elements.body.classList.remove("menu-open");
  elements.body.style.overflow = "";
  state.isMenuOpen = false;
  if (elements.closeBtn) elements.closeBtn.style.display = "none";
  if (elements.hamburger) elements.hamburger.style.display = "block";
}

function handleScroll() {
  if (!elements.navbar) return;
  const scrolled = window.scrollY > 50;
  if (scrolled !== state.isScrolled) {
    state.isScrolled = scrolled;
    if (scrolled) {
      elements.navbar.classList.add("orien-navbar-scrolled");
    } else {
      elements.navbar.classList.remove("orien-navbar-scrolled");
    }
  }
}

function handleClickOutside(event) {
  if (!state.isMenuOpen) return;
  const isClickInsideMenu = elements.menu?.contains(event.target);
  const isClickOnHamburger = elements.hamburger?.contains(event.target);
  if (!isClickInsideMenu && !isClickOnHamburger) {
    closeMenu();
  }
}

function handleResize() {
  if (window.innerWidth > 768 && state.isMenuOpen) {
    closeMenu();
  }
}

function handleLinkClick(e) {
  const link = e.target.closest("a");
  if (link && link.getAttribute("href")) {
    const href = link.getAttribute("href");
    if (href && !href.startsWith("http") && href !== "#") {
      e.preventDefault();
      addLoadingEffect(link);
      if (typeof window.navigateTo === "function") {
        window.navigateTo(href);
      } else {
        window.location.href = href;
      }
      closeMenu();
    }
  }
}

function setActiveLink() {
  if (!elements.menuLinks || elements.menuLinks.length === 0) return;
  const currentPath = window.location.pathname;
  const currentHash = window.location.hash;
  elements.menuLinks.forEach((link) => {
    const linkPath = link.getAttribute("href");
    if (!linkPath || linkPath === "#") return;
    link.classList.remove("active");
    if (linkPath.startsWith("#")) {
      if (currentHash === linkPath) link.classList.add("active");
    } else {
      if (currentPath === linkPath) {
        link.classList.add("active");
      } else if (linkPath !== "/" && currentPath.startsWith(linkPath)) {
        link.classList.add("active");
      } else if (currentPath === "/" && linkPath === "/") {
        link.classList.add("active");
      }
    }
  });
}

function addLoadingEffect(link) {
  link.classList.add("loading");
  setTimeout(() => link.classList.remove("loading"), 500);
}

function getState() {
  return { ...state };
}

async function loadCategoriesToDropdown() {
  const dropdownContent = document.getElementById("navbarDropdownContent");
  if (!dropdownContent) return;
  try {
    const categoryService = new CategoryService();
    const categories = await categoryService.getAllCategories(true);
    // Eliminar enlaces de categorías previos
    const categoryLinks = dropdownContent.querySelectorAll("a[data-category]");
    categoryLinks.forEach((link) => link.remove());
    categories.forEach((cat) => {
      const link = document.createElement("a");
      link.href = `/products?categoria=${cat.id}`;
      link.setAttribute("data-link", "");
      link.setAttribute("data-category", cat.id);
      link.textContent = cat.nombre;
      dropdownContent.appendChild(link);
    });
  } catch (error) {
    console.error("Error cargando categorías en navbar:", error);
  }
}
