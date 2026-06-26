import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const oldServiceAccount = require('./old-service-account.json');
const newServiceAccount = require('./new-service-account.json');

const oldApp = initializeApp({ credential: cert(oldServiceAccount) }, 'oldApp');
const newApp = initializeApp({ credential: cert(newServiceAccount) }, 'newApp');

const oldDb = getFirestore(oldApp);
const newDb = getFirestore(newApp);

oldDb.settings({ preferRest: true })
newDb.settings({ preferRest: true })

async function migrateSupplierSubcollections() {
    console.log("Migration des sous-collections suppliers...");
    
    const suppliersSnap = await oldDb.collection('suppliers').get();
    
    for (const supplierDoc of suppliersSnap.docs) {
        const supplierId = supplierDoc.id;
        console.log(`Traitement supplier: ${supplierId}`);
        
        // Migrer invoices
        const invoicesSnap = await oldDb
            .collection('suppliers')
            .doc(supplierId)
            .collection('invoices')
            .get();
            
        if (!invoicesSnap.empty) {
            const batch = newDb.batch();
            invoicesSnap.forEach(doc => {
                const ref = newDb
                    .collection('suppliers')
                    .doc(supplierId)
                    .collection('invoices')
                    .doc(doc.id);
                batch.set(ref, doc.data());
            });
            await batch.commit();
            console.log(`  → ${invoicesSnap.size} invoices migrées pour ${supplierId}`);
        }
        
        // Migrer versements
        const versementsSnap = await oldDb
            .collection('suppliers')
            .doc(supplierId)
            .collection('versements')
            .get();
            
        if (!versementsSnap.empty) {
            const batch = newDb.batch();
            versementsSnap.forEach(doc => {
                const ref = newDb
                    .collection('suppliers')
                    .doc(supplierId)
                    .collection('versements')
                    .doc(doc.id);
                batch.set(ref, doc.data());
            });
            await batch.commit();
            console.log(`  → ${versementsSnap.size} versements migrés pour ${supplierId}`);
        }
    }
    
    console.log("--- Migration sous-collections terminée ---");
    process.exit(0);
}

migrateSupplierSubcollections();