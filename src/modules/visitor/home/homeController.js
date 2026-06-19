/* ========================================
   HOME CONTROLLER - Orién Pro
   Controlador de la página de inicio con animaciones, música y carrusel dinámico
   ======================================== */

import { CarouselService } from "/src/services/carouselService.js";

// Estado privado del controller
let state = {
  isMusicPlaying: false,
  currentSlide: 0,
  slides: [],
  observer: null,
  sliderInterval: null,
  isAnimating: false,
  isInitialized: false,
};

let carouselService = null;
let elements = {};
let audioInstance = null;

/**
 * Inicializa el controlador del home
 */
export async function initHomeController() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initialize());
  } else {
    await initialize();
  }

  return {
    stopSlider: () => stopSlider(),
    startSlider: () => startSlider(),
    playMusic: () => playMusic(),
    pauseMusic: () => pauseMusic(),
    getState: () => getState(),
    destroy: () => destroy(),
    nextSlide: () => nextSlide(),
    prevSlide: () => prevSlide(),
    setMusicVolume: (volume) => setMusicVolume(volume),
    refreshAnimations: () => refreshAnimations(),
  };
}

async function initialize() {
  if (state.isInitialized) return;

  cacheElements();
  if (!elements.container) {
    console.warn("⚠️ Home container no encontrado");
    return;
  }

  // Cargar carrusel activo desde Firestore
  carouselService = new CarouselService();
  await loadActiveCarousel();

  // Inicializar el resto de componentes
  bindEvents();
  initHeroSlider();
  initScrollAnimations();
  initMusicPlayer();
  initSmoothScroll();
  attemptAutoPlay();

  state.isInitialized = true;
  console.log("✅ Home Controller inicializado con carrusel dinámico");
}

function cacheElements() {
  elements = {
    container: document.querySelector("#app"),
    heroSection: document.querySelector(".orien-hero-section"),
    slides: document.querySelectorAll(".orien-hero-slide"),
    musicBtn: document.getElementById("musicBtn"),
    musicLabel: document.getElementById("musicLabel"),
    audioElement: document.getElementById("bgMusic"),
    productItems: document.querySelectorAll(".orien-product-item"),
    ctaButton: document.querySelector(".orien-cta-button"),
    scrollIndicator: document.querySelector(".orien-scroll-indicator"),
    descriptionBox: document.querySelector(".orien-description-box"),
    sliderContainer: document.querySelector(".orien-hero-slider"),
  };
  if (elements.audioElement) {
    audioInstance = elements.audioElement;
    audioInstance.volume = 0.5;
    audioInstance.loop = true;
  }
}

// ==================== CARRUSEL DINÁMICO ====================
async function loadActiveCarousel() {
  try {
    const carousel = await carouselService.getActiveCarousel();
    if (carousel && carousel.slides.length > 0) {
      renderHeroSlides(carousel.slides);
    } else {
      console.warn("No hay carrusel activo, se mantiene el estático");
      setTimeout(() => initHeroSlider(), 100);
    }
  } catch (error) {
    console.error("Error cargando carrusel activo:", error);
  }
}

function renderHeroSlides(slides) {
  const sliderContainer = document.querySelector(".orien-hero-slider");
  if (!sliderContainer) return;

  sliderContainer.innerHTML = "";

  slides.forEach((slide, index) => {
    const slideDiv = document.createElement("div");
    slideDiv.className = `orien-hero-slide`;

    if (index === 0) {
      slideDiv.classList.add("active");
      slideDiv.style.transform = "translateX(0)";
      slideDiv.style.opacity = "1";
      slideDiv.style.zIndex = "2";
    } else {
      slideDiv.style.transform = "translateX(100%)";
      slideDiv.style.opacity = "0";
      slideDiv.style.zIndex = "1";
    }

    let textHtml = "";
    if (slide.titulo || slide.subtitulo) {
      textHtml = `
                <div class="orien-slide-text">
                    ${slide.titulo ? `<h2>${escapeHtml(slide.titulo)}</h2>` : ""}
                    ${slide.subtitulo ? `<p>${escapeHtml(slide.subtitulo)}</p>` : ""}
                    ${slide.ctaTexto && slide.ctaUrl ? `<a href="${escapeHtml(slide.ctaUrl)}" class="orien-cta-button">${escapeHtml(slide.ctaTexto)}</a>` : ""}
                </div>
            `;
    }

    slideDiv.innerHTML = `
            <div class="orien-slide-image" style="background-image: url('${escapeHtml(slide.imagen)}');"></div>
            ${textHtml}
        `;
    sliderContainer.appendChild(slideDiv);
  });

  elements.slides = document.querySelectorAll(".orien-hero-slide");
  state.slides = elements.slides;
  state.currentSlide = 0;

  if (state.sliderInterval) clearInterval(state.sliderInterval);
  startSlider();
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

// ==================== SLIDER CON TRANSICIÓN HORIZONTAL ====================
function initHeroSlider() {
  if (!elements.slides || elements.slides.length === 0) return;
  state.slides = elements.slides;
  state.currentSlide = 0;

  state.slides.forEach((slide, index) => {
    slide.style.transition = "none";
    if (index === 0) {
      slide.style.transform = "translateX(0)";
      slide.style.opacity = "1";
      slide.style.zIndex = "2";
      slide.classList.add("active");
    } else {
      slide.style.transform = "translateX(100%)";
      slide.style.opacity = "0";
      slide.style.zIndex = "1";
      slide.classList.remove("active");
    }
  });

  void document.body.offsetHeight;

  state.slides.forEach((slide) => {
    slide.style.transition =
      "transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.8s";
  });

  startSlider();
}

function startSlider() {
  if (state.sliderInterval) clearInterval(state.sliderInterval);
  state.sliderInterval = setInterval(() => nextSlide(), 5000);
}

function stopSlider() {
  if (state.sliderInterval) {
    clearInterval(state.sliderInterval);
    state.sliderInterval = null;
  }
}

function nextSlide() {
  if (!state.slides.length || state.isAnimating) return;
  state.isAnimating = true;

  const currentIndex = state.currentSlide;
  const nextIndex = (currentIndex + 1) % state.slides.length;
  const current = state.slides[currentIndex];
  const next = state.slides[nextIndex];

  if (!current || !next) {
    state.isAnimating = false;
    return;
  }

  current.style.transform = "translateX(-100%)";
  current.style.opacity = "0";
  current.style.zIndex = "1";
  current.classList.remove("active");

  next.style.transform = "translateX(0)";
  next.style.opacity = "1";
  next.style.zIndex = "2";
  next.classList.add("active");

  state.currentSlide = nextIndex;

  setTimeout(() => {
    state.isAnimating = false;
  }, 900);
}

function prevSlide() {
  if (!state.slides.length || state.isAnimating) return;
  state.isAnimating = true;

  const currentIndex = state.currentSlide;
  const prevIndex =
    (currentIndex - 1 + state.slides.length) % state.slides.length;
  const current = state.slides[currentIndex];
  const prev = state.slides[prevIndex];

  if (!current || !prev) {
    state.isAnimating = false;
    return;
  }

  current.style.transform = "translateX(100%)";
  current.style.opacity = "0";
  current.style.zIndex = "1";
  current.classList.remove("active");

  prev.style.transform = "translateX(0)";
  prev.style.opacity = "1";
  prev.style.zIndex = "2";
  prev.classList.add("active");

  state.currentSlide = prevIndex;

  setTimeout(() => {
    state.isAnimating = false;
  }, 900);
}

// ==================== MÚSICA CON FONTAWESOME ====================
function initMusicPlayer() {
  if (!elements.musicBtn || !audioInstance) return;
  elements.musicBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    state.isMusicPlaying ? pauseMusic() : playMusic();
  });
  updateMusicUI(false);
}

function playMusic() {
  if (!audioInstance) return;
  audioInstance
    .play()
    .then(() => {
      state.isMusicPlaying = true;
      updateMusicUI(true);
    })
    .catch((error) => {
      console.error("Error al reproducir música:", error);
      state.isMusicPlaying = false;
      updateMusicUI(false);
      if (error.name === "NotAllowedError") showMusicActivationHint();
    });
}

function pauseMusic() {
  if (!audioInstance) return;
  audioInstance.pause();
  state.isMusicPlaying = false;
  updateMusicUI(false);
}

function setMusicVolume(volume) {
  if (audioInstance) audioInstance.volume = Math.max(0, Math.min(1, volume));
}

function updateMusicUI(isPlaying) {
  if (!elements.musicBtn) return;
  // Usar FontAwesome para consistencia en todos los dispositivos
  elements.musicBtn.innerHTML = isPlaying
    ? '<i class="fas fa-pause"></i>'
    : '<i class="fas fa-play"></i>';
  if (isPlaying) {
    elements.musicBtn.classList.add("playing");
  } else {
    elements.musicBtn.classList.remove("playing");
  }
  if (elements.musicLabel) {
    elements.musicLabel.textContent = isPlaying ? "Reproduciendo" : "Pausado";
  }
}

function attemptAutoPlay() {
  if (!audioInstance) return;
  const playPromise = audioInstance.play();
  if (playPromise !== undefined) {
    playPromise.catch((error) => {
      console.log("Reproducción automática bloqueada:", error.name);
      waitForUserInteraction();
      showMusicActivationHint();
    });
  }
}

function waitForUserInteraction() {
  const events = ["click", "touchstart", "keydown", "scroll"];
  const tryPlay = () => {
    if (!state.isMusicPlaying) playMusic();
    events.forEach((ev) => document.removeEventListener(ev, tryPlay));
  };
  events.forEach((ev) =>
    document.addEventListener(ev, tryPlay, { once: false }),
  );
  setTimeout(() => {
    events.forEach((ev) => document.removeEventListener(ev, tryPlay));
  }, 30000);
}

// ==================== ANIMACIONES SCROLL ====================
function initScrollAnimations() {
  if (!elements.productItems?.length) return;
  if (state.observer) state.observer.disconnect();
  state.observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          state.observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 },
  );
  elements.productItems.forEach((item) => state.observer.observe(item));
  if (elements.descriptionBox) state.observer.observe(elements.descriptionBox);
}

function refreshAnimations() {
  if (!state.observer) initScrollAnimations();
  else {
    document
      .querySelectorAll(".orien-product-item, .orien-description-box")
      .forEach((el) => {
        if (!el.classList.contains("visible")) state.observer.observe(el);
      });
  }
}

// ==================== SMOOTH SCROLL ====================
function initSmoothScroll() {
  if (elements.scrollIndicator) {
    elements.scrollIndicator.addEventListener("click", (e) => {
      e.preventDefault();
      smoothScrollTo("#descripcion");
    });
  }
  if (elements.ctaButton) {
    elements.ctaButton.addEventListener("click", (e) => {
      e.preventDefault();
      smoothScrollTo("#descripcion");
    });
  }
}

function smoothScrollTo(target) {
  const element = document.querySelector(target);
  if (element) {
    const navbar = document.querySelector(".orien-navbar");
    const navbarHeight = navbar ? navbar.offsetHeight : 80;
    window.scrollTo({
      top: element.offsetTop - navbarHeight,
      behavior: "smooth",
    });
  }
}

// ==================== PARALLAX ====================
function handleScroll() {
  if (!elements.heroSection) return;
  const scrollY = window.scrollY;
  document.querySelectorAll(".orien-slide-image").forEach((slide) => {
    if (slide) {
      const currentTransform = slide.style.transform || "";
      if (!currentTransform.includes("translateX")) {
        slide.style.transform = `translateY(${scrollY * 0.3}px)`;
      }
    }
  });
}

// ==================== EVENTOS GLOBALES ====================
function bindEvents() {
  window.addEventListener("scroll", handleScroll);
  window.addEventListener("resize", () => refreshAnimations());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.isMusicPlaying) pauseMusic();
    else if (!document.hidden && !state.isMusicPlaying) attemptAutoPlay();
  });
  document.addEventListener("route:changed", () => {
    setTimeout(() => {
      cacheElements();
      resetAndReinit();
    }, 100);
  });
}

function resetAndReinit() {
  cacheElements();
  stopSlider();
  initHeroSlider();
  refreshAnimations();
}

function getState() {
  return {
    isMusicPlaying: state.isMusicPlaying,
    currentSlide: state.currentSlide,
    totalSlides: state.slides?.length || 0,
    productsCount: elements.productItems?.length || 0,
    isInitialized: state.isInitialized,
  };
}

function destroy() {
  stopSlider();
  if (state.observer) state.observer.disconnect();
  if (audioInstance) {
    audioInstance.pause();
    audioInstance.currentTime = 0;
  }
  elements = {};
  state.isInitialized = false;
  console.log("🗑️ Home Controller destruido");
}
