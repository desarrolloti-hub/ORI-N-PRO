/* ========================================
   HOME CONTROLLER - Orién Pro
   Controlador de la página de inicio con animaciones y música
   ======================================== */

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

// Elementos DOM cacheados
let elements = {};

// Instancia de audio
let audioInstance = null;

/**
 * Inicializa el controlador del home
 */
export function initHomeController() {
    // Esperar a que el DOM esté completamente cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeController();
        });
    } else {
        initializeController();
    }
    
    // Retornar API pública
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

/**
 * Inicialización real del controller
 */
function initializeController() {
    if (state.isInitialized) return;
    
    cacheElements();
    
    if (!elements.container) {
        console.warn('⚠️ Home container no encontrado en el DOM');
        return;
    }
    
    bindEvents();
    initHeroSlider();
    initScrollAnimations();
    initMusicPlayer();
    initSmoothScroll();
    
    // 🎵 Intentar reproducción automática de música
    attemptAutoPlay();
    
    state.isInitialized = true;
    
    console.log('✅ Home Controller inicializado');
}

/**
 * Cachea elementos del DOM
 */
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

/**
 * Vincula eventos del DOM
 */
function bindEvents() {
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('route:changed', () => {
        setTimeout(() => {
            cacheElements();
            resetAndReinit();
        }, 100);
    });
    
    // 🎵 Eventos de audio para depuración
    if (audioInstance) {
        audioInstance.addEventListener('play', () => {
            console.log('🎵 Evento: reproducción iniciada');
        });
        audioInstance.addEventListener('pause', () => {
            console.log('🎵 Evento: reproducción pausada');
        });
        audioInstance.addEventListener('error', (e) => {
            console.error('🎵 Error en audio:', e);
        });
    }
}

/**
 * 🎵 Intenta reproducción automática con múltiples estrategias
 */
function attemptAutoPlay() {
    if (!audioInstance) {
        console.warn('⚠️ No hay elemento de audio disponible');
        return;
    }
    
    console.log('🎵 Intentando reproducción automática...');
    
    // Estrategia 1: Reproducción directa
    const playPromise = audioInstance.play();
    
    if (playPromise !== undefined) {
        playPromise
            .then(() => {
                state.isMusicPlaying = true;
                updateMusicUI(true);
                console.log('✅ Reproducción automática exitosa');
            })
            .catch(error => {
                console.log('⚠️ Reproducción automática bloqueada por el navegador:', error.name);
                
                // Estrategia 2: Intentar con interacción del usuario en el documento
                waitForUserInteraction();
                
                // Estrategia 3: Mostrar indicador visual
                showMusicActivationHint();
            });
    }
}

/**
 * 🎯 Espera interacción del usuario para reproducir música
 */
function waitForUserInteraction() {
    const interactionEvents = ['click', 'touchstart', 'keydown', 'scroll'];
    
    function tryPlayOnInteraction() {
        if (!audioInstance) return;
        
        audioInstance.play()
            .then(() => {
                state.isMusicPlaying = true;
                updateMusicUI(true);
                console.log('✅ Música iniciada después de interacción del usuario');
                
                // Remover listeners después de éxito
                interactionEvents.forEach(event => {
                    document.removeEventListener(event, tryPlayOnInteraction);
                });
            })
            .catch(error => {
                console.log('⏳ Esperando interacción del usuario...');
            });
    }
    
    interactionEvents.forEach(event => {
        document.addEventListener(event, tryPlayOnInteraction, { once: false });
    });
    
    // Auto-remover después de 30 segundos para no saturar
    setTimeout(() => {
        interactionEvents.forEach(event => {
            document.removeEventListener(event, tryPlayOnInteraction);
        });
    }, 30000);
}

/**
 * 🔔 Muestra un indicador visual para activar la música
 */
function showMusicActivationHint() {
    // Verificar si ya existe un prompt
    if (document.querySelector('.orien-music-activation-hint')) return;
    
    // Crear hint sutil
    const hint = document.createElement('div');
    hint.className = 'orien-music-activation-hint';
    hint.innerHTML = `
        <div class="orien-hint-content">
            <span class="orien-hint-icon">🎵</span>
            <span class="orien-hint-text">Haz clic para activar la música</span>
        </div>
    `;
    
    // Estilos del hint
    hint.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px);
        color: white;
        padding: 10px 18px;
        border-radius: 40px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 13px;
        z-index: 9999;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        animation: slideInRight 0.4s ease;
    `;
    
    // Agregar keyframes para animación
    if (!document.querySelector('#orien-hint-styles')) {
        const styles = document.createElement('style');
        styles.id = 'orien-hint-styles';
        styles.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            .orien-music-activation-hint:hover {
                background: rgba(255, 51, 102, 0.9);
                transform: translateY(-2px);
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(hint);
    
    // Auto-ocultar después de 10 segundos
    const timeout = setTimeout(() => {
        if (hint && hint.parentNode) {
            hint.style.opacity = '0';
            setTimeout(() => hint.remove(), 300);
        }
    }, 10000);
    
    // Reproducir al hacer clic en el hint
    hint.addEventListener('click', (e) => {
        e.stopPropagation();
        playMusic();
        if (hint && hint.parentNode) hint.remove();
        clearTimeout(timeout);
    });
    
    // También permitir clic en cualquier parte
    const playOnAnyClick = () => {
        if (!state.isMusicPlaying) {
            playMusic();
        }
        document.removeEventListener('click', playOnAnyClick);
        if (hint && hint.parentNode) hint.remove();
        clearTimeout(timeout);
    };
    
    document.addEventListener('click', playOnAnyClick, { once: true });
}

/**
 * Inicializa el reproductor de música
 */
function initMusicPlayer() {
    if (!elements.musicBtn) {
        console.warn('⚠️ Botón de música no encontrado');
        return;
    }
    
    if (!audioInstance) {
        console.warn('⚠️ Elemento de audio no encontrado');
        return;
    }
    
    // Configurar el botón para toggle manual
    elements.musicBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.isMusicPlaying) {
            pauseMusic();
        } else {
            playMusic();
        }
    });
    
    // Actualizar UI inicial
    updateMusicUI(false);
    
    console.log('🎵 Reproductor configurado');
}

/**
 * Reproduce música
 */
function playMusic() {
    if (!audioInstance) return;
    
    console.log('🎵 Reproduciendo música...');
    
    audioInstance.play()
        .then(() => {
            state.isMusicPlaying = true;
            updateMusicUI(true);
            console.log('✅ Música reproduciéndose');
        })
        .catch(error => {
            console.error('❌ Error al reproducir:', error.name, error.message);
            state.isMusicPlaying = false;
            updateMusicUI(false);
            
            // Si hay un error específico de autoplay
            if (error.name === 'NotAllowedError') {
                showMusicActivationHint();
            }
        });
}

/**
 * Pausa música
 */
function pauseMusic() {
    if (!audioInstance) return;
    
    audioInstance.pause();
    state.isMusicPlaying = false;
    updateMusicUI(false);
    console.log('⏸️ Música pausada');
}

/**
 * Cambia el volumen
 */
function setMusicVolume(volume) {
    if (audioInstance) {
        audioInstance.volume = Math.max(0, Math.min(1, volume));
    }
}

/**
 * Actualiza la interfaz del reproductor
 */
function updateMusicUI(isPlaying) {
    if (!elements.musicBtn) return;
    
    if (isPlaying) {
        elements.musicBtn.innerHTML = '⏸';
        elements.musicBtn.classList.add('playing');
        if (elements.musicLabel) {
            elements.musicLabel.textContent = 'Reproduciendo';
        }
    } else {
        elements.musicBtn.innerHTML = '▶';
        elements.musicBtn.classList.remove('playing');
        if (elements.musicLabel) {
            elements.musicLabel.textContent = 'Pausado';
        }
    }
}

/**
 * Maneja visibilidad de la página
 */
function handleVisibilityChange() {
    if (document.hidden && state.isMusicPlaying) {
        // Opcional: pausar cuando la página no está visible
        // pauseMusic();
    } else if (!document.hidden && !state.isMusicPlaying && state.isInitialized) {
        // Opcional: reanudar cuando vuelve a la página
        // attemptAutoPlay();
    }
}

/**
 * Inicializa el slider
 */
function initHeroSlider() {
    if (!elements.slides || elements.slides.length === 0) return;
    
    state.slides = elements.slides;
    state.currentSlide = 0;
    
    state.slides.forEach((slide, index) => {
        if (index === 0) {
            slide.classList.add('active');
        } else {
            slide.classList.remove('active');
            slide.classList.remove('prev');
        }
    });
    
    startSlider();
}

/**
 * Inicia slider automático
 */
function startSlider() {
    if (state.sliderInterval) clearInterval(state.sliderInterval);
    
    state.sliderInterval = setInterval(() => {
        nextSlide();
    }, 5000);
}

/**
 * Detiene slider
 */
function stopSlider() {
    if (state.sliderInterval) {
        clearInterval(state.sliderInterval);
        state.sliderInterval = null;
    }
}

/**
 * Siguiente slide
 */
function nextSlide() {
    if (!state.slides.length || state.isAnimating) return;
    
    state.isAnimating = true;
    
    const current = state.slides[state.currentSlide];
    const nextIndex = (state.currentSlide + 1) % state.slides.length;
    const next = state.slides[nextIndex];
    
    if (current) {
        current.classList.remove('active');
        current.classList.add('prev');
    }
    if (next) {
        next.classList.remove('prev');
        next.classList.add('active');
    }
    
    state.currentSlide = nextIndex;
    
    setTimeout(() => {
        state.isAnimating = false;
    }, 1500);
}

/**
 * Slide anterior
 */
function prevSlide() {
    if (!state.slides.length || state.isAnimating) return;
    
    state.isAnimating = true;
    
    const current = state.slides[state.currentSlide];
    const prevIndex = (state.currentSlide - 1 + state.slides.length) % state.slides.length;
    const prev = state.slides[prevIndex];
    
    if (current) {
        current.classList.remove('active');
        current.classList.add('prev');
    }
    if (prev) {
        prev.classList.remove('prev');
        prev.classList.add('active');
    }
    
    state.currentSlide = prevIndex;
    
    setTimeout(() => {
        state.isAnimating = false;
    }, 1500);
}

/**
 * Inicializa animaciones con Intersection Observer
 */
function initScrollAnimations() {
    if (!elements.productItems || elements.productItems.length === 0) return;
    
    if (state.observer) state.observer.disconnect();
    
    state.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                state.observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    
    elements.productItems.forEach(item => {
        state.observer.observe(item);
    });
    
    if (elements.descriptionBox) {
        state.observer.observe(elements.descriptionBox);
    }
}

/**
 * Refresca animaciones
 */
function refreshAnimations() {
    if (!state.observer) {
        initScrollAnimations();
    } else {
        document.querySelectorAll('.orien-product-item, .orien-description-box').forEach(el => {
            if (!el.classList.contains('visible')) {
                state.observer.observe(el);
            }
        });
    }
}

/**
 * Scroll suave
 */
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

/**
 * Scroll suave a elemento
 */
function smoothScrollTo(target) {
    const element = document.querySelector(target);
    if (element) {
        const navbar = document.querySelector('.orien-navbar');
        const navbarHeight = navbar ? navbar.offsetHeight : 80;
        window.scrollTo({
            top: element.offsetTop - navbarHeight,
            behavior: 'smooth'
        });
    }
}

/**
 * Efecto parallax
 */
function handleScroll() {
    if (!elements.heroSection) return;
    
    const scrollY = window.scrollY;
    document.querySelectorAll('.orien-slide-image').forEach(slide => {
        if (slide) {
            slide.style.transform = `translateY(${scrollY * 0.3}px)`;
        }
    });
}

/**
 * Maneja resize
 */
function handleResize() {
    if (state.observer) refreshAnimations();
}

/**
 * Reinicia componentes
 */
function resetAndReinit() {
    cacheElements();
    stopSlider();
    initHeroSlider();
    if (state.observer) {
        state.observer.disconnect();
    }
    initScrollAnimations();
}

/**
 * Obtiene estado
 */
function getState() {
    return {
        isMusicPlaying: state.isMusicPlaying,
        currentSlide: state.currentSlide,
        totalSlides: state.slides?.length || 0,
        productsCount: elements.productItems?.length || 0,
        isInitialized: state.isInitialized
    };
}

/**
 * Destruye controller
 */
function destroy() {
    stopSlider();
    if (state.observer) {
        state.observer.disconnect();
        state.observer = null;
    }
    if (audioInstance) {
        audioInstance.pause();
        audioInstance.currentTime = 0;
    }
    elements = {};
    state.isInitialized = false;
    console.log('🗑️ Home Controller destruido');
}