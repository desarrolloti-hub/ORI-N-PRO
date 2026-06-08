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
    isInitialized: false
};

let carouselService = null;
let elements = {};
let audioInstance = null;

/**
 * Inicializa el controlador del home
 */
export async function initHomeController() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initialize());
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
        refreshAnimations: () => refreshAnimations()
    };
}

async function initialize() {
    if (state.isInitialized) return;
    
    cacheElements();
    if (!elements.container) {
        console.warn('⚠️ Home container no encontrado');
        return;
    }
    
    // Cargar carrusel activo desde Firestore
    carouselService = new CarouselService();
    await loadActiveCarousel();
    
    // Inicializar el resto de componentes
    bindEvents();
    initHeroSlider();      // reinicia el slider con los slides cargados
    initScrollAnimations();
    initMusicPlayer();
    initSmoothScroll();
    attemptAutoPlay();
    
    state.isInitialized = true;
    console.log('✅ Home Controller inicializado con carrusel dinámico');
}

function cacheElements() {
    elements = {
        container: document.querySelector('#app'),
        heroSection: document.querySelector('.orien-hero-section'),
        slides: document.querySelectorAll('.orien-hero-slide'),
        musicBtn: document.getElementById('musicBtn'),
        musicLabel: document.getElementById('musicLabel'),
        audioElement: document.getElementById('bgMusic'),
        productItems: document.querySelectorAll('.orien-product-item'),
        ctaButton: document.querySelector('.orien-cta-button'),
        scrollIndicator: document.querySelector('.orien-scroll-indicator'),
        descriptionBox: document.querySelector('.orien-description-box')
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
        slideDiv.className = `orien-hero-slide ${index === 0 ? "active" : ""}`;
        slideDiv.innerHTML = `
            <div class="orien-slide-image" style="background-image: url('${escapeHtml(slide.imagen)}');"></div>
            <div class="orien-slide-text">
                <h2>${escapeHtml(slide.titulo)}</h2>
                <p>${escapeHtml(slide.subtitulo)}</p>
                ${slide.ctaTexto && slide.ctaUrl ? `<a href="${slide.ctaUrl}" class="orien-cta-button">${escapeHtml(slide.ctaTexto)}</a>` : ""}
            </div>
        `;
        sliderContainer.appendChild(slideDiv);
    });
    // Actualizar referencia local de slides
    elements.slides = document.querySelectorAll('.orien-hero-slide');
    state.slides = elements.slides;
    state.currentSlide = 0;
    // Reiniciar slider automático
    if (state.sliderInterval) clearInterval(state.sliderInterval);
    startSlider();
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
        if (m === "&") return "&amp;";
        if (m === "<") return "&lt;";
        if (m === ">") return "&gt;";
        return m;
    });
}

// ==================== SLIDER MANUAL ====================
function initHeroSlider() {
    if (!elements.slides || elements.slides.length === 0) return;
    state.slides = elements.slides;
    state.currentSlide = 0;
    state.slides.forEach((slide, index) => {
        if (index === 0) slide.classList.add('active');
        else slide.classList.remove('active', 'prev');
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
    const current = state.slides[state.currentSlide];
    const nextIndex = (state.currentSlide + 1) % state.slides.length;
    const next = state.slides[nextIndex];
    if (current) current.classList.remove('active');
    if (next) {
        next.classList.remove('prev');
        next.classList.add('active');
    }
    state.currentSlide = nextIndex;
    setTimeout(() => { state.isAnimating = false; }, 1500);
}

function prevSlide() {
    if (!state.slides.length || state.isAnimating) return;
    state.isAnimating = true;
    const current = state.slides[state.currentSlide];
    const prevIndex = (state.currentSlide - 1 + state.slides.length) % state.slides.length;
    const prev = state.slides[prevIndex];
    if (current) current.classList.remove('active');
    if (prev) {
        prev.classList.remove('prev');
        prev.classList.add('active');
    }
    state.currentSlide = prevIndex;
    setTimeout(() => { state.isAnimating = false; }, 1500);
}

// ==================== MÚSICA ====================
function initMusicPlayer() {
    if (!elements.musicBtn || !audioInstance) return;
    elements.musicBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.isMusicPlaying ? pauseMusic() : playMusic();
    });
    updateMusicUI(false);
}

function playMusic() {
    if (!audioInstance) return;
    audioInstance.play()
        .then(() => {
            state.isMusicPlaying = true;
            updateMusicUI(true);
        })
        .catch(error => {
            console.error('Error al reproducir música:', error);
            state.isMusicPlaying = false;
            updateMusicUI(false);
            if (error.name === 'NotAllowedError') showMusicActivationHint();
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
    elements.musicBtn.innerHTML = isPlaying ? '⏸' : '▶';
    if (isPlaying) elements.musicBtn.classList.add('playing');
    else elements.musicBtn.classList.remove('playing');
    if (elements.musicLabel) elements.musicLabel.textContent = isPlaying ? 'Reproduciendo' : 'Pausado';
}

function attemptAutoPlay() {
    if (!audioInstance) return;
    const playPromise = audioInstance.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log('Reproducción automática bloqueada:', error.name);
            waitForUserInteraction();
            showMusicActivationHint();
        });
    }
}

function waitForUserInteraction() {
    const events = ['click', 'touchstart', 'keydown', 'scroll'];
    const tryPlay = () => {
        if (!state.isMusicPlaying) playMusic();
        events.forEach(ev => document.removeEventListener(ev, tryPlay));
    };
    events.forEach(ev => document.addEventListener(ev, tryPlay, { once: false }));
    setTimeout(() => {
        events.forEach(ev => document.removeEventListener(ev, tryPlay));
    }, 30000);
}

function showMusicActivationHint() {
    if (document.querySelector('.orien-music-activation-hint')) return;
    const hint = document.createElement('div');
    hint.className = 'orien-music-activation-hint';
    hint.innerHTML = `<div class="orien-hint-content">🎵 Haz clic para activar la música</div>`;
    hint.style.cssText = `position:fixed; bottom:80px; right:20px; background:rgba(0,0,0,0.85); backdrop-filter:blur(10px); color:white; padding:10px 18px; border-radius:40px; z-index:9999; cursor:pointer; font-size:13px;`;
    document.body.appendChild(hint);
    hint.addEventListener('click', () => { playMusic(); hint.remove(); });
    setTimeout(() => hint?.remove(), 10000);
}

// ==================== ANIMACIONES SCROLL ====================
function initScrollAnimations() {
    if (!elements.productItems?.length) return;
    if (state.observer) state.observer.disconnect();
    state.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                state.observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    elements.productItems.forEach(item => state.observer.observe(item));
    if (elements.descriptionBox) state.observer.observe(elements.descriptionBox);
}

function refreshAnimations() {
    if (!state.observer) initScrollAnimations();
    else {
        document.querySelectorAll('.orien-product-item, .orien-description-box').forEach(el => {
            if (!el.classList.contains('visible')) state.observer.observe(el);
        });
    }
}

// ==================== SMOOTH SCROLL ====================
function initSmoothScroll() {
    if (elements.scrollIndicator) {
        elements.scrollIndicator.addEventListener('click', (e) => {
            e.preventDefault();
            smoothScrollTo('#descripcion');
        });
    }
    if (elements.ctaButton) {
        elements.ctaButton.addEventListener('click', (e) => {
            e.preventDefault();
            smoothScrollTo('#descripcion');
        });
    }
}

function smoothScrollTo(target) {
    const element = document.querySelector(target);
    if (element) {
        const navbar = document.querySelector('.orien-navbar');
        const navbarHeight = navbar ? navbar.offsetHeight : 80;
        window.scrollTo({ top: element.offsetTop - navbarHeight, behavior: 'smooth' });
    }
}

// ==================== PARALLAX ====================
function handleScroll() {
    if (!elements.heroSection) return;
    const scrollY = window.scrollY;
    document.querySelectorAll('.orien-slide-image').forEach(slide => {
        if (slide) slide.style.transform = `translateY(${scrollY * 0.3}px)`;
    });
}

// ==================== EVENTOS GLOBALES ====================
function bindEvents() {
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', () => refreshAnimations());
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && state.isMusicPlaying) pauseMusic();
        else if (!document.hidden && !state.isMusicPlaying) attemptAutoPlay();
    });
    document.addEventListener('route:changed', () => {
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
        isInitialized: state.isInitialized
    };
}

function destroy() {
    stopSlider();
    if (state.observer) state.observer.disconnect();
    if (audioInstance) { audioInstance.pause(); audioInstance.currentTime = 0; }
    elements = {};
    state.isInitialized = false;
    console.log('🗑️ Home Controller destruido');
}