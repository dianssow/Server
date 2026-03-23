import {addSupplierToDB,  deleteSupplierFromDB, getAllSuppliers,getSupplierByName,  getSupplierById,  updateSupplierInDB,addInvoiceToSupplier,getInvoicesBySupplier,addVersementToSupplier,getVersementsBySupplier,  getSupplierBalance, getAllSuppliersWithBalance, updateInvoice, deleteInvoice, updateVersement, deleteVersement} from "../models/supplier.js"

const addSupplier = async(req, res) => {
  try {
    const {name, number, address } = req.body 

    if (!name || name.trim() === "") {
      return res.status(400).json({ 
        success: false,  
        message: "Le nom du fournisseur est requis"
      });
    }
    
    const existingSupplier = await getSupplierByName(name)
    if(existingSupplier) {
      return res.status(400).json({ 
        success: false, 
        message: `Fournisseur "${name.trim()}" existe déjà`
      })
    }

    const supplierData = {
      name: name.trim(),
      nameLower: name.trim().toLowerCase(),
      number, 
      address,
    }
    
    const newSupplier = await addSupplierToDB(supplierData)
    
    return res.status(201).json({
      success: true, 
      message: `Fournisseur ${newSupplier.name} ajouté avec succès`,
      supplier: newSupplier
    })

  } catch (error) {
    console.error('Erreur ajout fournisseur', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur'
    })
  }
}

const getSuppliers = async (req, res) => {  
  try {
    const suppliers = await getAllSuppliersWithBalance()
    
    const totalDue = suppliers.reduce((sum, supplier) => sum + (supplier.balance || 0), 0)
    
    return res.status(200).json({ 
      success: true, 
      suppliers,
      totalDue  
    })
  } catch (error) {
    console.error("Erreur récupération fournisseurs:", error)
    return res.status(400).json({ 
      success: false, 
      message: `Erreur du serveur`
    })
  }
}

const updateSupplier = async(req, res) => {
  try {
    const {id} = req.params
    const {name, number, address} = req.body 
    
    const existingSupplier = await getSupplierById(id)
    if(!existingSupplier) {
      return res.status(404).json({ 
        success: false, 
        message: `Fournisseur introuvable`
      })
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name.trim()
    if (name !== undefined) updateData.nameLower = name.trim().toLowerCase()
    if (number !== undefined) updateData.number = number
    if (address !== undefined) updateData.address = address

    const updatedSupplier = await updateSupplierInDB(id, updateData)
    
    return res.status(200).json({
      success: true, 
      message: `Fournisseur ${updatedSupplier.name} modifié avec succès`,
      supplier: updatedSupplier
    })

  } catch (error) {
    console.error('Erreur modification fournisseur', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur'
    })
  }
}

const deleteSupplier = async(req, res) => {
  try {
    const {id} = req.params
    
    const existingSupplier = await getSupplierById(id)
    if(!existingSupplier) {
      return res.status(404).json({ 
        success: false, 
        message: `Fournisseur introuvable`
      })
    }

    await deleteSupplierFromDB(id)
    
    return res.status(200).json({
      success: true, 
      message: "Fournisseur supprimé avec succès"
    })

  } catch (error) {
    console.error('Erreur suppression fournisseur', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur'
    })
  }
}

const addSupplierInvoice = async(req, res) => {
  try {
    const { supplierId } = req.params
    const { invoiceAmount, invoiceDate, dueDate, depositAmount } = req.body
    const userId = req.user?.id

    if(!invoiceAmount || !invoiceDate){
      return res.status(400).json({
        success: false,
        message: "Montant et date de la facture requis"
      })
    }

    if(!userId){
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié"
      })
    }

    const supplier = await getSupplierById(supplierId)
    if(!supplier){
      return res.status(404).json({
        success: false,
        message: "Fournisseur introuvable"
      })
    }

    const invoiceNumber = `FACT-${Date.now()}`

    const newInvoice = await addInvoiceToSupplier(supplierId, {
      invoiceNumber,
      invoiceAmount: Number(invoiceAmount),
      invoiceDate,
      dueDate,
      depositAmount: Number(depositAmount) || 0,
      userId
    })

    return res.status(201).json({
      success: true,
      message: "Facture ajoutée avec succès",
      invoice: newInvoice
    })

  } catch (error) {
    console.error("Erreur ajout facture", error.message)
    res.status(500).json({ success: false, message: "Erreur serveur" })
  }
}

const getSupplierInvoices = async(req, res) => {
  try {
    const { supplierId } = req.params
    
    const invoices = await getInvoicesBySupplier(supplierId)
    
    return res.status(200).json({
      success: true,
      invoices
    })

  } catch (error) {
    console.error("Erreur récupération factures", error.message)
    res.status(500).json({ success: false, message: "Erreur serveur" })
  }
}

const addSupplierVersement = async(req, res) => {
  try {
    const { supplierId } = req.params
    const { versementDate, versementAmount, payerName, motif , versementType} = req.body
    const userId = req.user?.id

    if(!versementAmount || !versementDate){
      return res.status(400).json({
        success: false,
        message: "Montant et date du versement requis"
      })
    }

    if(!userId){
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié"
      })
    }

    const supplier = await getSupplierById(supplierId)
    if(!supplier){
      return res.status(404).json({
        success: false,
        message: "Fournisseur introuvable"
      })
    }

    const versementNumber = `VERS-${Date.now()}`

    const newVersement = await addVersementToSupplier(supplierId, {
      versementNumber,
      versementDate,
      versementAmount: Number(versementAmount), 
      payerName,
      motif,
      versementType,
      userId
    })

    return res.status(201).json({
      success: true,
      message: "Versement enregistré avec succès",
      versement: newVersement
    })

  } catch (error) {
    console.error("Erreur ajout versement", error.message)
    res.status(500).json({ success: false, message: "Erreur serveur" })
  }
}

const getSupplierVersements = async(req, res) => {
  try {
    const { supplierId } = req.params
    
    const versements = await getVersementsBySupplier(supplierId)
    
    return res.status(200).json({
      success: true,
      versements
    })

  } catch (error) {
    console.error("Erreur récupération versements", error.message)
    res.status(500).json({ success: false, message: "Erreur serveur" })
  }
}

const getBalance = async(req, res) => {
  try {
    const { supplierId } = req.params
    
    const balanceData = await getSupplierBalance(supplierId)
    
    return res.status(200).json({
      success: true,
      ...balanceData
    })

  } catch (error) {
    console.error("Erreur calcul balance", error.message)
    res.status(500).json({ success: false, message: "Erreur serveur" })
  }
}


const editInvoice = async (req, res) => {
  try {
    const { supplierId, invoiceId } = req.params
    const { invoiceAmount, invoiceDate, dueDate, depositAmount } = req.body

    const updated = await updateInvoice(supplierId, invoiceId, {
      invoiceAmount: Number(invoiceAmount),
      invoiceDate,
      dueDate: dueDate || null,
      depositAmount: Number(depositAmount) || 0
    })

    return res.status(200).json({ success: true, invoice: updated })
  } catch (error) {
    console.error("Erreur modification facture:", error)
    res.status(500).json({ success: false, message: "Erreur serveur" })
  }
}

const removeInvoice = async (req, res) => {
  try {
    const { supplierId, invoiceId } = req.params
    await deleteInvoice(supplierId, invoiceId)
    return res.status(200).json({ success: true, message: "Facture supprimée" })
  } catch (error) {
    console.error("Erreur suppression facture:", error)
    res.status(500).json({ success: false, message: "Erreur serveur" })
  }
}

const editVersement = async (req, res) => {
  try {
    const { supplierId, versementId } = req.params
    const { versementAmount, versementDate, payerName, motif } = req.body

    const updated = await updateVersement(supplierId, versementId, {
      versementAmount: Number(versementAmount),
      versementDate,
      payerName: payerName || null,
      motif: motif || null,
      versementType: versementType || null
    })

    return res.status(200).json({ success: true, versement: updated })
  } catch (error) {
    console.error("Erreur modification versement:", error)
    res.status(500).json({ success: false, message: "Erreur serveur" })
  }
}

const removeVersement = async (req, res) => {
  try {
    const { supplierId, versementId } = req.params
    await deleteVersement(supplierId, versementId)
    return res.status(200).json({ success: true, message: "Versement supprimé" })
  } catch (error) {
    console.error("Erreur suppression versement:", error)
    res.status(500).json({ success: false, message: "Erreur serveur" })
  }
}

export {
  addSupplier, getSuppliers, updateSupplier, deleteSupplier,addSupplierInvoice, getSupplierInvoices, addSupplierVersement,getSupplierVersements,getBalance,  editInvoice, removeInvoice, editVersement, removeVersement
}