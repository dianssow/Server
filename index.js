import { onRequest } from 'firebase-functions/v2/https'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import categoryRoutes from './routes/category.js'
import customerRoutes from './routes/customer.js'
import productRoutes from './routes/product.js'
import userRoutes from './routes/user.js'
import saleRoutes from './routes/sale.js'
import cashRoutes from './routes/cashRoutes.js'
import versementRoutes from './routes/versement.js'
import supplierRoutes from './routes/supplier.js'

const allowedOrigins = [
    'https://caisse-gap.web.app',
    'https://backoffice-gap.web.app',
    'http://localhost:5173',
    'http://localhost:5174'
]

const app = express()

app.use(cors({
    origin: (origin, callback) => {
        if(!origin) return callback(null, true)
        const isAllowed = allowedOrigins.some(allowed =>
            allowed === origin || allowed === origin + '/' || allowed + '/' === origin
        )
        if(isAllowed) return callback(null, true)
        callback(new Error("Non autorisé par CORS"))
    },
    credentials: true,
}))

app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/category', categoryRoutes)
app.use('/api/customer', customerRoutes)
app.use('/api/product', productRoutes)
app.use('/api/user', userRoutes)
app.use('/api/sale', saleRoutes)
app.use('/api/cash', cashRoutes)
app.use('/api/versement', versementRoutes)
app.use('/api/supplier', supplierRoutes)

 export const api = onRequest({
  secrets: ["JWT_SECRET"]
}, app)