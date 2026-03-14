# Deploy Instructions - godit-ai GitHub

## 🚀 READY TO DEPLOY

**Repository configured for**: `https://github.com/godit-ai/blueprintlabs-site.git`
**All files ready**: Website complete and committed

---

## STEP 1: Push to GitHub (Clayton needs to do)

### Option A: Use GitHub CLI (if installed)
```bash
cd /home/clay/.openclaw/workspace/blueprintlabs-site
gh auth login
git push -u origin main
```

### Option B: Personal Access Token
```bash
cd /home/clay/.openclaw/workspace/blueprintlabs-site
git config user.name "godit-ai"
git config user.email "your-email@example.com"
git push -u origin main
# (enter GitHub username: godit-ai)
# (enter Personal Access Token when prompted for password)
```

### Option C: SSH (if SSH keys configured)
```bash
cd /home/clay/.openclaw/workspace/blueprintlabs-site
git remote set-url origin git@github.com:godit-ai/blueprintlabs-site.git
git push -u origin main
```

---

## STEP 2: Enable GitHub Pages

1. Go to: https://github.com/godit-ai/blueprintlabs-site
2. Click **Settings** tab
3. Scroll to **Pages** section
4. Source: **Deploy from a branch**
5. Branch: **main** / **(root)**
6. Click **Save**

---

## STEP 3: Configure Namecheap DNS

**In Namecheap Advanced DNS for blueprintlabs.live**:

### Add these records:
- **A Record**: Host `@` → Value `185.199.108.153`
- **A Record**: Host `@` → Value `185.199.109.153`  
- **A Record**: Host `@` → Value `185.199.110.153`
- **A Record**: Host `@` → Value `185.199.111.153`
- **CNAME Record**: Host `www` → Value `godit-ai.github.io.`

### Delete existing records:
- Remove any parking page or default A records
- Keep only the new GitHub Pages records

---

## STEP 4: Wait & Test

1. **DNS Propagation**: 5-30 minutes
2. **Test**: Visit blueprintlabs.live  
3. **Enable HTTPS**: In GitHub Pages settings after site loads
4. **Update**: Replace GA4 placeholder with real tracking ID

---

---

## STEP 0: Get Google Analytics ID (OPTIONAL - 3 minutes)

Since you have GA access, we can set up real tracking immediately:

1. **Go to analytics.google.com**
2. **Create Property** → "Blueprint Labs" → Web Stream → "blueprintlabs.live" 
3. **Copy Measurement ID** (G-XXXXXXXXXX format)
4. **Tell me the ID** → I'll update the website before deployment

**OR** we can deploy with placeholder and update later.

---

**Ready when you are! Which authentication method do you prefer for GitHub?**