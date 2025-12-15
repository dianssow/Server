// backend/firebase.js
import admin from "firebase-admin";
import fs from "fs"


const serviceAccount = JSON.parse(
  fs.readFileSync(new URL("./config/gap-distribution-firebase-adminsdk.json", import.meta.url))
)

// // Initialiser Firebase Admin avec la clé privée   
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

// Exporter l'instance Firestore
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

export { db , FieldValue, Timestamp };
