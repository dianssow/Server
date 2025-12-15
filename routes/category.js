import express from 'express'
import multer from 'multer'
import {addCategory, getCategories, updateCategory, deleteCategory} from '../controllers/categoryController.js'
import authMiddleware from '../middleware/authmiddleware.js'
const router = express.Router()

import fs from "fs"
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads")
    
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
     cb(null, "uploads/")
    },

    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname)
    }
})

const upload = multer({storage})

router.post('/add', upload.single("image"),addCategory)
router.get('/', getCategories)
router.put('/:id',upload.single("image"), updateCategory)
router.delete('/:id', deleteCategory)

export default router