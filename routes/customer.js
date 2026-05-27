import express from 'express'
import {addCustomer, getCustomers, updateCustomer, deleteCustomer, getCustomerStatement, getCustomersBalancesSummary} from '../controllers/customerController.js'
import authMiddleware from '../middleware/authMiddleware.js'
const router = express.Router()

router.post('/add', addCustomer)
router.get('/', getCustomers)
router.put('/:id', updateCustomer)
router.delete('/:id', deleteCustomer)
router.get("/:id/statement", getCustomerStatement)
router.get("/balances/summary", getCustomersBalancesSummary)
export default router  