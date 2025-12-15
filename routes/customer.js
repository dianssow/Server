import express from 'express'
import {addCustomer, getCustomers, updateCustomer, deleteCustomer} from '../controllers/customerController.js'
import authMiddleware from '../middleware/authmiddleware.js'
const router = express.Router()

router.post('/add', addCustomer)
router.get('/', getCustomers)
router.put('/:id', updateCustomer)
router.delete('/:id', deleteCustomer)

export default router  