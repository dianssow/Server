import express from 'express'
import {addSupplier, getSuppliers, updateSupplier, deleteSupplier, addSupplierInvoice, getSupplierInvoices,addSupplierVersement,getSupplierVersements, getBalance , editInvoice, removeInvoice, editVersement, removeVersement} from '../controllers/supplierController.js'
import authMiddleware from '../middleware/authMiddleware.js'
const router = express.Router()

router.post('/add', authMiddleware, addSupplier)
router.get('/', authMiddleware, getSuppliers)
router.put('/:id', authMiddleware, updateSupplier)
router.delete('/:id', authMiddleware, deleteSupplier)
router.post('/:supplierId/invoice/add', authMiddleware, addSupplierInvoice)
router.get('/:supplierId/invoices', authMiddleware, getSupplierInvoices)
router.post('/:supplierId/versement/add', authMiddleware, addSupplierVersement)
router.get('/:supplierId/versements', authMiddleware, getSupplierVersements)
router.get('/:supplierId/balance', authMiddleware, getBalance)
router.put("/:supplierId/invoice/:invoiceId", authMiddleware, editInvoice)
router.delete("/:supplierId/invoice/:invoiceId", authMiddleware, removeInvoice)
router.put("/:supplierId/versement/:versementId", authMiddleware, editVersement)
router.delete("/:supplierId/versement/:versementId", authMiddleware, removeVersement)
export default router  