import { db } from "../firebase.js";

const supplierCollection = db.collection("suppliers");

  const addSupplierToDB = async (data) => {
  const docRef = await supplierCollection.add({
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}

  const getAllSuppliers = async () => {
  const snapshot = await supplierCollection.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
const getSupplierByName = async (name) => {
  if (!name) return null;
  const normalizedName = name.trim().toLowerCase();
  const snapshot = await supplierCollection
    .where("nameLower", "==", normalizedName)
    .limit(1)
    .get();
  
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};



  const getSupplierById = async (id) => {
  const doc = await supplierCollection.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

  const updateSupplierInDB = async (id, data) => {
  await supplierCollection.doc(id).update({
    ...data,
    updatedAt: new Date().toISOString()
});
  const updatedDoc = await supplierCollection.doc(id).get();
  return { id: updatedDoc.id, ...updatedDoc.data() };
}

  const deleteSupplierFromDB = async (id) => {
  await supplierCollection.doc(id).delete();
}

//SupplierFinaance
const addInvoiceToSupplier = async (supplierId, invoiceData) => {
  const invoiceRef = supplierCollection
    .doc(supplierId)
    .collection("invoices")
    .doc();
  
  const invoice = {
    id: invoiceRef.id,
    supplierId,
    ...invoiceData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await invoiceRef.set(invoice);
  return invoice;
}

const getInvoicesBySupplier = async (supplierId) => {
  const snapshot = await supplierCollection
    .doc(supplierId)
    .collection("invoices")
    .orderBy("createdAt", "desc")
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

const addVersementToSupplier = async (supplierId, versementData) => {
  const versementRef = supplierCollection
    .doc(supplierId)
    .collection("versements")
    .doc();
  
  const versement = {
    id: versementRef.id,
    supplierId,
    ...versementData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await versementRef.set(versement);
  return versement;
}

const getVersementsBySupplier = async (supplierId) => {
  const snapshot = await supplierCollection
    .doc(supplierId)
    .collection("versements")
    .orderBy("createdAt", "desc")
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

const getSupplierBalance = async (supplierId) => {
  const invoices = await getInvoicesBySupplier(supplierId);
  const totalInvoices = invoices.reduce((sum, inv) => sum + (inv.invoiceAmount || 0), 0);
  const totalDeposits = invoices.reduce((sum, inv) => sum + (inv.depositAmount || 0), 0);
  
  const versements = await getVersementsBySupplier(supplierId);
  const totalVersements = versements.reduce((sum, ver) => sum + (ver.versementAmount || 0), 0);
  
  const balance = totalInvoices - totalDeposits - totalVersements;
  
  return {
    totalInvoices,
    totalDeposits,
    totalVersements,
    balance
  };
}

const getAllSuppliersWithBalance = async () => {
  const suppliers = await getAllSuppliers();
  
  const suppliersWithBalance = await Promise.all(
    suppliers.map(async (supplier) => {
      try {
        const balanceData = await getSupplierBalance(supplier.id);
        const invoices = await getInvoicesBySupplier(supplier.id)
        const latestInvoice = invoices.length > 0 ? invoices[0] : null
        return {
          ...supplier,
          balance: balanceData.balance,
          totalInvoices: balanceData.totalInvoices,
          totalDeposits: balanceData.totalDeposits,
          totalVersements: balanceData.totalVersements,
          dueDate: latestInvoice?.dueDate || null
        };
      } catch (error) {
        console.error(`Erreur calcul balance fournisseur ${supplier.id}:`, error);
        return {
          ...supplier,
          balance: 0,
          totalInvoices: 0,
          totalDeposits: 0,
          totalVersements: 0,
          dueDate: null
        };
      }
    })
  );
  
  return suppliersWithBalance;
}


const updateInvoice = async (supplierId, invoiceId, data) => {
  const cleanData = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value ?? ""
    ])
  )
  await supplierCollection
    .doc(supplierId)
    .collection("invoices")
    .doc(invoiceId)
    .update({ ...cleanData, updatedAt: new Date().toISOString() })
  const doc = await supplierCollection.doc(supplierId).collection("invoices").doc(invoiceId).get()
  return { id: doc.id, ...doc.data() }
}

const deleteInvoice = async (supplierId, invoiceId) => {
  await supplierCollection.doc(supplierId).collection("invoices").doc(invoiceId).delete()
}

const updateVersement = async (supplierId, versementId, data) => {
  const cleanData = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value  ?? ""
    ])
  )
  await supplierCollection
    .doc(supplierId)
    .collection("versements")
    .doc(versementId)
    .update({ ...cleanData, updatedAt: new Date().toISOString() })
  const doc = await supplierCollection.doc(supplierId).collection("versements").doc(versementId).get()
  return { id: doc.id, ...doc.data() }
}

const deleteVersement = async (supplierId, versementId) => {
  await supplierCollection.doc(supplierId).collection("versements").doc(versementId).delete()
}








export {addSupplierToDB,getAllSuppliers,getSupplierById,updateSupplierInDB,deleteSupplierFromDB,getSupplierByName, addInvoiceToSupplier,
  getInvoicesBySupplier, addVersementToSupplier, getVersementsBySupplier, getSupplierBalance, getAllSuppliersWithBalance, updateInvoice, deleteInvoice, updateVersement, deleteVersement}