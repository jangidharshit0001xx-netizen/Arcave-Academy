// Vercel ke serverless functions me Firebase Admin SDK ko safely initialize
// karne ke liye helper. Service account ki JSON key Vercel ke environment
// variable FIREBASE_SERVICE_ACCOUNT me store hoti hai — kabhi bhi code me
// seedhe nahi likhi jaati, isliye yeh browser me kabhi expose nahi hoti.
const admin = require("firebase-admin");

let initialized = false;

function getAdmin() {
  if (!initialized) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
  }
  return admin;
}

module.exports = { getAdmin };
