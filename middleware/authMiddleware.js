import jwt from "jsonwebtoken"
import { getUserById } from '../models/user.js'

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]
        if (!token) {
            return res.status(401).json({ success: false, message: "Pas d'accès, token manquant" })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ success: false, message: "Token invalide" })
        }

        const user = await getUserById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: "Utilisateur introuvable" })
        }

        req.user = user
        next()
    } catch (error) {
        console.error("Erreur authMiddleware :", error);
        return res.status(500).json({ success: false, message: "Erreur serveur / middleware" })
    }
};

export default authMiddleware;