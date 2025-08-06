import { getService } from "$lib/core/ServiceContainer";

/* ── private reactive fields ── */
let _user = $state(
   localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null
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
   console.log("🔐 [Auth] Setting user:", _user);
   console.log("🔐 [Auth] User localStorage:", localStorage.getItem("user"));
   console.log("🔐 [Auth] User authenticated:", user.email);
}

export function logout() {
   _user = null;
   _isAuthenticated = false;
   localStorage.removeItem("user");
   console.log("🔐 [Auth] User logged out");
}

export async function initializeAuth() {
   try {
      console.log("🔐 [Auth] _user:", _user);
      // If we have user in localStorage, validate the session
      if (_user) {
         const authService = getService("authService");
         const isValid = await authService.validateSession();

         console.log("🔐 [Auth] Session validation result:", isValid);

         if (!isValid) {
            logout();
         }
      }
      console.log("🔐 [Auth] Auth state initialized");
   } catch (error) {
      console.log("🔐 [Auth] Session validation failed, clearing auth");
      logout();
   }
}
