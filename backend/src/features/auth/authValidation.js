import * as v from 'valibot';

export const registerBusinessRules = v.object({
    email: v.pipe(
        v.string(),
        v.trim(),
        v.toLowerCase(),
        v.email('Please enter a valid email address')
    ),
    password: v.pipe(
        v.string(),
        v.minLength(8, 'Password must be at least 8 characters'),
        v.regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password must contain uppercase, lowercase, and number'
        )
    ),
    role: v.optional(v.picklist(['admin', 'dev', 'viewer']), 'dev'),
});

export const loginBusinessRules = v.object({
    email: v.pipe(
        v.string(),
        v.trim(),
        v.toLowerCase(),
        v.email('Please enter a valid email address')
    ),
    password: v.string(),
});