import { sendUnauthorized } from "../utils/responseHelpers.js";

/**
 * check isAuthenticated middleware
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {void}
 */
function isAuthenticated(req, res, next) {
  if (typeof req.session.userId !== "string" || !req.session.userId) {
    return sendUnauthorized(res, "Authentication required. Please log in");
  }
  req.user = {
    id: req.session.userId,
    role: req.session.role,
  };
  return next();
}

export default isAuthenticated;
