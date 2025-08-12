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
export const sendUnauthorized = (res, message = 'Authentication required. Please log in.') => 
    sendError(res, { name: 'AuthenticationError', message }, 401);
export const sendForbidden = (res, message = 'You do not have permission to perform this action.') => 
    sendError(res, { name: 'AuthorizationError', message }, 403);
export const sendConflict = (res, message = 'This resource already exists. Please use a different name.') => 
    sendError(res, { name: 'ConflictError', message }, 409);
export const sendUnprocessableEntity = (res, message = 'The provided data is invalid. Please check your input.') => 
    sendError(res, { name: 'ValidationError', message }, 422);
export const sendInternalServerError = (res, message = 'Something went wrong on our end. Please try again.') => 
    sendError(res, { name: 'InternalServerError', message }, 500);
