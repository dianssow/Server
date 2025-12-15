import express from 'express'
import {addSale, getSales, getCustomerSales, deleteSale} from '../controllers/saleController.js'
import authMiddleware from '../middleware/authmiddleware.js'
const router = express.Router()

router.post('/add',authMiddleware, addSale)
router.delete('/:id',authMiddleware, deleteSale)
router.get('/', getSales)
router.get('/customer/:id', getCustomerSales)

export default router