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

const getAllVersements = async () => {
  const snapshot = await versementsCollection.orderBy("createdAt", "desc").get()
  
  return Promise.all(snapshot.docs.map(async (doc) => {
    const data = doc.data()
    
    const customer = data.customerId ? await populateCustomer(data.customerId) : null
    const user = data.userId ? await populateUser(data.userId) : null
    const shift = data.shiftId ? await populateShift(data.shiftId) : null
    
    return { 
      id: doc.id, 
      ...data, 
      customerId: customer, 
      userId: user,
      shiftId: shift 
    }
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





