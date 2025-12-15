import { db } from "../../firebase.js"

const cashMovementsCollection = db.collection("cashMovements")

const addCashMovementToDB = async (data) => {
  const docRef = await cashMovementsCollection.add({
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  const doc = await docRef.get()
  return { id: doc.id, ...doc.data() }
}

const getAllCashMovements = async () => {
  const snapshot = await cashMovementsCollection.orderBy("createdAt", "desc").get()
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

const getCashMovementById = async (id) => {
  const doc = await cashMovementsCollection.doc(id).get()
  if (!doc.exists) return null
  return { id: doc.id, ...doc.data() }
}

const getMovementsByShift = async (shiftId) => {
  const snapshot = await cashMovementsCollection
    .where("shiftId", "==", shiftId)
    .orderBy("createdAt", "desc")
    .get()
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

const updateCashMovementInDB = async (id, data) => {
  await cashMovementsCollection.doc(id).update({
    ...data,
    updatedAt: new Date().toISOString(),
  })
  const updatedDoc = await cashMovementsCollection.doc(id).get()
  return { id: updatedDoc.id, ...updatedDoc.data() }
}

const deleteCashMovementFromDB = async (id) => {
  await cashMovementsCollection.doc(id).delete()
}

export {
  addCashMovementToDB,
  getAllCashMovements,
  getCashMovementById,
  getMovementsByShift,
  updateCashMovementInDB,
  deleteCashMovementFromDB,
}
