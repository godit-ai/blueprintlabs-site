# PMI Dashboard Integration Guide

## Quick Integration with Main Site

### Option 1: Redirect Link (Recommended)
Add this to your main site's navigation or PMI section:

```html
<a href="/dashboard/dist/index.html" class="btn-primary">
    Launch Dashboard
</a>
```

### Option 2: Subdirectory Deployment
Copy the built dashboard to your main site:

```bash
# From repo root
cp -r dashboard/dist/* pmi/dashboard/

# Or create symlink
ln -s dashboard/dist pmi/dashboard
```

Then access at: `https://blueprintlabs.co/pmi/dashboard/`

### Option 3: Iframe Embed
Embed dashboard in existing PMI page:

```html
<div style="width: 100%; height: 800px; border-radius: 12px; overflow: hidden;">
    <iframe 
        src="/dashboard/dist/index.html" 
        width="100%" 
        height="100%" 
        frameborder="0"
        style="background: #0f172a;"
    ></iframe>
</div>
```

### Option 4: Standalone Deployment
Deploy dashboard separately:

```bash
cd dashboard
npm run build

# Deploy dist/ folder to:
# - Netlify: netlify deploy --prod --dir=dist
# - Vercel: vercel --prod
# - GitHub Pages: gh-pages -d dist
# - S3: aws s3 sync dist/ s3://bucket/dashboard/
```

## Navigation Integration

Update your main site's navbar to link to dashboard:

```html
<!-- In blueprintlabs-site/index.html or pmi/index.html -->
<nav class="navbar">
    <div class="container">
        <a href="/" class="logo">Blueprint Labs</a>
        <ul class="nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="/products/">Products</a></li>
            <li><a href="/pmi/">PMI</a></li>
            <li><a href="/dashboard/dist/index.html" class="nav-cta">Dashboard</a></li>
        </ul>
    </div>
</nav>
```

## File Structure After Integration

```
blueprintlabs-site/
├── index.html              # Main site
├── pmi/
│   ├── index.html          # PMI landing page
│   └── dashboard/          # Dashboard (copied from dashboard/dist/)
│       ├── index.html
│       └── assets/
│           ├── index-*.js
│           └── index-*.css
└── dashboard/              # Source code (development)
    ├── src/
    ├── dist/               # Build output
    └── package.json
```

## Development Workflow

### Local Development
```bash
cd dashboard
npm run dev
# Opens at http://localhost:5173/dashboard/
```

### Build for Production
```bash
cd dashboard
npm run build
# Updates dist/ folder
```

### Deploy Updates
```bash
# After building, copy to main site
cp -r dashboard/dist/* pmi/dashboard/

# Commit and push
git add pmi/dashboard/
git commit -m "Update PMI Dashboard"
git push
```

## URL Mapping

| Environment | Dashboard URL |
|-------------|---------------|
| Local Dev | `http://localhost:5173/dashboard/` |
| Local Preview | `file:///path/to/dashboard/dist/index.html` |
| Staging | `https://staging.blueprintlabs.co/pmi/dashboard/` |
| Production | `https://blueprintlabs.co/pmi/dashboard/` |

## Troubleshooting

### Blank Page
- Check browser console for 404 errors
- Verify `assets/` folder is in same directory as `index.html`
- Ensure base path in `vite.config.ts` matches deployment path

### Styling Issues
- Dashboard uses Tailwind CSS (bundled)
- No conflicts with main site styles
- Dark theme is self-contained

### CORS Errors
- If embedding in iframe, ensure same origin
- For cross-origin, set `Access-Control-Allow-Origin` header

## SEO Considerations

Dashboard is a single-page application:
- Add meta tags in `index.html` (already done)
- Consider prerendering for SEO if needed
- Add `robots.txt` to allow indexing

## Support

For issues:
- Check browser console for errors
- Verify all files copied correctly
- Test in incognito mode (no cache)

---

**Integration Date**: March 23, 2026  
**Dashboard Version**: 1.0.0
