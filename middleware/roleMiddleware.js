const checkRole = (roles) => {
    return (req, res, next) => {
        if(!req.user) {
            return res.status(401).json({ success: false, message: "Utilisateur non connecte"})
        }

        if(!roles.includes(req.user.role)) {
             return res.status(401).json({ success: false, message: "Acces refuse/role"})
        }
        next()
    }
}

export default checkRole