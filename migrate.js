import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Chargez vos fichiers JSON
const oldServiceAccount = require('./old-service-account.json');
const newServiceAccount = require('./new-service-account.json');

// 1. Initialisez vos deux projets avec la nouvelle syntaxe
const oldApp = initializeApp({ credential: cert(oldServiceAccount) }, 'oldApp');
const newApp = initializeApp({ credential: cert(newServiceAccount) }, 'newApp');

const oldDb = getFirestore(oldApp);
const newDb = getFirestore(newApp);

async function migrateCollection(collectionName) {
    try {
        console.log(`Début de la migration de : ${collectionName}...`);
        const snapshot = await oldDb.collection(collectionName).get();
        
        if (snapshot.empty) {
            console.log(`Collection ${collectionName} vide, sautée.`);
            return;
        }

        const batch = newDb.batch();
        let count = 0;
        
        snapshot.forEach(doc => {
            batch.set(newDb.collection(collectionName).doc(doc.id), doc.data());
            count++;
        });
        
        await batch.commit();
        console.log(`Collection ${collectionName} migrée ! (${count} docs)`);
    } catch (err) {
        console.error(`Erreur sur la collection ${collectionName}:`, err.message);
    }
}

async function runMigration() {
    const collections = [
        'products', 'sales', 'users', 'cashMovements', 
        'categorys', 'cashShifts', 'counters', 'customers', 
        'suppliers', 'versements'
    ];
    
    for (const col of collections) {
        await migrateCollection(col);
    }
    console.log("--- Migration terminée avec succès ---");
    process.exit(0);
}

runMigration();