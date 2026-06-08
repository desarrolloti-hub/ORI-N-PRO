/* ========================================
   USERS LIST CONTROLLER - Orién Pro
   Controlador para la lista de usuarios
   ======================================== */

import { UserService } from '/src/services/userService';

let userService = null;
let currentUsers = [];

/**
 * Inicializa el controlador de lista de usuarios
 */
export function initUsersListController() {
    userService = new UserService();
    loadUsers();
    bindEvents();
    console.log('✅ Users List Controller inicializado');
}

/**
 * Carga y renderiza la lista de usuarios
 */
async function loadUsers() {
    try {
        showLoading();
        
        const activeUsers = await userService.getAllUsers(true);
        const inactiveUsers = await userService.getAllUsers(false);
        currentUsers = [...activeUsers, ...inactiveUsers];
        
        renderUserTable(currentUsers);
        updateUserCount(currentUsers.length);
        
        hideLoading();
        
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        showNotification(error.message, 'error');
        hideLoading();
    }
}

/**
 * Renderiza la tabla de usuarios
 */
function renderUserTable(users) {
    const tbody = document.querySelector('#usersTable tbody');
    if (!tbody) return;
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <i class="fas fa-users" style="font-size: 2rem; color: var(--color-gray);"></i>
                    <p>No hay usuarios registrados</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr data-uid="${user.uid}">
            <td data-label="Usuario">
                <div class="orien-user-info">
                    <div class="orien-user-avatar">
                        ${user.fotoURL ? 
                            `<img src="${user.fotoURL}" alt="${user.nombre}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : 
                            `<i class="fas fa-user-circle"></i>`
                        }
                    </div>
                    <div>
                        <strong>${user.email}</strong>
                        <div class="orien-table-subtitle">ID: ${user.uid.substring(0, 8)}...</div>
                    </div>
                </div>
            </td>
            <td data-label="Nombre completo">${user.nombre}</td>
            <td data-label="Email">${user.email}</td>
            <td data-label="Rol">
                <span class="orien-badge ${user.cargo === 'admin' ? 'orien-badge-primary' : 'orien-badge-secondary'}">
                    ${user.getRolTexto()}
                </span>
            </td>
            <td data-label="Estado">
                <span class="orien-badge ${user.activo ? 'orien-badge-primary' : 'orien-badge-secondary'}">
                    ${user.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td data-label="Acciones">
                <div class="orien-table-actions">
                    <a href="/usersEdit/${user.uid}" class="orien-btn orien-btn-sm orien-btn-outline" data-link>
                        <i class="fas fa-edit"></i>
                    </a>
                    ${user.activo ? 
                        `<button class="orien-btn orien-btn-sm orien-btn-outline deactivate-user" data-uid="${user.uid}" style="color:#dc3545; border-color:#dc3545;">
                            <i class="fas fa-ban"></i>
                        </button>` :
                        `<button class="orien-btn orien-btn-sm orien-btn-outline activate-user" data-uid="${user.uid}" style="color:#28a745; border-color:#28a745;">
                            <i class="fas fa-check-circle"></i>
                        </button>`
                    }
                </div>
            </td>
        </tr>
    `).join('');
    
    // Bindear eventos a los botones
    document.querySelectorAll('.deactivate-user').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deactivateUser(btn.dataset.uid);
        });
    });
    
    document.querySelectorAll('.activate-user').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            activateUser(btn.dataset.uid);
        });
    });
}

/**
 * Inactiva un usuario
 */
async function deactivateUser(uid) {
    const confirmMsg = confirm('¿Está seguro de que desea inactivar este usuario?');
    if (!confirmMsg) return;
    
    try {
        showLoading();
        await userService.deactivateUser(uid);
        showNotification('Usuario inactivado exitosamente', 'success');
        await loadUsers();
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Activa un usuario
 */
async function activateUser(uid) {
    try {
        showLoading();
        await userService.activateUser(uid);
        showNotification('Usuario activado exitosamente', 'success');
        await loadUsers();
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Actualiza el contador de usuarios
 */
function updateUserCount(count) {
    const countElement = document.getElementById('usersCount');
    if (countElement) {
        countElement.textContent = `${count} usuarios registrados`;
    }
}

/**
 * Vincula eventos de filtros y búsqueda
 */
function bindEvents() {
    const searchInput = document.getElementById('searchUsers');
    const filterRole = document.getElementById('filterRole');
    const filterStatus = document.getElementById('filterStatus');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => filterUsers());
    }
    
    if (filterRole) {
        filterRole.addEventListener('change', () => filterUsers());
    }
    
    if (filterStatus) {
        filterStatus.addEventListener('change', () => filterUsers());
    }
}

/**
 * Filtra usuarios por búsqueda, rol y estado
 */
function filterUsers() {
    const searchTerm = document.getElementById('searchUsers')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('filterRole')?.value || 'all';
    const statusFilter = document.getElementById('filterStatus')?.value || 'all';
    
    let filtered = [...currentUsers];
    
    if (searchTerm) {
        filtered = filtered.filter(user => 
            user.email.toLowerCase().includes(searchTerm) || 
            user.nombre.toLowerCase().includes(searchTerm)
        );
    }
    
    if (roleFilter !== 'all') {
        filtered = filtered.filter(user => user.cargo === roleFilter);
    }
    
    if (statusFilter !== 'all') {
        const isActive = statusFilter === 'active';
        filtered = filtered.filter(user => user.activo === isActive);
    }
    
    renderUserTable(filtered);
    updateUserCount(filtered.length);
}

/**
 * Muestra loader
 */
function showLoading() {
    const loader = document.querySelector('.orien-page-loader');
    if (loader) {
        loader.classList.remove('hidden');
    }
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
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}