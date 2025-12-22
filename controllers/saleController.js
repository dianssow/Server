import { db, Timestamp} from "../firebase.js"
import { getCashShiftsByStatus } from "./cashController.js"
import { getNextCounterValue } from "../models/saleModels/counter.js"
import { updateStockOnTransaction, getProductById } from "../models/product.js"
import { populateUser, populateCustomer } from "../models/cashModels/cashShift.js"



const salesCollection = db.collection("sales")
const cashMovementsCollection = db.collection("cashMovements")
const customersCollection = db.collection("customers")
const addSale = async (req, res) => {
  try {
    const { customerId, items, paymentType, totalAmount, givenAmount, reste } = req.body
    const userId = req.user?.id

    if (!items || items.length === 0) 
      return res.status(400).json({ success: false, message: "Aucun produit dans la vente" })

    if ((paymentType !== "Espèces" && paymentType !== "Retour") && !customerId)
      return res.status(400).json({ success: false, message: "Un client est requis pour ce mode de paiement" })

    let customerData = null
    if (customerId) {
      const customerDoc = await customersCollection.doc(customerId).get()
      if (!customerDoc.exists) return res.status(404).json({ success: false, message: "Client introuvable" })
      customerData = customerDoc.data()
    }

    const openShifts = await getCashShiftsByStatus("OPEN")
    if (!openShifts || openShifts.length === 0)
      return res.status(400).json({ success: false, message: "Aucune session ouverte" })
    const shift = openShifts[0]

    for(const item of items) {
      try {
        await updateStockOnTransaction(
        item.productId,
        item.quantity,
        item.unit,
        paymentType === "Retour")
        
      } catch (error) {
        const productName = item.name || `ID: ${item.productId}`;
        console.error(`Erreur lors de la mise à jour de stock pour le produit ${productName}: ${error.message}`)
        
      }
    }

    const now = new Date()
    const fullYear = now.getFullYear()
    const prefix = `F${fullYear}`
    const counterValue = await getNextCounterValue(fullYear, "facture")
    const invoiceNumber = `${prefix}-${String(counterValue).padStart(5, "0")}`

    const newSaleRef = salesCollection.doc()
    const newSale = {
      id: newSaleRef.id,
      invoiceNumber,
      customerId: customerId || null,
      customerName: customerData?.name || null,
      customerAddress: customerData?.address || null,
      items,
      paymentType,
      totalAmount,
      givenAmount,
      reste,
      userId,
      shiftId: shift.id,
      createdAt: new Date().toISOString(),
    }
    await newSaleRef.set(newSale)

    const encaissementReel = (paymentType === "Retour" || paymentType === "Espèces") ? totalAmount : givenAmount

    const movementRef = cashMovementsCollection.doc()
    await movementRef.set({
      id: movementRef.id,
      type: paymentType === "Retour" ? "DEC" : "ENC",
      method: paymentType,
      amount: Math.abs(encaissementReel),
      userId,
      customerId: customerId || null,
      shiftId: shift.id,
      reason: `Facture n°${invoiceNumber}`,
      relatedSaleId: newSaleRef.id,
      createdAt: new Date().toISOString(),
    })

    res.status(201).json({ success: true, message: "Vente enregistrée", sale: newSale })

  } catch (error) {
    console.error("Erreur ajout vente:", error)
    return res.status(500).json({ success: false, message: "Erreur serveur" })
  }
}


const getSales = async (req, res) => {
  try {
    const limit = Math.min(
      parseInt(req.query.limit, 10) || 200,
      500 
    )
    
    const shiftId = req.query.shiftId

    let query = salesCollection
      .orderBy("createdAt", "desc")
      .limit(limit)

    if (shiftId) {
      query = query.where("shiftId", "==", shiftId)
    }

    const snapshot = await query.get()

    const sales = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return res.status(200).json({ 
      success: true, 
      sales,
      hasMore: snapshot.docs.length === limit 
    })

  } catch (error) {
    console.error("Erreur getSales:", error)
    return res.status(500).json({ 
      success: false, 
      message: "Erreur serveur" 
    })
  }
}




const getCustomerSales = async (req, res) => {
  try {
    const { id } = req.params
    const snapshot = await salesCollection.where("customerId", "==", id).orderBy("createdAt", "desc").get()
    const sales = []

    const shiftsSnapshot = await db.collection("cashShifts").get()
    const shiftsMap = {}
    shiftsSnapshot.docs.forEach(doc => shiftsMap[doc.id] = doc.data())

    const customerDoc = await customersCollection.doc(id).get()
    const customerData = customerDoc.exists ? customerDoc.data() : null

    for (const doc of snapshot.docs) {
      const sale = doc.data()
      sales.push({
        ...sale,
         createdAt: new Date().toISOString(),
        customer: customerData,
        shift: sale.shiftId ? shiftsMap[sale.shiftId] || null : null,
      })
    }

    return res.status(200).json({ success: true, sales })
  } catch (error) {
    console.error("Erreur getCustomerSales:", error)
    return res.status(500).json({ success: false, message: "Erreur serveur" })
  }
}

const deleteSale = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ success: false, message: "Seul un admin peut supprimer une facture" })

    const { id } = req.params
    const saleDoc = await salesCollection.doc(id).get()
    if (!saleDoc.exists)
      return res.status(404).json({ success: false, message: "Vente introuvable" })

    const sale = saleDoc.data()

    for(const item of sale.items) {
      const stockUpdateResult = await updateStockOnTransaction( item.productId,
      item.quantity,
      item.unit,
      true)
      if(!stockUpdateResult.success){
        console.error(`Erreur lors de la mise à jour de stock pour le produit ${item.productId}: ${stockUpdateResult.message}`)
      }
    }

    const openShifts = await getCashShiftsByStatus("OPEN")

    if (openShifts.length > 0) {
      const shift = openShifts[0]                                                                    
      const correctionRef = cashMovementsCollection.doc()                               
      await correctionRef.set({
        id: correctionRef.id,
        type: "DEC",
        method: "Retour",     
        amount: sale.totalAmount,
        userId: req.user.id,
        shiftId: shift.id,     
        reason: `Annulation de la Vente ${sale.invoiceNumber}`,
        relatedSaleId: sale.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    await salesCollection.doc(id).delete()
    return res.status(200).json({ success: true, message: "Vente supprimée avec succès" })
  } catch (error) {
    console.error("Erreur suppression vente:", error)
    return res.status(500).json({ success: false, message: "Erreur serveur" })
  }
}

export { addSale, getSales, getCustomerSales, deleteSale }
