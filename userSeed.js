import bcrypt from 'bcrypt'
import { db } from "./firebase.js" 
const userSeed = async () => {
    try {

         const password = process.env.ADMIN_PASSWORD;
    const email = process.env.ADMIN_EMAIL

        const hashPassword = await bcrypt.hash(password,12 )
        const newUser = {
             name:     "admin",
             email,
             password:  hashPassword,
             address:  "admin address",
             role:     "admin"
                }

                await db.collection("users").add(newUser)
                console.log("Admin user crée");
                
    } catch (error) {
        console.log(error);
        
        
    }
}

userSeed()