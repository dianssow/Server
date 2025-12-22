import bcrypt from 'bcrypt'
import { db } from "./firebase.js" 
const userSeed = async () => {
    try {
        const hashPassword = await bcrypt.hash("admin",10 )
        const newUser = {
             name:     "admin",
             email:    "admin@gmail.com",
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