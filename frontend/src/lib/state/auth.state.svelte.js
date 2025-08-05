import { getService } from "$lib/core/ServiceContainer";

/* ── private reactive fields ── */
let _user = $state(
  localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null
);
let _isAuthenticated = $state(localStorage.getItem("user") ? true : false);

// Getters
export function getUser() {
  return _user;
}

export function getIsAuthenticated() {
  return _isAuthenticated;
}

// Setters
export function setUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
  _user = user;
  _isAuthenticated = true;
  console.log("🔐 [Auth] User authenticated:", user.email);
}

export function logout() {
  _user = null;
  _isAuthenticated = false;
  localStorage.removeItem("user");
  console.log("🔐 [Auth] User logged out");
}

// Initialize auth state from session
export async function initializeAuth() {
  try {
    // Try to get current user from session
    const authService = getService("authService");
    // This would be a /me endpoint if implemented
    // For now, we rely on session cookies
    console.log("🔐 [Auth] Auth state initialized");
  } catch (error) {
    console.log("🔐 [Auth] No existing session");
  }
}
