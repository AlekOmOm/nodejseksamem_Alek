import { getService } from "$lib/core/ServiceContainer";
import {
   setUser,
   logout,
   getIsAuthenticated,
   getUser,
} from "$lib/state/auth.state.svelte.js";

/**
 * Auth Service class
 *
 * Business logic service for authentication operations.
 * Handles user authentication and session management.
 */
export class AuthService {
   ENDPOINT = "/api/auth";

   constructor(apiClient) {
      this.api = apiClient;
   }

   async validateSession() {
      try {
         const response = await this.api.get(`${this.ENDPOINT}/me`);
         if (response && (response.id || response.email)) {
            // Update user data in case it changed
            setUser(response);
            return true;
         }
         console.log("🔐 [AuthService] Invalid response:", response);
         return false;
      } catch (error) {
         console.log(
            "🔐 [AuthService] Session validation failed:",
            error.message
         );
         return false;
      }
   }

   async register(userData) {
      const response = await this.api.post(
         `${this.ENDPOINT}/register`,
         userData
      );

      if (response && (response.id || response.email)) {
         setUser(response);
      }
      return response;
   }

   async login(email, password) {
      const response = await this.api.post(`${this.ENDPOINT}/login`, {
         email,
         password,
      });
      
      if (response && (response.id || response.email)) {
         setUser(response);
      }
      return response;
   }

   async logout() {
      try {
         await this.api.post(`${this.ENDPOINT}/logout`);
         // Always logout locally, even if API call fails
         logout();
         console.log("✅ [AuthService] Logout successful");
         return { success: true };
      } catch (error) {
         console.error("❌ [AuthService] Logout API call failed:", error);
         // Still logout locally to ensure user gets logged out
         logout();
         return { success: true, warning: "Logout API call failed but user logged out locally" };
      }
   }

   // GDPR delete user
   async deleteUser(id) {
      if (!getIsAuthenticated()) {
         throw new Error("User not authenticated");
      }

      const response = await this.api.delete(`${this.ENDPOINT}/${id}`);
      if (response.status === 200) {
         logout();
      }
      return response;
   }

   // Check current auth status
   isAuthenticated() {
      return getIsAuthenticated();
   }

   // Get current user
   getCurrentUser() {
      return getUser();
   }
}

// Factory function for service container
export function createAuthService(apiClient) {
   return new AuthService(apiClient);
}
