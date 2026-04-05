# Elegantlaine — Go Live on Firebase Hosting

## Prerequisites
- Node.js installed: https://nodejs.org
- Firebase account: https://console.firebase.google.com

---

## Step 1 — Install Firebase CLI
```bash
npm install -g firebase-tools
```

## Step 2 — Login to Firebase
```bash
firebase login
```

## Step 3 — Set your Firebase project
```bash
firebase use elegantlaine
```
(Or: `firebase use --add` → select your project)

## Step 4 — Create your admin user in Firebase Console
1. Go to https://console.firebase.google.com → your project
2. Authentication → Sign-in method → Enable **Email/Password**
3. Authentication → Users → **Add user**
   - Email: `admin@elegantlaine.com` (or yours)
   - Password: (choose a strong password)
4. That's your admin login. No hardcoded passwords.

## Step 5 — Enable Firestore & Storage
1. Firebase Console → Firestore Database → Create database → **Production mode**
2. Firebase Console → Storage → Get started → **Production mode**
3. Rules are already in `firestore.rules` and `storage.rules` — they'll deploy automatically

## Step 6 — Deploy
```bash
cd elegantlaine-website
firebase deploy
```

Your site will be live at:
- **https://elegantlaine.web.app** (immediate)
- **https://elegantlaine.firebaseapp.com** (immediate)

## Step 7 — Custom Domain (elegantlaine.com)
1. Firebase Hosting → Add custom domain → `elegantlaine.com`
2. Add the DNS records shown to your domain registrar (Namecheap/GoDaddy)
3. SSL is automatic — takes 10–30 min

---

## Admin Access
- URL: `https://elegantlaine.web.app/admin/`
- Login with the Firebase Auth email/password you created in Step 4
- Add products → they appear live on the store in real-time (Firestore)
- Upload product images → they go to Firebase Storage automatically

## After Going Live
- Replace `ca-pub-XXXXXXXXXXXXXXXX` in `index.html` with your AdSense publisher ID
- Replace `G-XXXXXXXXXX` with your Google Analytics Measurement ID
- Update social media links to your real handles
- Update PayFast merchant ID in `js/payfast-runtime.js`

## Re-deploy after changes
```bash
firebase deploy --only hosting
```
