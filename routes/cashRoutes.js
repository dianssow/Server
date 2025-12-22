import express from "express"

import {getCashSummary, getCashMovements, getCashShifts, openShift, closeShift, getDailyReport, createMovement} from "../controllers/cashController.js"
import authMiddleware from "../middleware/authmiddleware.js"

const router = express.Router()

router.get("/summary", getCashSummary)
router.get("/movements", getCashMovements)
router.get("/shifts", getCashShifts)
router.post("/movements", authMiddleware, createMovement)
router.post("/shifts/open", openShift)
router.post("/shifts/close", closeShift)
router.get("/reports/daily", getDailyReport)


export default router