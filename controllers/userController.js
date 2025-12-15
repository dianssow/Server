import { addUserToDB, deleteUserFromDB, getAllUsers, getUserByEmail, getUserById, updateUserInDB } from "../models/user.js"
import bcrypt from 'bcrypt'
const addUser = async(req, res) => {
    try {
        
        if (req.user.role !== "admin") {
            return res.status(403).json({ success: false,message: "Seul un admin peut créer un utilisateur"
            });
        }
        const {name, email, password, address, role} = req.body 

        
        const existingUser = await getUserByEmail ( email)
        if(existingUser) {
            return res.status(400).json({ success: false, message: `User existe dejà`})
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        const userData = {
            name: name.trim(),
            email, 
            password: hashedPassword,
            address,
            role
        }
        const newUser = await addUserToDB(userData)
        return res.status(201).json({success: true, message: `User ${ newUser.name} ajouté avec succes`})

    } catch (error) {
        console.error('Erreur Client non ajoutee', error.message );
        return res.status(500).json({ success: false, message: ' Erreur serveur '})
        
    }
}

const getUsers = async (req, res) => {
    try {
        const users = await getAllUsers()
            return res.status(200).json({ success: true, users})

    } catch (error) {
            return res.status(400).json({ success: false, message: `Erreur du serveur / users`})
        
    }
}

const updateUser = async(req, res) => {
    try {
        const {id} = req.params
        const {name, number, address, birth,role} = req.body 
        
        const existingUser = await getUserById (id)
        if(!existingUser) {
            return res.status(404).json({ success: false, message: `User introuvable`})
        }

        const updatedData = {
            name, 
            number,
            address, 
            birth,
            role
            
        }
        const updatedUser = await updateUserInDB(id, updatedData)
        return res.status(200).json( {success:true, message:"User mis a jour avec succes", user: updatedUser})

    } catch (error) {
        console.error('Erreur de mise a jour  Client ', error );
        return res.status(500).json({ success: false, message: ' Erreur serveur '})
        
    }
}

const deleteUser = async(req, res) => {
    try {
        const {id} = req.params
        
        const existingUser = await getUserById (id)
        if(!existingUser) {
            return res.status(404).json({ success: false, message: `User introuvable`})
        }

        await deleteUserFromDB(id)
        
        return res.status(200).json( {success:true, message:"user supprime avec succes"})

    } catch (error) {
        console.error('Erreur user non supprime', error );
        return res.status(500).json({ success: false, message: ' Erreur serveur '})
        
    }
}


export {addUser, getUsers, updateUser, deleteUser}
