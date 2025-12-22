import express from 'express'
import multer from 'multer'
import { getProducts, addProduct, updateProduct, deleteProduct, getProductsByCategory, getFeaturedProducts, toggleFeaturedProduct } from '../controllers/productController.js'
import authMiddleware from '../middleware/authmiddleware.js'

const router = express.Router()

// Multer en mémoire
const upload = multer({ storage: multer.memoryStorage() })

// Routes
router.post('/add', upload.single("image"), addProduct)
router.get('/', getProducts)
router.put('/:id', upload.single("image"), updateProduct)
router.delete('/:id', deleteProduct)

router.get('/category/:categoryId', getProductsByCategory)
router.get('/featured', getFeaturedProducts)
router.put('/:id/featured', toggleFeaturedProduct)

export default router
