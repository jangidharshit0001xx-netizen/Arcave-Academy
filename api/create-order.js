// POST /api/create-order
// Student "Buy" dabata hai to frontend yahan call karta hai. Yeh function
// pehle Firebase ID token verify karta hai (taaki pata chale asli me kaun
// hai), phir Razorpay order banata hai. Key Secret sirf yahin (server par)
// use hoti hai, browser me kabhi nahi jaati.
const Razorpay = require("razorpay");
const { getAdmin } = require("./_firebaseAdmin");

// index.html ke COURSES array se liye gaye valid course IDs
const VALID_COURSE_IDS = [
  "course_history",
  "course_geo",
  "course_hindi",
  "course_english",
  "course_maths",
];

// ₹49 flat price, index.html me bhi yahi likha hai
const COURSE_PRICE_PAISE = 49 * 100;

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

    const { courseId } = req.body || {};
    if (!VALID_COURSE_IDS.includes(courseId)) {
      return res.status(400).json({ error: "Course ID गलत है।" });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: COURSE_PRICE_PAISE,
      currency: "INR",
      receipt: `${courseId}_${Date.now()}`.slice(0, 40),
      notes: { uid, courseId },
    });

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    console.error("create-order error:", e);
    return res.status(500).json({ error: "पेमेंट ऑर्डर बनाने में दिक्कत आई।" });
  }
};
