import { getService } from "$lib/core/ServiceContainer";

/* ── private reactive fields ── */
// Initialize user from localStorage on module load
function initializeUser() {
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
}

let _user = $state(initializeUser());

// Use $derived instead of $effect for computed values
let _isAuthenticated = $derived(_user !== null);

// Getters
export function getUser() {
  return _user;
}

export function getIsAuthenticated() {
  return _isAuthenticated;
}

// Setters
export function setUser(user) {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
    _user = user;
    console.log("🔐 [Auth] User logged in:", user.email || user.id);
  } else {
    localStorage.removeItem("user");
    _user = null;
    console.log("🔐 [Auth] User cleared");
  }
}

export function logout() {
  _user = null;
  localStorage.removeItem("user");
  console.log("🔐 [Auth] User logged out");
}

export async function initializeAuth() {
  try {
    console.log("🔄 [Auth] Initializing auth state...");
    
    // If we have user in localStorage, validate the session
    if (_user) {
      console.log("🔐 [Auth] Found user in localStorage, validating session...");
      const authService = getService("authService");
      const isValid = await authService.validateSession();

      if (!isValid) {
        console.log("🔐 [Auth] Session invalid, logging out");
        logout();
      } else {
        console.log("✅ [Auth] Session valid");
      }
    } else {
      console.log("🔐 [Auth] No user in localStorage");
    }
  } catch (error) {
    console.error("❌ [Auth] Session validation failed:", error);
    logout();
  }
}