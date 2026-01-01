import express from 'express'
import {addSale, getSales, getCustomerSales, editSale, deleteSale} from '../controllers/saleController.js'
import authMiddleware from '../middleware/authMiddleware.js'
const router = express.Router()

router.post('/add',authMiddleware, addSale)
router.get('/', getSales)
router.get('/customer/:id', getCustomerSales)
router.put("/edit/:id", authMiddleware, editSale)
router.delete('/:id',authMiddleware, deleteSale)

export default router