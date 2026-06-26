import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { initializeApp, getApps } from 'firebase-admin/app'

const app = getApps().length ? getApps()[0] : initializeApp()

const db = getFirestore(app)
const bucket = getStorage(app).bucket('gap-distribution-v2.firebasestorage.app')

export { db, FieldValue, Timestamp, bucket }