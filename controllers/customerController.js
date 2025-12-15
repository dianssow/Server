    import { addCustomerToDB, deleteCustomerFromDB, getAllCustomers,getCustomerByName, getCustomerById, updateCustomerInDB } from "../models/customer.js"
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


    export {addCustomer, getCustomers, updateCustomer, deleteCustomer}
