import { db, FieldValue } from "../../firebase.js"

const countersCollection = db.collection("counters")

export const getNextCounterValue = async (year, type) => {
  const counterRef = countersCollection.doc(`${year}_${type}`)

  const result = await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef)
    if (!doc.exists) {
      transaction.set(counterRef, { year, type, value: 1 })
      return 1
    } else {
      const newValue = doc.data().value + 1
      transaction.update(counterRef, { value: newValue })
      return newValue
    }
  })

  return result
}
