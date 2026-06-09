/* ==========================================
   SERVICES CONTROLLER - ORIÉN PRO (FINAL)
   Título centrado, videos responsive, carrusel sin botones
========================================== */

import { ServiceService } from "/src/services/serviceService.js";

let serviceService = null;

export async function initServicesController() {
  try {
    serviceService = new ServiceService();
    initHeroScroll();
    initRevealObserver();
    await loadServices();
  } catch (error) {
    console.error(error);
  }
}

async function loadServices() {
  try {
    showLoading();
    const services = await serviceService.getAllServices(true);
    renderServices(services);
    hideLoading();
    observeServiceCards();
    fixAllMedia(); // garantiza tamaño correcto
  } catch (error) {
    console.error(error);
    showNotification(error.message || "Error al cargar servicios", "error");
    hideLoading();
  }
}

function renderServices(services) {
  const container = document.getElementById("servicesContainer");
  if (!container) return;

  if (!services.length) {
    container.innerHTML = `
      <div class="orien-empty-state">
        <i class="fas fa-crown"></i>
        <h3>Próximamente</h3>
        <p>Nuevas experiencias premium estarán disponibles pronto.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = services
    .map((service, idx) => {
      const layoutClass = service.alternar ? "orien-service-alternate" : "";
      const embedUrl = getEmbedUrl(service.youtubeUrl);
      const serviceTitle = escapeHtml(service.titulo);

      const videoHtml = embedUrl
        ? `
          <div class="orien-service-media">
            <div class="orien-video-wrapper">
              <iframe src="${embedUrl}" title="${serviceTitle}" loading="lazy" allowfullscreen></iframe>
            </div>
          </div>
        `
        : `
          <div class="orien-service-media">
            <div class="orien-video-wrapper">
              <div style="display:flex;align-items:center;justify-content:center;height:100%;min-height:250px;background:var(--color-dark);color:var(--color-gray);">
                Video no disponible
              </div>
            </div>
          </div>
        `;

      const contentHtml =
        service.carouselEnabled && service.carouselItems?.length
          ? renderCarousel(service.carouselItems)
          : `<div class="orien-service-description">${escapeHtml(service.descripcion)}</div>`;

      return `
        <article class="orien-service-item ${layoutClass}">
          <div class="orien-service-content">
            <h3 class="orien-service-title">${serviceTitle}</h3>
            ${contentHtml}
          </div>
          ${videoHtml}
        </article>
      `;
    })
    .join("");

  initCleanCarousels();
}

function renderCarousel(items) {
  return `
    <div class="orien-carousel" data-carousel-auto>
      <div class="orien-carousel-inner">
        ${items
          .map(
            (item, index) => `
              <div class="orien-carousel-slide ${index === 0 ? "active" : ""}">
                <img src="${item.imageBase64}" alt="slide ${index + 1}" loading="lazy" />
                ${item.caption ? `<div class="orien-carousel-caption">${escapeHtml(item.caption)}</div>` : ""}
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function initCleanCarousels() {
  const carousels = document.querySelectorAll(".orien-carousel");
  carousels.forEach(initAutoCarousel);
}

function initAutoCarousel(carousel) {
  const slides = carousel.querySelectorAll(".orien-carousel-slide");
  if (!slides.length || slides.length <= 1) return;

  let current = 0;
  let interval;

  function showSlide(index) {
    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
    });
    current = index;
  }

  function nextSlide() {
    showSlide(current + 1);
  }

  function startAutoplay() {
    if (interval) clearInterval(interval);
    interval = setInterval(nextSlide, 5500);
  }

  function stopAutoplay() {
    if (interval) clearInterval(interval);
  }

  carousel.addEventListener("mouseenter", stopAutoplay);
  carousel.addEventListener("mouseleave", startAutoplay);
  startAutoplay();
}

function initHeroScroll() {
  const scrollButton = document.querySelector(".orien-services-hero-scroll");
  if (scrollButton) {
    scrollButton.addEventListener("click", () => {
      document
        .querySelector(".orien-services-section")
        ?.scrollIntoView({ behavior: "smooth" });
    });
  }
}

function initRevealObserver() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    },
    { threshold: 0.12 },
  );
  setTimeout(() => {
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  }, 300);
}

function observeServiceCards() {
  const cards = document.querySelectorAll(".orien-service-item");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add("visible"), index * 120);
        }
      });
    },
    { threshold: 0.15 },
  );
  cards.forEach((card) => observer.observe(card));
}

function getEmbedUrl(youtubeUrl) {
  if (!youtubeUrl) return null;
  const match = youtubeUrl.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"]/g, (match) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
    return map[match] || match;
  });
}

function showLoading() {
  const container = document.getElementById("servicesContainer");
  if (container) {
    container.innerHTML = `<div class="orien-loading"><div class="orien-spinner"></div><p>Cargando experiencias...</p></div>`;
  }
}
function hideLoading() {}

function showNotification(message, type = "success") {
  const notif = document.createElement("div");
  notif.className = `orien-notification ${type}`;
  notif.textContent = message;
  notif.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--color-dark);
    color: white;
    padding: 14px 24px;
    border-radius: 999px;
    z-index: 99999;
    font-weight: 500;
    box-shadow: 0 10px 30px rgba(0,0,0,0.18);
  `;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3500);
}

function fixAllMedia() {
  // Forzar iframes e imágenes a ocupar todo el contenedor
  const iframes = document.querySelectorAll(".orien-video-wrapper iframe");
  iframes.forEach((iframe) => {
    iframe.style.width = "100%";
    iframe.style.height = "100%";
  });
  const images = document.querySelectorAll(".orien-carousel-slide img");
  images.forEach((img) => {
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
  });
}
