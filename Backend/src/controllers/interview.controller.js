const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf, evaluateCandidateAnswer } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        const { selfDescription, jobDescription } = req.body

        if (!jobDescription || !jobDescription.trim()) {
            return res.status(400).json({
                message: "Target job description is required."
            })
        }

        if (!req.file && (!selfDescription || !selfDescription.trim())) {
            return res.status(400).json({
                message: "Please provide either a resume PDF or a self description."
            })
        }

        let resumeText = ""
        if (req.file) {
            try {
                const parsedPdf = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
                resumeText = parsedPdf.text || ""
            } catch (pdfErr) {
                console.error("PDF Parsing error:", pdfErr)
                return res.status(400).json({
                    message: "Failed to read resume PDF. Please ensure it is not password protected or corrupted."
                })
            }
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription,
            ...interViewReportByAi
        })

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (err) {
        console.error("Generate report error:", err)
        res.status(500).json({
            message: "An error occurred while generating the interview plan. Please try again."
        })
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params

        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport
        })
    } catch (err) {
        console.error("Fetch report error:", err)
        res.status(500).json({
            message: "Failed to retrieve interview report."
        })
    }
}

/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

        res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        })
    } catch (err) {
        console.error("Fetch all reports error:", err)
        res.status(500).json({
            message: "Failed to retrieve past interview plans."
        })
    }
}

/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)
    } catch (err) {
        console.error("Resume PDF generation error:", err)
        res.status(500).json({
            message: "Failed to generate resume PDF."
        })
    }
}

/**
 * @description Controller to evaluate a candidate's response to an interview question.
 */
async function evaluateAnswerController(req, res) {
    const { question, modelAnswer, candidateAnswer } = req.body

    if (!question || !candidateAnswer) {
        return res.status(400).json({
            message: "Question and candidate answer are required."
        })
    }

    try {
        const feedback = await evaluateCandidateAnswer({
            question,
            modelAnswer: modelAnswer || "",
            candidateAnswer
        })

        res.status(200).json({
            message: "Answer evaluated successfully.",
            feedback
        })
    } catch (err) {
        console.error("Evaluation error:", err)
        res.status(500).json({ 
            message: "Failed to evaluate answer." 
        })
    }
}

module.exports = { 
    generateInterViewReportController, 
    getInterviewReportByIdController, 
    getAllInterviewReportsController, 
    generateResumePdfController, 
    evaluateAnswerController 
}
