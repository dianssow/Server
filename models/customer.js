import { db } from "../firebase.js";

const customerCollection = db.collection("customers");

  const addCustomerToDB = async (data) => {
  const docRef = await customerCollection.add({
    ...data,
    updatedAt: new Date().toISOString()
  });
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}

  const getAllCustomers = async () => {
  const snapshot = await customerCollection.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
const getCustomerByName = async (name) => {
  if (!name) return null;
  const normalizedName = name.trim().toLowerCase();
  const snapshot = await customerCollection
    .where("nameLower", "==", normalizedName)
    .limit(1)
    .get();
  
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};



  const getCustomerById = async (id) => {
  const doc = await customerCollection.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

  const updateCustomerInDB = async (id, data) => {
  await customerCollection.doc(id).update({
    ...data,
    updatedAt: new Date().toISOString()
});
  const updatedDoc = await customerCollection.doc(id).get();
  return { id: updatedDoc.id, ...updatedDoc.data() };
}

  const deleteCustomerFromDB = async (id) => {
  await customerCollection.doc(id).delete();
}

export {addCustomerToDB,getAllCustomers,getCustomerById,updateCustomerInDB,deleteCustomerFromDB,getCustomerByName}