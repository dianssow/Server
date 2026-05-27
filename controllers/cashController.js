import { db } from "../firebase.js"
import { 
  getAllCashShifts, 
  getCashShiftById, 
  getCashShiftsByStatus, 
  getMovementsForShift, 
  addCashShiftToDB, 
  updateCashShiftInDB, 
  populateUser, 
  populateCustomer, 
  populateSale, 
} from "../models/cashModels/cashShift.js"


const getCashSummary = async (req, res) => {
  try {
    const openShifts = await getCashShiftsByStatus("OPEN")
    if (!openShifts || openShifts.length === 0) {
      return res.json({ currentBalance: 0, shift: null })
    }
    
    const shift = openShifts.sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt))[0]
    const movements = await getMovementsForShift(shift.id)

    const encaissements = movements
      .filter(m => m.type === "ENC")
      .reduce((sum, m) => sum + Number(m.amount || 0), 0)
    
    const decaissements = movements
      .filter(m => m.type === "DEC")
      .reduce((sum, m) => {
        if (m.method === "Retour") return sum + Math.abs(Number(m.amount) || 0)
        return sum + Number(m.amount || 0)
      }, 0)

    const balance = Number(shift.openingAmount || 0) + encaissements - decaissements
    const user = await populateUser(shift.userId)

    res.json({
      currentBalance: balance,
      shift: {
        id: shift.id,
        status: shift.status,
        userId: user,
        openingAmount: shift.openingAmount,
        openedAt: shift.openedAt,
      },
    })
  } catch (err) {
    console.error("getCashSummary error:", err)
    res.status(500).json({ error: err.message })
  }
}

const createMovement = async (req, res) => {
  try {
    const { type, method, amount, userId, customerId, relatedSaleId, reason } = req.body
    if (!type || !method || !amount) {
      return res.status(400).json({ error: "Données manquantes" })
    }

    const openShifts = await getCashShiftsByStatus("OPEN")
    if (!openShifts || openShifts.length === 0) {
     return res.status(400).json({ error: "Aucune session de caisse ouverte n'a été trouvée pour enregistrer le mouvement." })
     }
     const currentShift = openShifts[0]
     const shiftId = currentShift.id

    const movementRef = db.collection("cashMovements").doc()
    const movement = {
      id: movementRef.id,
      type,
      method,
      amount: Number(amount),
      userId: userId || null,
      customerId: customerId || null,
      shiftId: shiftId,
      relatedSaleId: relatedSaleId || null,
      reason: reason || type || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await movementRef.set(movement)
    res.status(201).json({ success: true, movement })
  } catch (err) {
    console.error("createMovement error:", err)
    res.status(500).json({ error: err.message })
  }
}

const getCashMovements = async (req, res) => {
  try {
    const openShifts = await getCashShiftsByStatus("OPEN")
    if (!openShifts || openShifts.length === 0) {
      return res.json([])
    }

    
    const shift = openShifts[0]
    const movements = await getMovementsForShift(shift.id)
    

    const populatedMovements = await Promise.all(
      movements.map(async (m) => {
        const user = await populateUser(m.userId)
        const customer = await populateCustomer(m.customerId)
        const sale = await populateSale(m.relatedSaleId)
        return { ...m, userId: user, customerId: customer, relatedSaleId: sale }
      })
    )

    res.json(populatedMovements)
  } catch (err) {
    console.error("getCashMovements error:", err)
    res.status(500).json({ error: err.message })
  }
}

const getCashShifts = async (req, res) => {
  try {
    const openShifts = await getCashShiftsByStatus("OPEN")

    const populatedShifts = await Promise.all(
      (openShifts || []).map(async (shift) => {
        const user = await populateUser(shift.userId)
        return { ...shift, userId: user }
      })
    )

    res.json(populatedShifts)
  } catch (err) {
    console.error("getCashShifts error:", err)
    res.status(500).json({ error: err.message })
  }
}

const openShift = async (req, res) => {
  try {
    const { userId, openingAmount } = req.body

    const alreadyOpen = await getCashShiftsByStatus("OPEN")
    if (alreadyOpen && alreadyOpen.length > 0) {
      return res.status(400).json({ error: "Une session est déjà ouverte" })
    }

    const newShift = await addCashShiftToDB({ userId, openingAmount, status: "OPEN" })
    const user = await populateUser(userId)

    res.status(201).json({ ...newShift, userId: user })
  } catch (err) {
    console.error("openShift error:", err)
    res.status(500).json({ error: err.message })
  }
}

const closeShift = async (req, res) => {
  try {
    const { closingAmount } = req.body

    const openShifts = await getCashShiftsByStatus("OPEN")
    if (!openShifts || openShifts.length === 0) {
      return res.status(400).json({ error: "Aucune session ouverte" })
    }

    const shift = openShifts[0]
    const movements = await getMovementsForShift(shift.id)

    const totalEnc = movements
      .filter(m => m.type === "ENC")
      .reduce((sum, m) => sum + Number(m.amount || 0), 0)
    
    const totalDec = movements
      .filter(m => m.type === "DEC")
      .reduce((sum, m) => {
        if (m.method === "Retour") return sum + Math.abs(Number(m.amount) || 0)
        return sum + Number(m.amount || 0)
      }, 0)

    const soldeTheorique = Number(shift.openingAmount || 0) + totalEnc - totalDec
    const ecart = closingAmount - soldeTheorique

    const updatedShift = await updateCashShiftInDB(shift.id, {
      status: "CLOSED",
      closingAmount,
      ecart,
      closedAt: new Date().toISOString()
    })

    const user = await populateUser(updatedShift.userId)
    res.json({ message: "Session fermée avec succès", shift: { ...updatedShift, userId: user } })
  } catch (err) {
    console.error("closeShift error:", err)
    res.status(500).json({ error: err.message })
  }
}

const getDailyReport = async (req, res) => {
  try {
    const { shiftId } = req.query

    let shifts = []
    if (shiftId) {
      const shift = await getCashShiftById(shiftId)
      if (!shift) return res.status(404).json({ error: "Session introuvable" })
      shifts = [shift]
    } else {
      const closedShifts = await getCashShiftsByStatus("CLOSED")
      shifts = (closedShifts || []).sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt))
    }

    const reports = await Promise.all(shifts.map(async (shift) => {
      const movements = await getMovementsForShift(shift.id)

      const populatedMovements = await Promise.all(
        movements.map(async (m) => {
          const user = await populateUser(m.userId)
          const customer = await populateCustomer(m.customerId)
          const sale = await populateSale(m.relatedSaleId)
          return { ...m, userId: user, customerId: customer, relatedSaleId: sale }
        })
      )

      let totalEspeces = 0
      let totalCredit = 0
      let totalCheque = 0
      let totalVersement = 0 
      let totalRetour = 0

      populatedMovements.forEach(m => {
        const sale = m.relatedSaleId
        if (m.type === "ENC") {
          if (m.method === "Versement") {
            totalVersement += Number(m.amount) || 0
          } else if (sale && sale.paymentType) {
            if (sale.paymentType === "Espèces") totalEspeces += Number(sale.totalAmount) || 0
            else if (sale.paymentType === "Crédit") totalCredit += Number(sale.givenAmount) || 0
            else if (sale.paymentType === "Chèque") totalCheque += Number(sale.givenAmount) || 0
          }
        }
        if (m.type === "DEC") {
          if (sale && sale.paymentType === "Retour") totalRetour += Number(sale.totalAmount) || 0
        }
      }) 

      const totalEnc = totalEspeces + totalCredit + totalCheque + totalVersement
      const totalDec = populatedMovements
        .filter(m => m.type === "DEC")
        .reduce((sum, m) => {
          if (m.method === "Retour") return sum + Math.abs(m.amount || 0)
          return sum + (m.amount || 0)
        }, 0)

      const soldeTheorique = (shift.openingAmount || 0) + totalEnc - totalDec
      const cashier = await populateUser(shift.userId)

      return {
        shiftId: shift.id,
        date: shift.closedAt,
        cashier: cashier ? { id: cashier.id, name: cashier.name } : null,
        openingAmount: shift.openingAmount || 0,
        closingAmount: shift.closingAmount || 0,
        totalEspeces,
        totalCredit,
        totalCheque,
        totalVersement,
        totalRetour,
        totalEncaissements: totalEnc,
        totalDecaissements: totalDec,
        soldeTheorique,  
        soldeReel: shift.closingAmount || 0,
        ecart: shift.ecart || 0,
        movements: populatedMovements
      }
    }))

    res.json(reports)
  } catch (err) {
    console.error("getDailyReport error:", err)
    res.status(500).json({ error: err.message })
  }
}

export {
  getCashSummary,
  getCashMovements,
  getCashShifts,
  openShift,
  closeShift,
  getDailyReport,
  createMovement,
  getCashShiftsByStatus
}