/* ========================================
   AUTH UTILS - Orién Pro
   ======================================== */

import { auth } from "/config/firebaseConfig.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { UserService } from "/src/services/userService.js";

let currentUser = null;
let userService = null;

export function initAuth() {
  userService = new UserService();
  return new Promise((resolve) => {
    auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await userService.getUserById(firebaseUser.uid);
        if (userData) {
          currentUser = {
            uid: userData.uid,
            email: userData.email,
            nombre: userData.nombre,
            fotoURL: userData.fotoURL,
            cargo: userData.cargo,
            activo: userData.activo,
          };
        } else {
          currentUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            nombre: "",
            fotoURL: "",
            cargo: "colaborador",
            activo: true,
          };
        }
        localStorage.setItem("orien_user", JSON.stringify(currentUser));
      } else {
        currentUser = null;
        localStorage.removeItem("orien_user");
      }
      resolve(currentUser);
    });
  });
}

export function getCurrentUser() {
  if (currentUser) return currentUser;
  const stored = localStorage.getItem("orien_user");
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
      return currentUser;
    } catch (e) {}
  }
  return null;
}

export function isAdmin() {
  const user = getCurrentUser();
  return user && user.cargo === "admin";
}

export function isLoggedIn() {
  return getCurrentUser() !== null;
}

export async function logout() {
  await signOut(auth);
  localStorage.removeItem("orien_user");
  currentUser = null;
}
