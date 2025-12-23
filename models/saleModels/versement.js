import { db } from "../../firebase.js"
import { getCashShiftById , populateUser} from "../cashModels/cashShift.js"

const versementsCollection = db.collection("versements")

const normalizeDate = (dateField) => {
    if (dateField && typeof dateField.toDate === 'function') {
        return dateField.toDate();
    }
    if (typeof dateField === 'string') {
        return new Date(dateField);
    }
    return dateField;
}

const populateCustomer = async (customerId) => {
  if (!customerId) return null
  const doc = await db.collection("customers").doc(customerId).get()
  if (!doc.exists) return null
  return { id: doc.id, name: doc.data().name, address: doc.data().address }
}

const addVersementToDB = async (data) => {
  const docRef = await versementsCollection.add({
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  const doc = await docRef.get()
  const result = {id: doc.id, ...doc.data()}
  return { 
    ...result,
    createdAt: normalizeDate(result.createdAt),
    updatedAt: normalizeDate(result.updatedAt)
   }
}

const getAllVersements = async ({ limit = 50 } = {}) => {
  const snapshot = await versementsCollection
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get()
  
  const versementsRaw = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }))

  // IDs uniques
  const customerIds = [...new Set(versementsRaw.map(v => v.customerId).filter(Boolean))]
  const userIds =     [...new Set(versementsRaw.map(v => v.userId).filter(Boolean))]
  const shiftIds =    [...new Set(versementsRaw.map(v => v.shiftId).filter(Boolean))]

  // Chargement en parallèle
  const customersMap = {}
  for (const cid of customerIds) {
    const c = await populateCustomer(cid)
    if (c) customersMap[cid] = c
  }

  const usersMap = {}
  for (const uid of userIds) {
    const u = await populateUser(uid)
    if (u) usersMap[uid] = u
  }

  const shiftsMap = {}
  for (const sid of shiftIds) {
    const s = await populateShift(sid)
    if (s) shiftsMap[sid] = s
  }

  return versementsRaw.map(v => ({
    ...v,
    customer: customersMap[v.customerId] || null,
    user: usersMap[v.userId] || null,
    shift: shiftsMap[v.shiftId] || null,
  }))
}




const getVersementById = async (id) => {
  const doc = await versementsCollection.doc(id).get()
  if (!doc.exists) return null
  const data = doc.data()
  const customer = data.customerId ? await populateCustomer(data.customerId) : null
  return { id: doc.id, ...data, customer }
}

const getVersementsByShift = async (shiftId) => {
  const snapshot = await versementsCollection
    .where("shiftId", "==", shiftId)
    .orderBy("createdAt", "desc")
    .get()
  const results = []
  for (const doc of snapshot.docs) {
    const data = doc.data()
    const customer = data.customerId ? await populateCustomer(data.customerId) : null
    results.push({ id: doc.id, ...data, customer })
  }
  return results
}
const getVersementsByCustomer = async (customerId) => {
  const snapshot = await versementsCollection
    .where("customerId", "==", customerId)
    .orderBy("createdAt", "desc")
    .get()
  return snapshot.docs.map(doc => doc.data())
}

const updateVersementInDB = async (id, data) => {
  await versementsCollection.doc(id).update({
    ...data,
    updatedAt: new Date().toISOString(),
  })
  const updatedDoc = await versementsCollection.doc(id).get()
  return { id: updatedDoc.id, ...updatedDoc.data() }
}

const deleteVersementFromDB = async (id) => {
  await versementsCollection.doc(id).delete()
}

const populateShift = async (shiftId) => {
  if (!shiftId) return null 
  const shift = await getCashShiftById(shiftId)
  if(!shift) return null

  const user = await populateUser(shift.userId)
  return{ ...shift, userId: user}
}

export {
  addVersementToDB,
  getAllVersements,
  getVersementById,
  getVersementsByShift,
  updateVersementInDB,
  deleteVersementFromDB,
  populateCustomer,
  getVersementsByCustomer,
   populateShift
}





