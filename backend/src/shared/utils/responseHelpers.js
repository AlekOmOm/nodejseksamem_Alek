export const sendSuccess = (res, data, statusCode = 200) => {
    return res.status(statusCode).json(data);
};

export const sendError = (res, error, statusCode = 500) => {
    const errorMessage = typeof error === 'string' ? error : error.message || 'An error occurred';
    const errorResponse = {
        error: typeof error === 'object' && error.name ? error.name : 'ServerError',
        message: errorMessage,
    };
    return res.status(statusCode).json(errorResponse);
};

export const sendCreated = (res, data) => sendSuccess(res, data, 201);
export const sendUnauthorized = (res, message = 'Unauthorized') => sendError(res, { name: 'AuthenticationError', message }, 401);
export const sendForbidden = (res, message = 'Forbidden') => sendError(res, { name: 'AuthorizationError', message }, 403);
export const sendConflict = (res, message = 'Resource already exists') => sendError(res, { name: 'ConflictError', message }, 409);
export const sendUnprocessableEntity = (res, message = 'Validation failed') => sendError(res, { name: 'ValidationError', message }, 422);
export const sendInternalServerError = (res, message = 'Internal server error') => sendError(res, { name: 'InternalServerError', message }, 500);