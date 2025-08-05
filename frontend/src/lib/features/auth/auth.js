import { getService } from "$lib/core/ServiceContainer";
import { setUser, logout, getIsAuthenticated, getUser } from "$lib/state/auth.state.svelte.js";

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

  async register(userData) {
    console.log("🔍 [AuthService] Register called with:", userData);
    
    const response = await this.api.post(`${this.ENDPOINT}/register`, userData);
    console.log("🔍 [AuthService] API response:", response);
    
    if (response.status === 201) {
      console.log("✅ [AuthService] Setting user:", response.data);
      setUser(response.data);
    }
    return response;
  }

  async login(email, password) {
    const response = await this.api.post(`${this.ENDPOINT}/login`, {
      email,
      password,
    });
    if (response.status === 200) {
      setUser(response.data);
    }
    return response;
  }

  async logout() {
    const response = await this.api.post(`${this.ENDPOINT}/logout`);
    if (response.status === 200) {
      logout();
    }
    return response;
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
