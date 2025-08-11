import { getService } from "$lib/core/ServiceContainer";

/* ── private reactive fields ── */
let _user = $state(() => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr || userStr === "undefined" || userStr === "null") {
      return null;
    }
    return JSON.parse(userStr);
  } catch (e) {
    console.warn("Failed to parse user from localStorage:", e);
    localStorage.removeItem("user"); // Clean up invalid data
    return null;
  }
});

let _isAuthenticated = $state(_user !== null);

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
}

export function logout() {
  _user = null;
  _isAuthenticated = false;
  localStorage.removeItem("user");
  console.log("🔐 [Auth] User logged out");
}

export async function initializeAuth() {
  try {
    // If we have user in localStorage, validate the session
    if (_user) {
      const authService = getService("authService");
      const isValid = await authService.validateSession();

      if (!isValid) {
        logout();
      }
    }
  } catch (error) {
    console.log("🔐 [Auth] Session validation failed, clearing auth");
    logout();
  }
}
