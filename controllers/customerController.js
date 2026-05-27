import { addCustomerToDB, deleteCustomerFromDB, getAllCustomers,getCustomerByName, getCustomerById, updateCustomerInDB,  getTotalCustomersBalance } from "../models/customer.js"
import { db } from "../firebase.js"
import { getSalesByCustomer } from "../models/saleModels/sale.js"
import { getVersementsByCustomer } from "../models/saleModels/versement.js"
    
    const addCustomer = async(req, res) => {
        try {
            
            const {name, number, address, birth} = req.body 

            if (!name || name.trim() === "") {
                return res.status(400).json({ success: false,  message: "Le nom du client est requis"});
                }
            
            const existingCustomer = await getCustomerByName (name)
            if(existingCustomer) {
                return res.status(400).json({ success: false, message: `Client "${name.trim()}" existe dejà`})
            }

            const customerData = { 
                name: name.trim(),
                nameLower:name.trim().toLowerCase(),
                number, 
                address,
                birth
            }
            const newCustomer =await addCustomerToDB(customerData)
            return res.status(201).json({success: true, message: `Client ${ newCustomer.name} ajouté avec succes`})

        } catch (error) {
            console.error('Erreur Client non ajoutee', error.message );
            return res.status(500).json({ success: false, message: ' Erreur serveur '})
            
        }
    }

    const getCustomers = async (req, res) => {  
        try {
            const customers = await getAllCustomers()
                return res.status(200).json({ success: true, customers})

        } catch (error) {
                return res.status(400).json({ success: false, message: `Erreur du serveur / customers`})
            
        }
    }

    const updateCustomer = async(req, res) => {
        try {
            const {id} = req.params
            const {name, number, address, birth} = req.body 
            
            const existingCustomer = await getCustomerById(id)
            if(!existingCustomer) {
                return res.status(404).json({ success: false, message: `Client introuvable`})
            }

                    const updateData = {}
            if (name !== undefined) updateData.name = name.trim()
            if (number !== undefined) updateData.number = number
            if (address !== undefined) updateData.address = address
            if (birth !== undefined) updateData.birth = birth

            const updatedCustomer = await updateCustomerInDB(
                id,updateData
            )
            return res.status(200).json( {success:true, message:`Client ${updateData.name} ajoute avec succes`})

        } catch (error) {
            console.error('Erreur Client non ajoute', error );
            return res.status(500).json({ success: false, message: ' Erreur serveur '})
            
        }
    }

    const deleteCustomer = async(req, res) => {
        try {
            const {id} = req.params
            
            const existingCustomer = await getCustomerById (id)
            if(!existingCustomer) {
                return res.status(404).json({ success: false, message: `Customer introuvable`})
            }

            await deleteCustomerFromDB(id)
            
            return res.status(200).json( {success:true, message:"customer supprime avec succes"})

        } catch (error) {
            console.error('Erreur customer non supprime', error );
            return res.status(500).json({ success: false, message: ' Erreur serveur '})
            
        }
    }

const getCustomerStatement = async (req, res) => {
  try {
    const { id: customerId } = req.params

    const customerDoc = await db.collection("customers").doc(customerId).get()
    if (!customerDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Client introuvable"
      })
    }

    const customer = { id: customerDoc.id, ...customerDoc.data() }

    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 3)

    const sales = await getSalesByCustomer(customerId)
    const versements = await getVersementsByCustomer(customerId)

    const salesMovements = sales
      .filter(sale => sale.createdAt && new Date(sale.createdAt) >= startDate)
      .map(sale => ({
        id: sale.id,
        date: sale.createdAt,
        type: "FACTURE",
        reference: sale.invoiceNumber || sale.id,
        label: `Facture ${sale.invoiceNumber || ""}`.trim(),
        debit: Number(sale.totalAmount || 0),
        credit: Number(sale.givenAmount || 0),
        paymentType: sale.paymentType || null,
        balanceImpact:
          sale.paymentType === "Espèces"
            ? 0
            : Number(sale.totalAmount || 0) - Number(sale.givenAmount || 0)
      }))

    const versementMovements = versements
      .filter(v => v.createdAt && new Date(v.createdAt) >= startDate)
      .map(v => ({
        id: v.id,
        date: v.createdAt,
        type: "VERSEMENT",
        reference: v.versementNumber || v.id,
        label: `Versement ${v.versementNumber || ""}`.trim(),
        debit: 0,
        credit: Number(v.amount || 0),
        paymentMethod: v.method || null,
        balanceImpact: -Number(v.amount || 0)
      }))

    const movements = [...salesMovements, ...versementMovements]
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    let runningBalance = 0
    const movementsWithBalance = movements.map(mvt => {
      runningBalance += mvt.balanceImpact
      return {
        ...mvt,
        runningBalance
      }
    })

    return res.status(200).json({
      success: true,
      customer,
      period: {
        from: startDate.toISOString(),
        to: new Date().toISOString()
      },
      movements: movementsWithBalance,
      finalBalance: runningBalance
    })
  } catch (error) {
    console.error("Erreur relevé client:", error)
    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    })
  }
}

const getCustomersBalancesSummary = async (req, res) => {
  try {
    const result = await getTotalCustomersBalance()

    return res.status(200).json({
      success: true,
      totalBalance: result.totalBalance,
      totalDueOnly: result.totalDueOnly,
      balances: result.balances
    })
  } catch (error) {
    console.error("Erreur calcul total balances clients :", error)
    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    })
  }
}


    export {addCustomer, getCustomers,getCustomerStatement, updateCustomer, deleteCustomer, getCustomersBalancesSummary}
