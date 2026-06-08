/* ========================================
   USERS EDIT CONTROLLER - Orién Pro
   Controlador para edición de usuarios
   ======================================== */

import { UserService } from '/src/services/userService';

let userService = null;
let currentUserUid = null;
let initialized = false;

/**
 * Inicializa el controlador de edición de usuarios
 * @param {string} uid - ID del usuario a editar
 */
export function initUsersEditController(uid) {
    if (initialized && currentUserUid === uid) {
        console.log('Users Edit Controller ya inicializado para este usuario, omitiendo...');
        return;
    }
    
    initialized = true;
    currentUserUid = uid;
    userService = new UserService();
    
    loadUserData();
    bindFormSubmit();
    bindButtons();
    
    console.log('✅ Users Edit Controller inicializado para uid:', uid);
}

/**
 * Destruye el controlador
 */
export function destroyUsersEditController() {
    const form = document.getElementById('userForm');
    if (form) {
        form.removeEventListener('submit', handleSubmit);
    }
    
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.removeEventListener('click', handleChangePassword);
    }
    
    const deactivateBtn = document.getElementById('deactivateBtn');
    if (deactivateBtn) {
        deactivateBtn.removeEventListener('click', handleDeactivate);
    }
    
    initialized = false;
    currentUserUid = null;
    userService = null;
    console.log('Users Edit Controller destruido');
}

/**
 * Carga los datos del usuario
 */
async function loadUserData() {
    try {
        showLoading();
        
        const user = await userService.getUserById(currentUserUid);
        
        if (!user) {
            showNotification('Usuario no encontrado', 'error');
            setTimeout(() => {
                window.location.href = '/usersList';
            }, 1500);
            return;
        }
        
        populateForm(user);
        updateAuditInfo(user);
        updateStatusBadge(user);
        
        hideLoading();
        
    } catch (error) {
        console.error('Error cargando usuario:', error);
        showNotification(error.message, 'error');
        hideLoading();
    }
}

/**
 * Popula el formulario con datos del usuario
 */
function populateForm(user) {
    const nombreParts = user.nombre.split(' ');
    const nombre = nombreParts[0] || '';
    const apellidos = nombreParts.slice(1).join(' ') || '';
    
    const nombreInput = document.querySelector('input[name="nombre"]');
    const apellidosInput = document.querySelector('input[name="apellidos"]');
    const emailInput = document.querySelector('input[name="email"]');
    const cargoSelect = document.querySelector('select[name="cargo"]');
    const statusRadios = document.querySelectorAll('input[name="status"]');
    const uidSpan = document.getElementById('userUid');
    
    if (nombreInput) nombreInput.value = nombre;
    if (apellidosInput) apellidosInput.value = apellidos;
    if (emailInput) emailInput.value = user.email;
    if (cargoSelect) cargoSelect.value = user.cargo;
    if (uidSpan) uidSpan.textContent = `ID: ${user.uid.substring(0, 8)}...`;
    
    statusRadios.forEach(radio => {
        const isActive = radio.value === 'active';
        if (isActive === user.activo) {
            radio.checked = true;
        }
    });
}

/**
 * Actualiza la información de auditoría
 */
function updateAuditInfo(user) {
    const auditDiv = document.getElementById('auditInfo');
    if (!auditDiv) return;
    
    const lastAccess = user.fechaActualizacion ? 
        new Date(user.fechaActualizacion).toLocaleString() : 'Nunca';
    const createdAt = user.fechaCreacion ? 
        new Date(user.fechaCreacion).toLocaleDateString() : 'Desconocido';
    
    auditDiv.innerHTML = `
        <i class="fas fa-history"></i>
        <span>Última actualización: ${lastAccess}</span>
        <span class="separator">|</span>
        <i class="fas fa-calendar-alt"></i>
        <span>Usuario creado: ${createdAt}</span>
    `;
}

/**
 * Actualiza el badge de estado
 */
function updateStatusBadge(user) {
    const statusBadge = document.querySelector('.orien-admin-edit-status .orien-badge-primary, .orien-admin-edit-status .orien-badge-secondary');
    if (statusBadge) {
        statusBadge.textContent = user.activo ? 'Activo' : 'Inactivo';
        statusBadge.className = `orien-badge ${user.activo ? 'orien-badge-primary' : 'orien-badge-secondary'}`;
    }
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
 * Vincula botones adicionales
 */
function bindButtons() {
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const deactivateBtn = document.getElementById('deactivateBtn');
    
    if (changePasswordBtn) {
        changePasswordBtn.removeEventListener('click', handleChangePassword);
        changePasswordBtn.addEventListener('click', handleChangePassword);
    }
    
    if (deactivateBtn) {
        deactivateBtn.removeEventListener('click', handleDeactivate);
        deactivateBtn.addEventListener('click', handleDeactivate);
    }
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
    
    const updateData = {
        nombre: nombreCompleto,
        cargo: formData.get('cargo'),
        activo: formData.get('status') === 'active'
    };
    
    const newPassword = formData.get('new_password');
    const confirmPassword = formData.get('confirm_password');
    
    try {
        showLoading();
        
        // Actualizar datos básicos
        await userService.updateUser(currentUserUid, updateData);
        
        // Actualizar contraseña si se proporcionó
        if (newPassword && newPassword.trim() !== '') {
            if (newPassword !== confirmPassword) {
                showNotification('Las contraseñas nuevas no coinciden', 'error');
                hideLoading();
                return;
            }
            if (newPassword.length < 6) {
                showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
                hideLoading();
                return;
            }
            await userService.changeUserPassword(currentUserUid, newPassword);
        }
        
        showNotification('Usuario actualizado exitosamente', 'success');
        
        setTimeout(() => {
            window.location.href = '/usersList';
        }, 1500);
        
    } catch (error) {
        showNotification(error.message, 'error');
        hideLoading();
    }
}

/**
 * Maneja cambio de contraseña
 */
async function handleChangePassword() {
    const newPassword = prompt('Ingrese la nueva contraseña:');
    
    if (!newPassword || newPassword.trim() === '') return;
    
    if (newPassword.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    const confirmPassword = prompt('Confirme la nueva contraseña:');
    
    if (newPassword !== confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }
    
    try {
        showLoading();
        await userService.changeUserPassword(currentUserUid, newPassword);
        showNotification('Contraseña actualizada exitosamente', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Maneja inactivación/activación de usuario
 */
async function handleDeactivate() {
    const user = await userService.getUserById(currentUserUid);
    
    if (!user) {
        showNotification('Usuario no encontrado', 'error');
        return;
    }
    
    const action = user.activo ? 'inactivar' : 'activar';
    const confirmMsg = confirm(`¿Está seguro de que desea ${action} este usuario?`);
    
    if (!confirmMsg) return;
    
    try {
        showLoading();
        
        if (user.activo) {
            await userService.deactivateUser(currentUserUid);
            showNotification('Usuario inactivado exitosamente', 'success');
        } else {
            await userService.activateUser(currentUserUid);
            showNotification('Usuario activado exitosamente', 'success');
        }
        
        // Recargar datos
        await loadUserData();
        
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
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