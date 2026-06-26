/* ========================================
   USERS LIST CONTROLLER - Orién Pro
   ======================================== */

import { UserService } from "/src/services/userService";
import {
  showLoading,
  hideLoading,
  showNotification,
} from "/src/modules/utils/uiHelpers.js";
import { getCurrentUser, isAdmin } from "/src/modules/utils/auth.js";
import { initPagination } from "/src/modules/utils/pagination.js";

let userService = null;
let currentUsers = [];
let loggedUser = null;
let pagination = null;

export function initUsersListController() {
  loggedUser = getCurrentUser();
  if (!loggedUser) {
    showNotification("Debes iniciar sesión", "error");
    setTimeout(() => (window.location.href = "/login"), 1500);
    return;
  }

  userService = new UserService();
  loadUsers();
  bindEvents();

  const addBtn = document.getElementById("addUserBtn");
  if (addBtn) addBtn.style.display = isAdmin() ? "inline-flex" : "none";

  console.log("✅ Users List Controller inicializado");
}

async function loadUsers() {
  try {
    showLoading();
    currentUsers = await userService.getAllUsers(false);
    initPaginationForUsers(currentUsers);
    hideLoading();
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}

function initPaginationForUsers(users) {
  const container = document.getElementById("paginationControls");
  if (!container) {
    renderUserTable(users);
    updateUserCount(users.length);
    return;
  }

  pagination = initPagination(
    container,
    users,
    10,
    (pageItems, totalItems) => {
      renderUserTable(pageItems);
      updateUserCount(totalItems);
    },
    {
      onTotalUpdate: (total) => updateUserCount(total),
    },
  );
}

function renderUserTable(users) {
  const tbody = document.querySelector("#usersTable tbody");
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center">No hay usuarios registrados</td></tr>`;
    return;
  }

  const uniqueUsers = [];
  const seen = new Set();
  for (const user of users) {
    if (!seen.has(user.uid)) {
      seen.add(user.uid);
      uniqueUsers.push(user);
    }
  }

  tbody.innerHTML = uniqueUsers
    .map((user) => {
      const isOwnProfile = loggedUser.uid === user.uid;
      const canEdit = isAdmin() || isOwnProfile;
      const canToggle = isAdmin() && user.uid !== loggedUser.uid; // No permitir que un admin se inhabilite a sí mismo

      return `
        <tr data-uid="${user.uid}">
          <td data-label="Usuario">
            <div class="orien-user-info">
              <div class="orien-user-avatar">
                ${user.fotoURL ? `<img src="${user.fotoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : '<i class="fas fa-user-circle"></i>'}
              </div>
              <div>
                <strong>${escapeHtml(user.email)}</strong>
                <div class="orien-table-subtitle">ID: ${user.uid.substring(0, 8)}... • ${escapeHtml(user.nombre)}</div>
              </div>
            </div>
          </td>
          <td data-label="Rol">
            <span class="orien-badge ${user.cargo === "admin" ? "orien-badge-primary" : "orien-badge-secondary"}">
              ${user.getRolTexto()}
            </span>
          </td>
          <td data-label="Estado">
            <span class="orien-badge ${user.activo ? "orien-badge-primary" : "orien-badge-secondary"}">
              ${user.activo ? "Activo" : "Inactivo"}
            </span>
          </td>
          <td data-label="Acciones">
            <div class="orien-table-actions">
              ${canEdit ? `<a href="/usersEdit/${user.uid}" class="orien-btn orien-btn-sm orien-btn-outline" title="Editar"><i class="fas fa-edit"></i></a>` : ""}
              ${
                canToggle
                  ? `<button class="orien-btn orien-btn-sm orien-btn-outline toggle-user" data-uid="${user.uid}" style="border-color:${user.activo ? "#dc3545" : "#28a745"}; color:${user.activo ? "#dc3545" : "#28a745"};" title="${user.activo ? "Inactivar" : "Activar"}">
                <i class="fas ${user.activo ? "fa-toggle-on" : "fa-toggle-off"}"></i>
              </button>`
                  : ""
              }
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  // Asignar eventos a los botones toggle
  document.querySelectorAll(".toggle-user").forEach((btn) => {
    btn.removeEventListener("click", toggleHandler);
    btn.addEventListener("click", toggleHandler);
  });
}

// Manejador para toggle
function toggleHandler(e) {
  const uid = e.currentTarget.dataset.uid;
  toggleUserStatus(uid);
}

// Función para cambiar estado (activo/inactivo) sin confirmación
async function toggleUserStatus(uid) {
  try {
    showLoading();
    // Obtener usuario actual para saber su estado
    const user = currentUsers.find((u) => u.uid === uid);
    if (!user) {
      showNotification("Usuario no encontrado", "error");
      hideLoading();
      return;
    }

    if (user.activo) {
      await userService.deactivateUser(uid);
      showNotification("Usuario inactivado", "success");
    } else {
      await userService.activateUser(uid);
      showNotification("Usuario activado", "success");
    }

    // Recargar lista
    currentUsers = await userService.getAllUsers(false);
    if (pagination) {
      pagination.setItems(currentUsers);
    } else {
      renderUserTable(currentUsers);
      updateUserCount(currentUsers.length);
    }
    hideLoading();
  } catch (error) {
    showNotification(error.message, "error");
    hideLoading();
  }
}

function updateUserCount(count) {
  const el = document.getElementById("usersCount");
  if (el) el.textContent = `${count} usuarios registrados`;
}

function bindEvents() {
  document
    .getElementById("searchUsers")
    ?.addEventListener("input", () => filterUsers());
  document
    .getElementById("filterRole")
    ?.addEventListener("change", () => filterUsers());
  document
    .getElementById("filterStatus")
    ?.addEventListener("change", () => filterUsers());
}

function filterUsers() {
  const searchTerm =
    document.getElementById("searchUsers")?.value.toLowerCase() || "";
  const roleFilter = document.getElementById("filterRole")?.value || "all";
  const statusFilter = document.getElementById("filterStatus")?.value || "all";

  let filtered = [...currentUsers];
  if (searchTerm) {
    filtered = filtered.filter(
      (u) =>
        u.email.toLowerCase().includes(searchTerm) ||
        u.nombre.toLowerCase().includes(searchTerm),
    );
  }
  if (roleFilter !== "all")
    filtered = filtered.filter((u) => u.cargo === roleFilter);
  if (statusFilter !== "all")
    filtered = filtered.filter((u) => u.activo === (statusFilter === "active"));

  if (pagination) {
    pagination.setItems(filtered);
  } else {
    renderUserTable(filtered);
    updateUserCount(filtered.length);
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, (m) => {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}
