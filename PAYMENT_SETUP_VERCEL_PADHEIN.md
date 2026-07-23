# Payment Automatic Access — Vercel वाला तरीका (Blaze plan नहीं चाहिए)

आपका site पहले से **Vercel** पर host है, तो payment verify करने वाला server code
भी वहीं (Firebase Functions की जगह) चलेगा। Vercel के free "Hobby" plan में यह
बिल्कुल मुफ़्त है — कोई card नहीं चाहिए।

## Folder Structure

आपके project folder (जहाँ `index.html` है) में **ठीक ऐसे** files/folders होने चाहिए:

```
आपका-project-folder/
├── index.html
├── package.json          ← यह भी इस ZIP में है
└── api/
    ├── create-order.js
    ├── verify-payment.js
    └── _firebaseAdmin.js
```

`api/` folder को Vercel अपने आप पहचान लेता है और उसमें मौजूद हर file को
server-side function बना देता है — कुछ extra setup नहीं करना पड़ता, बस folder
सही जगह होना चाहिए।

## Step by Step

### 1. Files सही जगह रखें
- इस ZIP के अंदर की `api` folder को अपने project folder में paste करें (root में, `index.html` के बगल में)
- `package.json` को भी root में paste करें — अगर आपके पास पहले से एक `package.json` है, तो उसमें बस यह 2 lines जोड़ दें (पूरी file overwrite ना करें):
  ```json
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "razorpay": "^2.9.4"
  }
  ```

### 2. Firebase Service Account Key लें
यह Firestore में लिखने के लिए चाहिए (सिर्फ server code इस्तेमाल करेगा, browser में नहीं जाएगी):
1. Firebase Console खोलें → अपना project → ⚙️ Project Settings
2. "Service Accounts" tab पर जाएं
3. "Generate New Private Key" पर क्लिक करें → एक `.json` file download होगी
4. उस file को **पूरा खोलकर उसका पूरा content copy कर लें** (यह अगले step में चाहिए)

### 3. Razorpay Key Secret तैयार रखें
- अगर आपने पहले अपनी Key Secret कहीं share की थी (चैट में या और कहीं), तो पहले
  Razorpay Dashboard → Settings → API Keys से उसे **regenerate** कर लें
- नई Key Secret और Key ID दोनों तैयार रखें

### 4. Vercel Dashboard में Environment Variables डालें
1. https://vercel.com पर अपने project में जाएं
2. Settings → **Environment Variables**
3. यह 3 variables एक-एक करके add करें:

   | Name | Value |
   |---|---|
   | `RAZORPAY_KEY_ID` | आपकी Razorpay Key ID |
   | `RAZORPAY_KEY_SECRET` | आपकी नई Razorpay Key Secret |
   | `FIREBASE_SERVICE_ACCOUNT` | Step 2 में download हुई पूरी JSON file का content (पूरा paste करें, `{` से `}` तक) |

4. हर variable के लिए "Production", "Preview", "Development" — तीनों checkbox tick रखें
5. Save करें

### 5. Deploy करें
- अगर आप GitHub से जुड़े हैं तो बस नया code push कर दें, Vercel अपने आप deploy कर देगा
- या Vercel CLI से: `vercel --prod`

### 6. Test करें
- Website खोलें → लॉगिन करें → किसी course पर "Buy"/"अनलॉक करें" दबाएं
- Payment करें → course turant unlock हो जाना चाहिए
- कोई दिक्कत आए तो Vercel Dashboard → आपका project → **Deployments** → latest deployment → **Functions** → logs में जाकर error देखें, वो मुझे बता दीजिए

## यह कैसे काम करता है

- Student "Buy" दबाता है → website `/api/create-order` को call करती है (साथ में उसका login proof/token भेजती है)
- वो function Razorpay पर एक order बनाता है, payment popup खुलता है
- Payment complete होते ही website `/api/verify-payment` को call करती है
- वो function payment का signature check करता है (ताकि कोई fake payment से unlock ना कर सके), फिर Firestore में `payments/{studentId}` document अपने आप update कर देता है
- Course **तुरंत unlock** — कोई manual admin काम नहीं
- Access 365 दिन तक valid रहता है

## ज़रूरी: Firebase Blaze plan अब भी चाहिए, पर सिर्फ Push Notifications के लिए

आपकी website में payment के अलावा एक और छोटा feature Firebase Cloud Functions
इस्तेमाल करता है — **push notifications** (`sendBroadcastNotification`,
`subscribeToNotifications`)। वो अब भी Blaze plan के बिना काम नहीं करेगा। अगर
push notifications फिलहाल इस्तेमाल नहीं कर रहे तो कोई दिक्कत नहीं — बाकी पूरी
website (payment समेत) अब बिना Blaze plan के ठीक काम करेगी।
