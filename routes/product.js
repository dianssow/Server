import express from 'express'
import multer from 'multer'
import {getProducts, addProduct, updateProduct, deleteProduct,getProductsByCategory, getFeaturedProducts, toggleFeaturedProduct} from '../controllers/productController.js'
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


router.post('/add', upload.single("image"),addProduct)
router.get('/', getProducts)
router.put('/:id',upload.single("image"), updateProduct)
router.delete('/:id', deleteProduct)

router.get('/category/:categoryId', getProductsByCategory)
router.get('/featured', getFeaturedProducts)
router.put('/:id/featured', toggleFeaturedProduct)



export default router