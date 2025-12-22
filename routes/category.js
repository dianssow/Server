import express from 'express'
import multer from 'multer'
import {addCategory, getCategories, updateCategory, deleteCategory} from '../controllers/categoryController.js'
const router = express.Router()

const upload = multer({ storage: multer.memoryStorage() });

router.post('/add', upload.single("image"),addCategory)
router.get('/', getCategories)
router.put('/:id',upload.single("image"), updateCategory)
router.delete('/:id', deleteCategory)

export default router