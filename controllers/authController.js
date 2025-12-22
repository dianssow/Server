import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import  { getUserByEmail } from '../models/user.js' 

const login = async (req, res) => {
    try {
        const {email, password} = req.body

        const user = await getUserByEmail(email)

        if(!user) {
            return res.status(401).json({success:false, message: "Utilisateur non trouvé"})
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch) {
            return res.status(401).json({success:false, message: "Données invalides"})
        }
        const token = jwt.sign({id: user.id, role: user.role}, process.env.JWT_SECRET, {expiresIn: '18h'})

        return res.status(200).json ({success:true, message:"Utilisateur Connecté", token, user: {id: user.id, name: user.name, email: user.email, role: user.role}})
    }
    catch (error) {
        return res.status(500).json({success:false, message: "Erreur  serveur"})
    }
}

export {login}