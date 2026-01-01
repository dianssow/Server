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
import dotenv from "dotenv"
import path from "path"  

dotenv.config()
console.log("allowedOrigins:", process.env.CAISSE, process.env.BACKOFFICE)

const allowedOrigins = [
    process.env.CAISSE || 'https://gap-caisse.web.app',
    process.env.BACKOFFICE  || 'https://gap-backoffice.web.app',  
    'http://localhost:5173',
    'http://localhost:5174'
]
const app = express()
app.use((req, res, next) => {
  next()
})

app.use(
    cors({
      origin: (origin, callback) => {
        // Log pour comprendre ce qui se passe
        console.log("DEBUG CORS - Origin reçue:", origin); 

        if(!origin) return callback(null, true);

        // Vérification souple (gère avec ou sans slash final)
        const isAllowed = allowedOrigins.some(allowed => 
            allowed === origin || allowed === origin + '/' || allowed + '/' === origin
        );

        if(isAllowed) {
             return callback(null, true);
        } else {
            console.error(`BLOCAGE CORS : L'origine ${origin} n'est pas dans la liste`, allowedOrigins);
            callback(new Error("Non autorisé par CORS"));
        }
      },
      credentials: true,
    })
)



app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/category', categoryRoutes)
app.use('/api/customer', customerRoutes)
app.use('/api/product', productRoutes)
app.use('/api/user', userRoutes)
app.use('/api/sale', saleRoutes)
app.use('/api/cash', cashRoutes)
app.use('/api/versement', versementRoutes)
app.use('/uploads', express.static(path.join(process.cwd(),"uploads")))
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`le serveur est lancé sur le http://localhost:${PORT} `)
    
})




