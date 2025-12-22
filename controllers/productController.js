import  { getCategoryById } from "../models/category.js"
import  { addProductToDB, deleteProductFromDB, getAllProducts, getProductById, getProductByName,getProductsByCategoryFromDb, updateProductInDB, getFeaturedProductsFromDB } from"../models/product.js"

const addProduct = async(req, res) => {
    try {
        
        const {name, stockCartons,piecesPerCarton, retailPrice,wholesalePrice, categoryId} = req.body 

         let imageUrl = null
        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            let mimeType = req.file.mimetype; 
            imageUrl = `data:${mimeType};base64,${b64}`;
        }
        if (!imageUrl || !name || !stockCartons  || !retailPrice || !wholesalePrice || !categoryId) {
        return res.status(400).json({ success: false, message: "Tous les champs sont requis" })
       }

       if(Number(piecesPerCarton) <= 0){
        return res.status(400).json({ success: false, message: "Le nombre de pieces par produit doit etre superieur a zéro" });
           
       }

       const categoryExists = await getCategoryById(categoryId);
      if (!categoryExists) {
      return res.status(400).json({ success: false, message: "Catégorie invalide" });
     }
       
       const existingProduct = await getProductByName (name)
       if(existingProduct) {
           return res.status(400).json({ success: false, message: `Produit existe dejà`})
       }
        const newProductData =  ({
            image:imageUrl,
            name: name.trim(),
            stockCartons: Number(stockCartons), 
            piecesPerCarton: Number(piecesPerCarton), 
            unit: "piece",
            retailPrice:Number(retailPrice),
            wholesalePrice: Number(wholesalePrice),
            categoryId,
            featured: false
        })
        const newProduct = await addProductToDB(newProductData)
        return res.status(201).json({success: true, message: `Produit ${ newProduct.name} ajouté avec succes`
        })

    } catch (error) {
        console.error('Erreur Produit non ajoute', error.message );
        return res.status(500).json({ success: false, message: ' Erreur serveur '})
        
    }
}

const getProducts = async (req, res) => {
    try {
        const products = await getAllProducts()
        const productsWithCategories = await Promise.all(
            products.map(async (product) => {
                if(product.categoryId) {
                    const category = await getCategoryById(product.categoryId)
                    return {
                        ...product,
                        totalStock: (product.stockCartons * product.piecesPerCarton) + product.stockPieces,
                        OriginalCategoryId: product.categoryId,
                        categoryId: category ? {
                            id: category.id,
                            ...category
                        } : null
                    }
                } 
                
                return product
            })
        )
            return res.status(200).json({ success: true, products: productsWithCategories

            })

    } catch (error) {
            return res.status(400).json({ success: false, message: `Erreur du serveur / product`})
        
    }
}

const getProductsByCategory = async(req, res) => {
    try {
        const {categoryId} = req.params 

        
        const categoryExists = await getCategoryById(categoryId)
        if(!categoryExists) {
            return res.status(404).json({ success: false, message: "Categorie introuvable"})
        }
        const products = await getProductsByCategoryFromDb(categoryId)
        
           const productsWithCategories = products.map(product => ({
            ...product,
            totalStock: (product.stockCartons * product.piecesPerCarton) + product.stockPieces,
            category: categoryExists
           }))
        return res.status(200).json({ success: true, products:productsWithCategories})
    } catch (error) {
            return res.status(500).json({ success: false, message: `Erreur du serveur / product`, error})
    
    }
}

const getFeaturedProducts = async (req, res) => {
    try {
        const products =await getFeaturedProductsFromDB()
        const LimitedProducts = products.slice(0, 15)
        const productsWithCategories = await Promise.all(
            LimitedProducts.map(async(product) => {
                if(product.categoryId) {
                    const category = await getCategoryById(product.categoryId)
                    return {
                        ...product,
                        totalStock: (product.stockCartons * product.piecesPerCarton) + product.stockPieces,
                        category: category || null
                    }
                }
                return product
            })
        )
        return res.status(200).json({ success: true, products: productsWithCategories})

    } catch (error) {
            return res.status(400).json({ success: false, message: `Erreur du serveur / product`})
      }

}

const toggleFeaturedProduct = async (req, res) => {
  try { 
    const { id } = req.params
    const product = await getProductById(id)
    if (!product) {
      return res.status(404).json({ success: false, message: "Produit introuvable" })
    }
    const updatedProduct = await updateProductInDB(id, {
      featured : !product.featured
    })

    return res.status(200).json({ success: true, message: "Produit mis à jour", product:updatedProduct })
  } catch (error) {
    console.error("Erreur toggle featured/Product", error)
    return res.status(500).json({ success: false, message: "Erreur serveur" })
  }
}


const updateProduct = async(req, res) => {
    try {
        const {id} = req.params
        const {
             name,
             stockCartons,
             piecesPerCarton,
             stockPieces,
             retailPrice,
             wholesalePrice,
             categoryId} = req.body 

        
        const existingProduct = await getProductById (id)
        if(!existingProduct) {
            return res.status(404).json({ success: false, message: `Produit introuvable`})
        }

        const updateProductData = {}
    
        if (name) updateProductData.name = name.trim();
        if (stockCartons !== undefined) updateProductData.stockCartons = Number(stockCartons);
        if (stockPieces!== undefined) updateProductData.stockPieces = Number( stockPieces);
        if (piecesPerCarton !== undefined) {
            const newPiecesPerCarton = Number(piecesPerCarton)
            if(newPiecesPerCarton <= 0){
              return res.status(400).json({ success: false, message: "Le nombre de pieces par produit doit etre superieur a zéro" });
            }
            updateProductData.piecesPerCarton = newPiecesPerCarton
            } 
        if (retailPrice !== undefined) updateProductData.retailPrice = Number(retailPrice);
        if (wholesalePrice !== undefined) updateProductData.wholesalePrice = Number(wholesalePrice);
        if (categoryId) updateProductData.categoryId = categoryId
    
    
        let imageUrl = null;
         if (req.file) {
            // Convertir le buffer de l'image en chaine Base64
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            // Creation d'une "Data URL" complète
            let mimeType = req.file.mimetype; 
            imageUrl = `data:${mimeType};base64,${b64}`;
        }
         if (imageUrl) {
            updateProductData.image = imageUrl
        }

        const newProduct = await updateProductInDB(
            id,
            updateProductData,    
            )
        return res.status(200).json( {success:true, message:`Produit ${newProduct} modifee avec succes`})

    } catch (error) {
        console.error('Erreur Produit non modifie', error );
        return res.status(500).json({ success: false, message: ' Erreur serveur '})
        
    }
}


const deleteProduct = async(req, res) => {
    try {
        const {id} = req.params
        
        const existingProduct = await getProductById(id)
        if(!existingProduct) {
            return res.status(404).json({ success: false, message: `Product introuvable`})
        }

        await deleteProductFromDB(id)
        
        return res.status(200).json( {success:true, message:"Product supprime avec succes"})

    } catch (error) {
        console.error('Erreur Product non supprime', error );
        return res.status(500).json({ success: false, message: ' Erreur serveur '})
        
    }
}
export {addProduct,getProducts,updateProduct, deleteProduct, getProductsByCategory, getFeaturedProducts, toggleFeaturedProduct} 