import "dotenv/config"
import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  clientId: process.env.FIREBASE_CLIENT_ID,
  authUri: process.env.FIREBASE_AUTH_URL,
  tokenUri: process.env.FIREBASE_TOKEN_URL,
  authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER,
  clientX509CertUrl: process.env.FIREBASE_CLIENT_X,
  universeDomain: process.env.FIREBASE_UNIVERSEDOMAIN,
}



console.log("FULL SERVICE ACCOUNT CHECK:", JSON.stringify({
  type: serviceAccount.type,
  projectId: serviceAccount.projectId,
  hasPrivateKeyId: !!serviceAccount.privateKeyId,
  privateKeyStart: serviceAccount.privateKey?.substring(0, 50),
  clientEmail: serviceAccount.clientEmail,
  clientId: serviceAccount.clientId,
  universeDomain: serviceAccount.universeDomain,
}, null, 2))

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    })

const db = getFirestore(app)
db.settings({ preferRest: true })  // ← Ajoute cette ligne

const bucket = getStorage(app).bucket()
export { db, FieldValue, Timestamp, bucket }


// import admin from "firebase-admin";
// import 'dotenv/config'

// // Construire serviceAccount à partir des variables d'environnement
// const serviceAccount = {
//   type: process.env.FIREBASE_TYPE,
//   project_id: process.env.FIREBASE_PROJECT_ID,
//   private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
//   private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
//   client_email: process.env.FIREBASE_CLIENT_EMAIL,
//   client_id: process.env.FIREBASE_CLIENT_ID,
//   auth_uri: process.env.FIREBASE_AUTH_URL,
//   token_uri: process.env.FIREBASE_TOKEN_URL,
//   auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER,
//   client_x509_cert_url: process.env.FIREBASE_CLIENT_X,
//   universe_domain:process.env.FIREBASE_UNIVERSEDOMAIN
// };

// console.log(serviceAccount)
// // Initialiser Firebase Admin
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   storageBucket: process.env.FIREBASE_STORAGE_BUCKET
// });

// // Exporter Firestore et Storage
// const db = admin.firestore();
// const FieldValue = admin.firestore.FieldValue;
// const Timestamp = admin.firestore.Timestamp;
// const bucket = admin.storage().bucket();

// export { db, FieldValue, Timestamp, bucket };

