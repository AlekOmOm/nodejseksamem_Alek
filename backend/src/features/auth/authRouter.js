import express from "express";
import AuthService from "./AuthService.js";
import isAuthenticated from "../../shared/middleware/authorization.js";
import {
  sendSuccess,
  sendCreated,
  sendUnauthorized,
  sendConflict,
  sendUnprocessableEntity,
  sendInternalServerError,
} from "../../shared/utils/responseHelpers.js";

export function createAuthRouter() {
  const router = express.Router();
  const service = new AuthService();

  router.post("/register", async (req, res) => {
    console.log("🔍 [Auth] Register request received:");
    console.log("  - Body:", JSON.stringify(req.body, null, 2));
    console.log("  - Headers:", req.headers["content-type"]);

    try {
      const userData = req.body;
      console.log("🔍 [Auth] Parsed userData:", userData);

      const newUser = await service.register(userData);
      console.log("✅ [Auth] User registered successfully:", newUser.email);
      return sendCreated(res, newUser);
    } catch (error) {
      console.log("❌ [Auth] Registration error:", error.message);
      console.log("❌ [Auth] Error name:", error.name);

      if (error.message === "Email already registered") {
        return sendConflict(res, "Email already registered");
      }
      if (error.name === "ValiError") {
        console.log("❌ [Auth] Validation issues:", error.issues);
        const validationMessage = error.issues
          .map((issue) => issue.message)
          .join(", ");
        return sendUnprocessableEntity(res, validationMessage);
      }
      return sendInternalServerError(res, error.message);
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await service.login(email, password);

      req.session.userId = user.id;
      req.session.role = user.role;
      return sendSuccess(res, user);
    } catch (error) {
      if (error.message === "Invalid credentials") {
        return sendUnauthorized(res, "Email or password is incorrect. Please try again.");
      }
      if (error.name === "ValiError") {
        const validationMessage = error.issues
          .map((issue) => issue.message)
          .join(", ");
        return sendUnprocessableEntity(res, validationMessage);
      }
      return sendInternalServerError(res, "Login failed. Please try again.");
    }
  });

  router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return sendInternalServerError(res, "Failed to logout");
      }
      res.clearCookie("connect.sid");
      return sendSuccess(res, { message: "Logged out successfully" });
    });
  });

  router.get("/me", isAuthenticated, async (req, res) => {
    try {
      const user = await service.getCurrentUser(req.user.id);
      return sendSuccess(res, user);
    } catch (error) {
      if (error.message === "User not found") {
        return sendUnauthorized(res, "Invalid session");
      }
      return sendInternalServerError(res, error.message);
    }
  });

  router.delete("/user", isAuthenticated, async (req, res) => {
    try {
      const deletedUser = await service.deleteUser(req.user.id);
      
      // Destroy session after successful deletion
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
        res.clearCookie("connect.sid");
      });
      
      return sendSuccess(res, { message: "User deleted successfully", user: deletedUser });
    } catch (error) {
      if (error.message === "User not found") {
        return sendUnauthorized(res, "User not found");
      }
      return sendInternalServerError(res, error.message);
    }
  });

  router.delete("/user/all-data", isAuthenticated, async (req, res) => {
    try {
      const deletedUser = await service.deleteAllUserData(req.user.id);
      
      // Destroy session after successful deletion
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
        res.clearCookie("connect.sid");
      });
      
      return sendSuccess(res, { message: "All user data deleted successfully", user: deletedUser });
    } catch (error) {
      if (error.message === "User not found") {
        return sendUnauthorized(res, "User not found");
      }
      return sendInternalServerError(res, error.message);
    }
  });

  return router;
}
