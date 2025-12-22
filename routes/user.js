import express from 'express'
import {addUser,getUsers,updateUser,deleteUser} from '../controllers/userController.js'
import authMiddleware from '../middleware/authmiddleware.js'
import checkRole from'../middleware/roleMiddleware.js'
const router = express.Router()

router.post('/add', authMiddleware, checkRole(["admin"]), addUser)
router.get('/', getUsers)
router.put('/:id',authMiddleware, checkRole(["admin"]), updateUser)
router.delete('/:id',authMiddleware, checkRole(["admin"]), deleteUser)

export default router



