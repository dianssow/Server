import { db } from "../firebase.js";

const productCollection = db.collection("products");

const updateStockOnTransaction = async (productId, quantity, unit, isReturn) => {


     if (!productId || typeof productId !== 'string' || productId.trim().length === 0) {
        throw new Error("Erreur de validation: L'ID produit (documentPath) est manquant ou invalide.");
    }
    const productRef = productCollection.doc(productId);

    return db.runTransaction(async (transaction) => {
        const doc = await transaction.get(productRef);

        if (!doc.exists) {
            throw new Error(`Produit introuvable avec l'ID: ${productId}`);
        }

        const product = doc.data();
        const { stockCartons, stockPieces, piecesPerCarton } = product;

        if (piecesPerCarton <= 0) {
             throw new Error("Erreur: piecesPerCarton doit être > 0.");
        }

        let totalPiecesInStock = (stockCartons * piecesPerCarton) + stockPieces;
        let piecesToAdjust = 0;

        if (unit === 'carton') {
            piecesToAdjust = quantity * piecesPerCarton;
        } else if (unit === 'piece') {
            piecesToAdjust = quantity;
        } else {
             throw new Error(`Unité de transaction invalide: ${unit}`);
        }
        
        let newTotalPieces = totalPiecesInStock;

        if (isReturn) {
            newTotalPieces += piecesToAdjust;
        } else {
            // Décrémenter (Vente)
            if (totalPiecesInStock < piecesToAdjust) {
                throw new Error(`Stock insuffisant pour le produit ${product.name}. Stock actuel: ${totalPiecesInStock} pièces.`);
            }
            newTotalPieces -= piecesToAdjust;
        }

        // Reconverser le nouveau stock total en Cartons et Pièces restantes
        const newStockCartons = Math.floor(newTotalPieces / piecesPerCarton);
        const newStockPieces = newTotalPieces % piecesPerCarton;

        // Appliquer la mise à jour dans la transaction
        transaction.update(productRef, {
            stockCartons: newStockCartons,
            stockPieces: newStockPieces,
            updatedAt: new Date().toISOString()
        });

        console.log(`Stock mis à jour pour ${product.name}: ${stockCartons}C/${stockPieces}P -> ${newStockCartons}C/${newStockPieces}P`);

        // Renvoyer les nouvelles données de stock pour confirmation
        return {
            ...product,
            stockCartons: newStockCartons,
            stockPieces: newStockPieces,
        };
    });
};

  const addProductToDB = async (data) => {
  const docRef = await productCollection.add({
    ...data,
    nameLower: data.name.trim().toLowerCase(),
    stockPieces: 0,
    createdAt: new Date().toISOString()
  });
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}
  const getProductsByCategoryFromDb = async (categoryId) => {
    const snapshot = await productCollection
    .where("categoryId", "==", categoryId)
    .orderBy('createdAt', 'desc')
    .get()
    if(snapshot.empty) return []
    return snapshot.docs.map((doc)=> ({ id: doc.id, ...doc.data() }))
  }

  const getAllProducts = async () => {
  const snapshot = await productCollection.get();
  const products =  snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  return products
}
const getProductByName = async (name) => {
  if (!name) return null;
  const normalizedName = name.trim().toLowerCase();
  const snapshot = await productCollection
    .where("nameLower", "==", normalizedName)
    .limit(1)
    .get();
  
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

const getFeaturedProductsFromDB = async () => {
    const snapshot = await productCollection
    .where("featured", "==", true)
    .orderBy('createdAt', 'desc')
    .get()

    return snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}))
}


  const getProductById = async (id) => {
  const doc = await productCollection.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

  const updateProductInDB = async (id, data) => {
  await productCollection.doc(id).update({
    ...data,
    updatedAt: new Date().toISOString()
});
  const updatedDoc = await productCollection.doc(id).get();
  return { id: updatedDoc.id, ...updatedDoc.data() };
}

  const deleteProductFromDB = async (id) => {
  await productCollection.doc(id).delete();
}

export {addProductToDB, updateStockOnTransaction,getAllProducts,getProductById,updateProductInDB,deleteProductFromDB,getProductByName,getFeaturedProductsFromDB, getProductsByCategoryFromDb}