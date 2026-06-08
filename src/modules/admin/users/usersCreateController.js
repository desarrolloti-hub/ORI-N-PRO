/* ========================================
   USERS CREATE CONTROLLER - Orién Pro
   Controlador para creación de usuarios
   ======================================== */

import { UserService } from '/src/services/userService';

let userService = null;
let initialized = false;

/**
 * Inicializa el controlador de creación de usuarios
 */
export function initUsersCreateController() {
    if (initialized) {
        console.log('Users Create Controller ya inicializado, omitiendo...');
        return;
    }
    
    initialized = true;
    userService = new UserService();
    bindFormSubmit();
    console.log('✅ Users Create Controller inicializado');
}

/**
 * Destruye el controlador
 */
export function destroyUsersCreateController() {
    const form = document.getElementById('userForm');
    if (form) {
        form.removeEventListener('submit', handleSubmit);
    }
    initialized = false;
    userService = null;
    console.log('Users Create Controller destruido');
}

/**
 * Vincula evento del formulario
 */
function bindFormSubmit() {
    const form = document.getElementById('userForm');
    if (!form) return;
    
    form.removeEventListener('submit', handleSubmit);
    form.addEventListener('submit', handleSubmit);
}

/**
 * Maneja el envío del formulario
 */
async function handleSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const nombre = formData.get('nombre');
    const apellidos = formData.get('apellidos');
    const nombreCompleto = `${nombre} ${apellidos}`.trim();
    
    const userData = {
        nombre: nombreCompleto,
        email: formData.get('email'),
        cargo: formData.get('cargo'),
        activo: formData.get('status') === 'active'
    };
    
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm_password');
    
    // Validaciones
    if (password !== confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (!userData.nombre || userData.nombre === '') {
        showNotification('El nombre es obligatorio', 'error');
        return;
    }
    
    if (!userData.email || !userData.email.includes('@')) {
        showNotification('El correo electrónico no es válido', 'error');
        return;
    }
    
    if (!password || password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    try {
        showLoading();
        await userService.createUser(userData, password);
        showNotification('Usuario creado exitosamente', 'success');
        
        setTimeout(() => {
            window.location.href = '/usersList';
        }, 1500);
        
    } catch (error) {
        showNotification(error.message, 'error');
        hideLoading();
    }
}

/**
 * Muestra loader
 */
function showLoading() {
    let loader = document.querySelector('.orien-page-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.className = 'orien-page-loader';
        loader.innerHTML = '<div class="orien-spinner"></div>';
        document.body.appendChild(loader);
    }
    loader.classList.remove('hidden');
}

/**
 * Oculta loader
 */
function hideLoading() {
    const loader = document.querySelector('.orien-page-loader');
    if (loader) {
        loader.classList.add('hidden');
    }
}

/**
 * Muestra notificación
 */
function showNotification(message, type) {
    const oldNotifications = document.querySelectorAll('.orien-notification');
    oldNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `orien-notification orien-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 0.85rem;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            if (notification && notification.remove) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}