import { db } from "../firebase.js";
import { getSalesByCustomer } from "./saleModels/sale.js"
import { getVersementsByCustomer } from "./saleModels/versement.js"

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
const getCustomerBalance = async (customerId) => {
  const sales = await getSalesByCustomer(customerId)

  const totalSalesDue = sales.reduce((acc, sale) => {
    if (sale.paymentType !== "Espèces") {
      return acc + (Number(sale.totalAmount || 0) - Number(sale.givenAmount || 0))
    }
    return acc
  }, 0)

  const versements = await getVersementsByCustomer(customerId)
  const totalPaid = versements.reduce((acc, v) => acc + Number(v.amount || 0), 0)

  const balance = totalSalesDue - totalPaid

  return {
    totalSalesDue,
    totalPaid,
    balance
  }
}

const getTotalCustomersBalance = async () => {
  const customers = await getAllCustomers()

  const balances = await Promise.all(
    customers.map(async (customer) => {
      const data = await getCustomerBalance(customer.id)
      return {
        customerId: customer.id,
        customerName: customer.name,
        balance: Number(data.balance || 0)
      }
    })
  )

  const totalBalance = balances.reduce((sum, item) => {
    return sum + item.balance
  }, 0)

  const totalDueOnly = balances.reduce((sum, item) => {
    return item.balance > 0 ? sum + item.balance : sum
  }, 0)

  return {
    totalBalance,
    totalDueOnly,
    balances
  }
}

export {addCustomerToDB,getAllCustomers,getCustomerById,updateCustomerInDB,deleteCustomerFromDB,getCustomerByName,  getCustomerBalance,getTotalCustomersBalance}