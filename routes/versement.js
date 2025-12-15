import express from 'express'
import {addVersement, getVersements, getCustomerVersements, getCustomerBalance} from '../controllers/versementController.js'
import authMiddleware from '../middleware/authmiddleware.js' 
const router = express.Router()

router.post('/add',authMiddleware, addVersement)
// router.delete('/:id',authMiddleware, deleteVersement)
router.get('/', getVersements)
router.get('/customer/:id', getCustomerVersements)
router.get('/balance/:id', getCustomerBalance)

export default router