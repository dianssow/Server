import { addCategoryToDB, deleteCategoryFromDB, getAllCategorys, getCategoryById, getCategoryByName, updateCategoryInDB } from '../models/category.js'
const addCategory = async(req, res) => {
    try {
        
        const {categoryName} = req.body 
        const imagePath = req.file ? `uploads/${req.file.filename}`: null

        
         if (!categoryName || !imagePath  ) {
         return res.status(400).json({ success: false, message: "Tous les champs sont requis" });
        }

        const existingCategory = await getCategoryByName(categoryName)
        if(existingCategory) {
            return res.status(400).json({ success: false, message: `Catégorie existe dejà`})
        }

        const categoryData = {
            image:imagePath,
            categoryName
        }
        const newCategory = await addCategoryToDB(categoryData)
        return res.status(201).json({success: true, mesage: `Categeory ${newCategory.categoryName} ajoute avec succes` } )

    } catch (error) { 
        console.error('Erreur categorie non ajoutee', error );
        return res.status(500).json({ success: false, message: ' Erreur serveur '})
        
    }
}

const getCategories = async (req, res) => {
    try {
        const categories = await getAllCategorys()
            return res.status(200).json({ success: true, categories})

    } catch (error) {
            return res.status(400).json({ success: false, message: `Erreur du serveur / categories`})
        
    }
}

    const updateCategory = async(req, res) => {
        try {
            const {id} = req.params
            const {categoryName} = req.body 
            const imagePath = req.file ? `uploads/${req.file.filename}` : null
            
            const existingCategory = await getCategoryById(id)
            if(!existingCategory) {
                return res.status(404).json({ success: false, message: `Categorie introuvable`})
            }

            const updateData = {}
            if (categoryName !== undefined) updateData.categoryName = categoryName.trim()
            if (imagePath !== undefined) updateData.imagePath = imagePath

            const updatedCategory = await  updateCategoryInDB(
                id,
                updateData
            )
            return res.status(200).json( {success:true, message:"category ajoutee avec succes"})

        } catch (error) {
            console.error('Erreur categorie non ajoutee', error );
            return res.status(500).json({ success: false, message: ' Erreur serveur '})
            
        }
    }
const deleteCategory = async(req, res) => {
    try {
        const {id} = req.params
        
        const existingCategory = await getCategoryById(id)
        if(!existingCategory) {
            return res.status(404).json({ success: false, message: `Categorie introuvable`})
        }
        
        await Product.updateMany({ categoryId: id }, { $set: { categoryId: null } })
        await deleteCategoryFromDB(id)
        
        return res.status(200).json( {success:true, message:"category et ses produits supprimes avec succes"})

    } catch (error) {
        console.error('Erreur categorie non supprime', error );
        return res.status(500).json({ success: false, message: ' Erreur serveur ', error})
        
    }
}

export {addCategory, getCategories, updateCategory, deleteCategory}