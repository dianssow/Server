import  { db } from '../../firebase.js'

const cashShiftCollection = db.collection("cashShifts")

const addCashShiftToDB = async (data) => {
  const docRef = await cashShiftCollection.add({
    ...data,
    status: data.status || "OPEN",
    closingAmount: data.closingAmount || 0,
    ecart: data.ecart || 0,
    openedAt: data.openedAt || new Date().toISOString(),
    closedAt: data.closedAt || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
  const doc = await docRef.get()
  return { id: doc.id, ...doc.data() }
}

const getAllCashShifts = async () => {
  const snapshot = await cashShiftCollection.orderBy('openedAt', 'desc').get()
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

const getCashShiftById = async (id) => {
  const doc = await cashShiftCollection.doc(id).get()
  if (!doc.exists) return null
  return { id: doc.id, ...doc.data() }
}

const getOpenCashShift = async (userId) => {
  const snapshot = await cashShiftCollection
    .where("userId", "==", userId)
    .where("status", "==", "OPEN")
    .limit(1)
    .get()
  
  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  return { id: doc.id, ...doc.data() }
}

const getCashShiftsByUser = async (userId) => {
  const snapshot = await cashShiftCollection
    .where("userId", "==", userId)
    .orderBy('openedAt', 'desc')
    .get()
  
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

const getCashShiftsByStatus = async (status) => {
  const snapshot = await cashShiftCollection
    .where("status", "==", status)
    .orderBy('openedAt', 'desc')
    .get()
  
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

const updateCashShiftInDB = async (id, data) => {
  await cashShiftCollection.doc(id).update({
    ...data,
    updatedAt: new Date().toISOString()
  })
  const updatedDoc = await cashShiftCollection.doc(id).get()
  return { id: updatedDoc.id, ...updatedDoc.data() }
}

const closeCashShift = async (id, closingAmount) => {
  const shift = await getCashShiftById(id)
  if (!shift) throw new Error("Shift introuvable")
  
  const ecart = closingAmount - shift.openingAmount
  
  await cashShiftCollection.doc(id).update({
    closingAmount,
    ecart,
    status: "CLOSED",
    closedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
  
  const updatedDoc = await cashShiftCollection.doc(id).get()
  return { id: updatedDoc.id, ...updatedDoc.data() }
}

const getMovementsForShift = async (shiftId) => {
  
  const snapshot = await db.collection("cashMovements")
    .where("shiftId", "==", shiftId)
    .orderBy("createdAt", "desc")
    .get()
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}
const populateUser = async (userId) => {
  if (!userId) return null
  const userDoc = await db.collection("users").doc(userId).get()
  if (!userDoc.exists) return null
  return { id: userDoc.id, name: userDoc.data().name, email: userDoc.data().email }
}

const deleteCashShiftFromDB = async (id) => {
  await cashShiftCollection.doc(id).delete()
}

const populateCustomer = async (customerId) => {
  if (!customerId) return null
  const customerDoc = await db.collection("customers").doc(customerId).get()
  if (!customerDoc.exists) return null
  return { id: customerDoc.id, name: customerDoc.data().name, address: customerDoc.data().address }
}

// Helper function to populate sale data
const populateSale = async (saleId) => {
  if (!saleId) return null
  const saleDoc = await db.collection("sales").doc(saleId).get()
  if (!saleDoc.exists) return null
  const saleData = saleDoc.data()
  
  // Populate customer within sale
  let customer = null
  if (saleData.customerId) {
    customer = await populateCustomer(saleData.customerId)
  }
  return { id:saleDoc.id, saleNumber:saleData.saleNumber || " ",invoiceNumber:saleData.invoiceNumber || "", paymentType:saleData.paymentType || "", totalAmount:saleData.totalAmount, givenAmount:saleData.givenAmount || " ", customer: customer || " " }
}
export {
  addCashShiftToDB,getAllCashShifts,getCashShiftById,getOpenCashShift,getCashShiftsByUser,getCashShiftsByStatus,updateCashShiftInDB,closeCashShift,deleteCashShiftFromDB, getMovementsForShift,populateSale,populateCustomer,populateUser
}