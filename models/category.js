import { db } from "../firebase.js";

const categoryCollection = db.collection("categorys");

  const addCategoryToDB = async (data) => {
  const docRef = await categoryCollection.add({
    ...data,
    nameLower: data.categoryName.trim().toLowerCase(),
    updatedAt: new Date().toISOString()
  });
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}

  const getAllCategorys = async () => {
  const snapshot = await categoryCollection.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
const getCategoryByName = async (categoryName) => {
  if (!categoryName) return null;
  const normalizedName = categoryName.trim().toLowerCase();
  const snapshot = await categoryCollection
    .where("nameLower", "==", normalizedName)
    .limit(1)
    .get();
  
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};



  const getCategoryById = async (id) => {
  const doc = await categoryCollection.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

  const updateCategoryInDB = async (id, data) => {
  await categoryCollection.doc(id).update({
    ...data,
    updatedAt: new Date().toISOString()
});
  const updatedDoc = await categoryCollection.doc(id).get();
  return { id: updatedDoc.id, ...updatedDoc.data() };
}

  const deleteCategoryFromDB = async (id) => {
  await categoryCollection.doc(id).delete();
}

export {addCategoryToDB,getAllCategorys,getCategoryById,updateCategoryInDB,deleteCategoryFromDB,getCategoryByName}