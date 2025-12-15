// models/userModel.js
import { db } from "../firebase.js";

const userCollection = db.collection("users");

// 📘 Ajouter un utilisateur
  const addUserToDB = async (data) => {
  const docRef = await userCollection.add(data);
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
};

// 📘 Récupérer tous les utilisateurs
  const getAllUsers = async () => {
  const snapshot = await userCollection.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// 📘 Récupérer un utilisateur par email
  const getUserByEmail = async (email) => {
  const snapshot = await userCollection.where("email", "==", email).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

// 📘 Récupérer un utilisateur par ID
  const getUserById = async (id) => {
  const doc = await userCollection.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

// 📘 Mettre à jour un utilisateur
  const updateUserInDB = async (id, data) => {
  await userCollection.doc(id).update(data);
  const updatedDoc = await userCollection.doc(id).get();
  return { id: updatedDoc.id, ...updatedDoc.data() };
};

// 📘 Supprimer un utilisateur
  const deleteUserFromDB = async (id) => {
  await userCollection.doc(id).delete();
};

export {addUserToDB,getAllUsers,getUserByEmail,getUserById,updateUserInDB,deleteUserFromDB}
