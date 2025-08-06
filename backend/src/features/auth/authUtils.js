import { sendUnauthorized } from "../../shared/utils/responseHelpers.js";

/**
 * Check if user is authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
export function isUserAuthenticated(req, res, next) {
  console.log("🔍 [Auth] Session check:", {
    sessionId: req.sessionID,
    userId: req.session?.userId,
    userIdType: typeof req.session?.userId,
    hasSession: !!req.session,
  });

  if (typeof req.session.userId !== "string" || !req.session.userId) {
    console.log("❌ [Auth] Authentication failed");
    return sendUnauthorized(res, "Authentication required. Please log in");
  }

  req.user = {
    id: req.session.userId,
    role: req.session.role,
  };
  return next();
}
