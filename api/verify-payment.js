// POST /api/verify-payment
// Payment successful hone ke baad Razorpay jo response deta hai, frontend
// usko yahan bhejta hai. Yeh function signature verify karta hai (isse pata
// chalta hai payment sach me Razorpay ne process ki hai, koi fake request
// nahi) — tabhi Firestore me course unlock hota hai.
const crypto = require("crypto");
const { getAdmin } = require("./_firebaseAdmin");

const VALID_COURSE_IDS = [
  "course_history",
  "course_geo",
  "course_hindi",
  "course_english",
  "course_maths",
];

const VALIDITY_DAYS = 365; // index.html me VALIDITY_DAYS constant se match

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) {
      return res.status(401).json({ error: "कृपया पहले लॉगिन करें।" });
    }

    const admin = getAdmin();
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const { orderId, paymentId, signature, courseId } = req.body || {};
    if (!orderId || !paymentId || !signature || !VALID_COURSE_IDS.includes(courseId)) {
      return res.status(400).json({ error: "जरूरी जानकारी मौजूद नहीं है।" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(403).json({ error: "पेमेंट सिग्नेचर मेल नहीं खाया।" });
    }

    const expiresAt = Date.now() + VALIDITY_DAYS * 24 * 60 * 60 * 1000;

    // index.html ka payments/{uid} listener isi structure ko padhta hai:
    // courses.{courseId} = true, purchasedAt.{courseId}, expiresAt.{courseId}
    const db = admin.firestore();
    await db.collection("payments").doc(uid).set(
      {
        courses: { [courseId]: true },
        purchasedAt: { [courseId]: Date.now() },
        expiresAt: { [courseId]: expiresAt },
      },
      { merge: true }
    );

    return res.status(200).json({ expiresAt });
  } catch (e) {
    console.error("verify-payment error:", e);
    return res.status(500).json({ error: "वेरिफाई करने में दिक्कत आई।" });
  }
};
