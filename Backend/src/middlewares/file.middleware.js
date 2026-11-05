const multer = require("multer")

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Enforce PDF MIME types and file extension
        const isPdfMime = file.mimetype === "application/pdf"
        const isPdfExt = file.originalname.toLowerCase().endsWith(".pdf")

        if (isPdfMime && isPdfExt) {
            cb(null, true)
        } else {
            const error = new Error("Invalid file format. Only PDF files are allowed.")
            error.code = "INVALID_FILE_TYPE"
            cb(error, false)
        }
    }
})

module.exports = upload
