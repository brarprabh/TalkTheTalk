const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json({ limit: "1mb" }))
app.use(express.urlencoded({ extended: true, limit: "1mb" }))
app.use(cookieParser())

const allowedOrigins = [
    "http://localhost:5173",
    process.env.CLIENT_URL
].filter(Boolean)

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or in allowed list
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error("CORS origin not allowed"))
        }
    },
    credentials: true
}))

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")

/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

/* Global error handler for Multer and unexpected exceptions */
app.use((err, req, res, next) => {
    if (err.name === "MulterError") {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                message: "File too large. Maximum allowed size is 5MB."
            })
        }
        return res.status(400).json({
            message: `Upload error: ${err.message}`
        })
    }

    if (err.code === "INVALID_FILE_TYPE") {
        return res.status(400).json({
            message: err.message
        })
    }

    console.error("Unhandled Error:", err.stack || err)
    res.status(err.status || 500).json({
        message: err.message || "Internal server error"
    })
})

module.exports = app
