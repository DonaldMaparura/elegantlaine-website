# ElegantLaine — Complete Setup Guide

## Project Structure
```
elegantlaine-website/
├── index.html          ← Homepage (storefront)
├── shop.html           ← Product listing with filters
├── account.html        ← Login + Registration
├── checkout.html       ← Cart checkout (demo)
├── about.html, faq.html, contact.html, …  ← Content / legal stubs
├── sitemap.xml
├── robots.txt
├── css/
│   ├── store.css
│   └── admin.css
├── js/
│   ├── store.js
│   └── admin.js
└── admin/
    └── index.html      ← Admin portal
```

## Admin Portal
- URL: `/admin/index.html`
- Demo login: `admin@elegantlaine.com` / `admin123`
- Features: Dashboard, Products (CRUD), Orders, Customers, Marketing, Settings
- Products are saved to localStorage (replace with backend API calls)

## Google AdSense Setup
1. Sign up at https://adsense.google.com
2. Replace `ca-pub-XXXXXXXXXXXXXXXX` in `index.html` with your publisher ID
3. Replace ad slot `XXXXXXXXXX` with your actual ad slot ID
4. Ad unit appears between editorial banner and testimonials

## Google Analytics Setup
1. Create a GA4 property at https://analytics.google.com
2. Replace `G-XXXXXXXXXX` in `index.html` with your Measurement ID

## Newsletter Integration
- In `js/store.js`, find `subscribeNewsletter()` function
- Replace the `console.log` with your provider's API call:
  - **Klaviyo**: POST to their Lists API
  - **Mailchimp**: POST to their subscribe endpoint
  - **ConvertKit**: POST to their subscriber endpoint

## Payment Setup (Production)
- Add Stripe.js to checkout page: https://stripe.com
- Configure PayPal SDK: https://developer.paypal.com
- Toggle Apple Pay / Google Pay in Admin > Settings

## Social Media Accounts to Create
| Platform   | Handle        | Priority | Content Focus             |
|-----------|---------------|----------|---------------------------|
| Instagram  | @elegantlaine | HIGH     | Product photos, reels      |
| TikTok     | @elegantlaine | HIGH     | Try-ons, transformations   |
| Facebook   | /elegantlaine | HIGH     | Community, ads, deals      |
| Pinterest  | /elegantlaine | MEDIUM   | Mood boards, style inspo   |
| YouTube    | @elegantlaine | MEDIUM   | Wig reviews, tutorials     |

## Domain & Hosting
- Recommended: Netlify (free tier), Vercel, or Hostinger
- For Netlify: drag-and-drop the `elegantlaine` folder to https://app.netlify.com/drop
- Domain: elegantlaine.com (check availability on Namecheap or GoDaddy)

## Google Search Console
1. Verify domain at https://search.google.com/search-console
2. Submit sitemap: `https://elegantlaine.com/sitemap.xml`

## Production Backend (Recommended Stack)
- **Auth**: Firebase Auth or Supabase Auth
- **Database**: Firestore or Supabase
- **Payments**: Stripe Checkout
- **Email**: Resend.com or SendGrid
- **Images**: Cloudinary for product image uploads

## SEO Checklist
- [x] Meta titles and descriptions
- [x] Open Graph tags
- [x] Twitter Card tags
- [x] Schema.org structured data (Store type)
- [x] sitemap.xml
- [x] robots.txt (admin blocked)
- [ ] Replace placeholder OG image (og-cover.jpg)
- [ ] Connect Google Analytics
- [ ] Submit to Google Search Console

## Quick Start (Local)
```bash
cd elegantlaine-website
npx --yes serve . -l 3000
# or open index.html in a browser (use a local server so paths resolve reliably)
```
