const rateLimit = require("express-rate-limit")

/**
 * Rate limiter for authentication routes (login / register)
 * Prevents brute-force credential stuffing.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Max 20 requests per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many authentication attempts. Please try again after 15 minutes."
    }
})

/**
 * Rate limiter for resource-intensive AI generation routes
 * Prevents Gemini API quota exhaustion and denial-of-service.
 */
const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 15, // Max 15 AI reports/evaluations per hour per user/IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "AI generation rate limit exceeded. Please wait a while before requesting again."
    }
})

module.exports = { authLimiter, aiLimiter }

