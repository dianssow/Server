import { db, Timestamp } from "../../firebase.js"

const salesCollection = db.collection("sales")

const cashMovementsCollection = db.collection("cashMovements")
const customersCollection = db.collection("customers")

export const addSaleToDB = async (saleData) => {
  const saleRef = salesCollection.doc()
  const sale = {
     id: saleRef.id, ...saleData, 
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
   }
  await saleRef.set(sale)
  return sale
}

export const getAllSales = async () => {
  const snapshot = await salesCollection.orderBy("createdAt", "desc").get()
  return snapshot.docs.map(doc => doc.data())
}

export const getSalesByCustomer = async (customerId) => {
  const snapshot = await salesCollection.where("customerId", "==", customerId).orderBy("createdAt", "desc").get()
  return snapshot.docs.map(doc => doc.data())
}

export const getSaleById = async (id) => {
  const doc = await salesCollection.doc(id).get()
  return doc.exists ? doc.data() : null
}

export const deleteSaleById = async (id) => {
  await salesCollection.doc(id).delete()
}
