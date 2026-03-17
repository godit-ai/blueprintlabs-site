# PMI Website Deployment Guide

## ✅ What's Been Built

### Complete Page List (9 pages)
1. **index.html** - Main landing page with fixed links
2. **docs.html** - Full API documentation
3. **playground.html** - Interactive compression demo
4. **signup.html** - User registration page
5. **login.html** - User login page
6. **dashboard.html** - User dashboard with API keys
7. **privacy.html** - Privacy policy
8. **terms.html** - Terms of service
9. **simple.html** - Simple version (pre-existing)

### Fixed Issues
- ✅ All "Get API Key" buttons now link to signup.html
- ✅ All pricing "Get Started" buttons link to signup.html
- ✅ Navigation links work between all pages
- ✅ Footer links point to real pages (privacy, terms)
- ✅ Demo button links to playground.html
- ✅ Docs link added to navigation

## 🚀 Deployment Steps

### Option 1: Quick Deploy (GitHub Pages)
```bash
cd /home/clay/.openclaw/workspace/blueprintlabs-site
git add pmi/
git commit -m "Add complete PMI website with all pages"
git push origin main
```

### Option 2: Manual Upload
Upload all files from `/home/clay/.openclaw/workspace/blueprintlabs-site/pmi/` to your web server at `blueprintlabs.live/pmi/`

### Option 3: Test Locally First
```bash
cd /home/clay/.openclaw/workspace/blueprintlabs-site/pmi/
python3 -m http.server 8000
# Then open http://localhost:8000 in browser
```

## 🔧 Backend Integration Needed

### 1. User Authentication
**Pages affected:** signup.html, login.html, dashboard.html

**What to implement:**
- POST /api/auth/signup - Create new user account
- POST /api/auth/login - Authenticate user
- POST /api/auth/logout - End user session
- GET /api/auth/me - Get current user info

**Current state:** Forms submit but show mock success messages

### 2. API Key Management
**Page affected:** dashboard.html

**What to implement:**
- GET /api/keys - List user's API keys
- POST /api/keys - Generate new API key
- DELETE /api/keys/:id - Revoke API key
- GET /api/keys/:id/stats - Get usage stats for key

**Current state:** Shows dummy API keys with copy/show/hide functionality

### 3. Compression API
**Page affected:** playground.html

**What to implement:**
- POST /api/v1/compress - The actual compression endpoint
  - Input: { prompt: string, quality_threshold?: number, preserve_entities?: boolean }
  - Output: { success: bool, data: { original, compressed, tokens_saved, quality_score, ... } }

**Current state:** Simulates compression with simple text replacement

### 4. Usage Analytics
**Page affected:** dashboard.html

**What to implement:**
- GET /api/analytics/usage - Monthly usage stats
- GET /api/analytics/savings - Cost savings calculation
- GET /api/analytics/activity - Recent activity log

**Current state:** Shows dummy data

### 5. Stripe Payments
**Pages affected:** index.html (pricing section), dashboard.html

**What to implement:**
- POST /api/billing/checkout - Create Stripe checkout session
- POST /api/billing/portal - Create customer portal session
- POST /api/webhooks/stripe - Handle Stripe webhooks

**Current state:** Links to signup page only

## 📋 Environment Variables Needed

```bash
# Backend .env file
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PMI_API_URL=https://api.blueprintlabs.live
FRONTEND_URL=https://blueprintlabs.live
```

## 🧪 Testing Checklist

- [ ] Navigate from homepage to signup
- [ ] Submit signup form
- [ ] Login with test credentials
- [ ] View dashboard and API keys
- [ ] Copy API key to clipboard
- [ ] Test playground with sample prompts
- [ ] Check all footer links
- [ ] Test responsive design on mobile
- [ ] Verify privacy and terms pages load
- [ ] Test all navigation between pages

## 🎨 Customization Points

### Colors (already set)
- Primary: #2563eb (blue)
- Secondary: #0ea5e9 (cyan)
- Success: #22c55e (green)
- Warning: #f59e0b (orange)

### Logo
All pages use `PM` logo icon - can be replaced with actual logo image:
```html
<div class="logo-icon">PM</div>
```

### Email Addresses
Update these in the pages:
- support@blueprintlabs.live (docs.html)
- privacy@blueprintlabs.live (privacy.html)
- legal@blueprintlabs.live (terms.html)
- sales@blueprintlabs.live (index.html)

## 📊 File Locations

All files are in:
```
/home/clay/.openclaw/workspace/blueprintlabs-site/pmi/
```

Deploy to:
```
https://blueprintlabs.live/pmi/
```

## ⚡ Quick Commands

### Deploy via Git
```bash
cd /home/clay/.openclaw/workspace/blueprintlabs-site
git add .
git commit -m "Complete PMI website with all functional pages"
git push
```

### Test Chrome Extension Integration
The playground.html page is ready for your Chrome extension to inject compression functionality.

## 🔐 Security Notes

1. Never expose real API keys in frontend code
2. Use HTTPS for all authentication endpoints
3. Implement CSRF protection for forms
4. Rate limit all API endpoints
5. Validate all user input server-side
6. Use secure cookies for session management

## 📈 Next Steps

1. **Deploy frontend** - Push to GitHub Pages or your server
2. **Build backend** - Implement the API endpoints listed above
3. **Connect Stripe** - Set up payment processing
4. **Test flow** - Complete signup → dashboard → API usage flow
5. **Launch** - Make it live and monitor

---

**Status:** Frontend complete ✅ | Backend integration needed 🔧
**Last Updated:** March 17, 2026
