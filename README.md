# Blueprint Labs Website

**Live at:** [blueprintlabs.live](https://blueprintlabs.live)

Professional landing page for Blueprint Labs — AI-powered tools and templates for professionals.

## Quick Deploy to GitHub Pages

### 1. Create GitHub Repository

```bash
# From this directory
cd blueprintlabs-site
git init
git add -A
git commit -m "Initial launch: Blueprint Labs website"

# Create repo on GitHub (via browser or gh CLI)
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/blueprintlabs-site.git
git branch -M main
git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to **Settings → Pages** in your GitHub repo
2. Source: **Deploy from a branch**
3. Branch: **main** / **(root)**
4. Click **Save**
5. The CNAME file will auto-configure the custom domain

### 3. Configure DNS at Namecheap

Go to **Namecheap → Domain List → blueprintlabs.live → Advanced DNS**

Add these records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | 185.199.108.153 | Automatic |
| A | @ | 185.199.109.153 | Automatic |
| A | @ | 185.199.110.153 | Automatic |
| A | @ | 185.199.111.153 | Automatic |
| CNAME | www | YOUR_USERNAME.github.io. | Automatic |

**Delete** any existing A records or parking page records first.

### 4. Enable HTTPS

1. Wait ~30 min for DNS propagation
2. Go to **Settings → Pages** in GitHub
3. Check **Enforce HTTPS**

## Post-Launch Checklist

- [ ] Replace `G-XXXXXXXXXX` in index.html with actual GA4 Measurement ID
- [ ] Update Gumroad product URL (`https://blueprintlabs.gumroad.com/l/real-estate-ai-prompts`) with actual product link
- [ ] Set up email forwarding for hello@blueprintlabs.live (Namecheap → Email Forwarding)
- [ ] Create GA4 property at [analytics.google.com](https://analytics.google.com)
- [ ] Test Gumroad checkout flow end-to-end

## Adding New Products

1. Duplicate a product section or add a new page (e.g., `products/solar-prompts.html`)
2. Update nav links
3. Add product images to `assets/images/`
4. Commit and push — GitHub Pages auto-deploys

## Structure

```
blueprintlabs-site/
├── index.html          # Main landing page
├── 404.html            # Custom 404 page
├── CNAME               # Custom domain config
├── robots.txt          # Search engine directives
├── sitemap.xml         # SEO sitemap
├── README.md           # This file
└── assets/
    └── images/
        ├── logo-icon.png
        ├── logo-icon-v2.png
        ├── header-banner.png
        ├── header-gumroad.png
        └── cover-final.png
```

## Brand Colors

| Color | Hex | Use |
|-------|-----|-----|
| Navy | #1a1a2e | Backgrounds |
| Blueprint Blue | #4a90d9 | Accents, links |
| White | #ffffff | Text |
| Light Grid | #e8f0fe | Card backgrounds |
| Gold | #d4af37 | CTAs, premium |

---

*Built for [Blueprint Labs](https://blueprintlabs.live) · © 2026*
