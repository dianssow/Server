import { addVersementToDB, getAllVersements,updateVersementInDB, getVersementsByCustomer } from "../models/saleModels/versement.js"
import { getCashShiftsByStatus } from "./cashController.js"
import { addCashMovementToDB} from "../models/cashModels/cashMovement.js"
import { getSalesByCustomer } from "../models/saleModels/sale.js"
import { db } from "../firebase.js"

export const addVersement = async (req, res) => {
  try {
    const { amount, customerId, motif, method } = req.body
    const userId = req.user?.id

    if (!amount || !customerId) {     
      return res.status(400).json({
         success: false,
         message: "Montant et Nom du Client requis"
         })
      
    }
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Utilisateur non authentifié" 
      })
    }

    const openShifts = await getCashShiftsByStatus("OPEN")
    if (!openShifts || openShifts.length === 0) return res.status(400).json({ success: false, message: "Aucune session ouverte" })

      const currentShift = openShifts[0]

      const motifText = motif || null

      const customerDoc = await db .collection("customers").doc(customerId).get()
      if (!customerDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: "Client introuvable" 
      })
    }
      const customerData = customerDoc.data() 

    const versementNumber = `VRS-${Date.now()}`

    const newVersement = await addVersementToDB({
      versementNumber,
      method: method || "Versement",
      amount,
      motif: motifText, 
      customerId,
      customerName: customerData?.name || null,
      customerAddress: customerData?.address || null,
      userId,
      shiftId: currentShift.id
    })

    const sales = await getSalesByCustomer(customerId)
    const totalSalesDue = sales.reduce((acc, sale) => {
      if (sale.paymentType !== "Espèces") {
        return acc + (sale.totalAmount - (sale.givenAmount || 0))
      }
      return acc
    }, 0)

    const versements = await getVersementsByCustomer(customerId)
    const totalPaid = versements.reduce((acc, v) => acc + v.amount, 0)

    const balanceAfter = totalSalesDue - totalPaid
    await updateVersementInDB(newVersement.id, {balanceAfter})  
    newVersement.balanceAfter = balanceAfter

    
      await addCashMovementToDB({
        type: "ENC",
        method: "Versement",
        amount: Math.abs(amount),
        userId,
        customerId,
        shiftId: currentShift.id,
        relatedVersementId: newVersement.id,
        reason: `Versement n°${versementNumber}`
      })

    res.status(201).json({ success: true, message: "Versement enregistré", versement: newVersement, balanceAfter })
  } catch (error) {
    console.error("Erreur ajout Versement", error.message)
    res.status(500).json({ success: false, message: "Erreur serveur" })
  }
}

export const getVersements = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50
    const versements = await getAllVersements({limit})
    res.status(200).json({ success: true, versements })
  } catch (error) {
    console.error("Erreur lors de la récupération des versements:", error)
    res.status(500).json({ success: false, message: "Erreur serveur" })
  }
}

export const getCustomerVersements = async (req, res) => {
  try {
    const { id } = req.params
    const versements = await getVersementsByCustomer(id)
    res.status(200).json({ success: true, versements })
  } catch (error) {
    console.error("Erreur récupération versements client:", error)
    res.status(500).json({ success: false, message: "Erreur serveur" })
  }
}

export const getCustomerBalance = async (req, res) => {
  try {
    const { id: customerId } = req.params
    const sales = await getSalesByCustomer(customerId)

    const totalSalesDue = sales.reduce((acc, sale) => {
      if (sale.paymentType !== "Espèces") {
        const amountDue = sale.totalAmount - (sale.givenAmount || 0)
        return acc + amountDue
      }
      return acc
    }, 0)

    const versements = await getVersementsByCustomer(customerId)
    const totalPaid = versements.reduce((acc, v) => acc + v.amount, 0)

    const balance = totalSalesDue - totalPaid
    res.json({ balance })
  } catch (error) {
    console.error("Erreur calcul balance client :", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
}

         