import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function checkDb() {
  const q = collection(db, 'sensors');
  const snap = await getDocs(q);
  console.log(`Found ${snap.size} sensors`);
  snap.forEach(doc => {
    console.log("ID:", doc.id, "=>", doc.data());
  });
}

checkDb();
