# PMI Dashboard - Deployment Guide

## Quick Start

### Development
```bash
cd dashboard
npm install
npm run dev
```
Visit: `http://localhost:5173/dashboard/`

### Production Build
```bash
npm run build
```
Output: `dist/` directory

## Deployment Options

### 1. GitHub Pages (Recommended for Demo)

```bash
# Build the dashboard
npm run build

# The dist/ folder contains the static site
# Copy contents to your blueprintlabs-site repo
cp -r dist/* ../pmi/dashboard/

# Commit and push
git add ../pmi/dashboard/
git commit -m "Add PMI Dashboard"
git push
```

Access at: `https://blueprintlabs.co/pmi/dashboard/`

### 2. Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

Or connect your GitHub repo in Netlify dashboard:
- Build command: `cd dashboard && npm run build`
- Publish directory: `dashboard/dist`

### 3. Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Or connect via Vercel dashboard with:
- Framework: Vite
- Root Directory: `dashboard`
- Build Command: `npm run build`
- Output Directory: `dist`

### 4. Static Hosting (S3, Firebase, etc.)

After building (`npm run build`), upload the `dist/` folder to any static host:

**AWS S3 + CloudFront:**
```bash
aws s3 sync dist/ s3://your-bucket/dashboard/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/dashboard/*"
```

**Firebase Hosting:**
```bash
firebase deploy --only hosting
```

**Cloudflare Pages:**
- Connect GitHub repo
- Build command: `cd dashboard && npm run build`
- Output: `dashboard/dist`

### 5. Docker

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/dashboard/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t pmi-dashboard .
docker run -p 8080:80 pmi-dashboard
```

## Integration with Main Site

To embed the dashboard in the existing Blueprint Labs site:

### Option A: Subdirectory
```bash
# Copy built dashboard to main site
cp -r dist/* /path/to/blueprintlabs-site/pmi/dashboard/

# Link from main site
<a href="/pmi/dashboard/">PMI Dashboard</a>
```

### Option B: Iframe Embed
```html
<iframe 
  src="https://dashboard.blueprintlabs.co" 
  width="100%" 
  height="800px" 
  frameborder="0"
></iframe>
```

### Option C: Subdomain
Deploy to `dashboard.blueprintlabs.co` with DNS:
```
CNAME dashboard -> your-host.netlify.app
```

## Environment Variables

For API integration, create `.env.production`:

```env
VITE_API_URL=https://api.blueprintlabs.co/v1
VITE_API_KEY=your_api_key_here
```

Update `src/hooks/usePMI.ts` to use these:
```typescript
const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;
```

## CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy-dashboard.yml`:

```yaml
name: Deploy Dashboard

on:
  push:
    branches: [main]
    paths: ['dashboard/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install and Build
        run: |
          cd dashboard
          npm ci
          npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: dashboard/dist
          destination_dir: pmi/dashboard
```

## Performance Optimization

### Code Splitting
To reduce initial bundle size, implement lazy loading:

```typescript
// App.tsx
import { lazy, Suspense } from 'react';

const OverviewTab = lazy(() => import('./components/tabs/OverviewTab'));
const MemoryTab = lazy(() => import('./components/tabs/MemoryTab'));
// ... etc

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  {activeTab === 'overview' && <OverviewTab />}
</Suspense>
```

### Vite Configuration
Update `vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
```

## Monitoring

Add analytics to track dashboard usage:

```typescript
// src/main.tsx
import { useEffect } from 'react';

function Analytics() {
  useEffect(() => {
    // Google Analytics, Plausible, etc.
    window.gtag?.('event', 'page_view', { page_path: location.pathname });
  }, []);
  return null;
}
```

## Troubleshooting

### Build Errors
- Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
- Check Node version: Should be 18+ (`node --version`)
- TypeScript errors: Run `npm run build` to see detailed errors

### Blank Page After Deploy
- Check base path in `vite.config.ts` matches your hosting path
- Verify all assets are served with correct MIME types
- Check browser console for 404 errors

### Chart Rendering Issues
- Ensure Recharts has correct container dimensions
- Add min-height to chart containers
- Check responsive container setup

## Support

For issues or questions:
- GitHub Issues: `https://github.com/your-org/blueprintlabs-site/issues`
- Email: support@blueprintlabs.co
- Docs: `https://blueprintlabs.co/docs`

---

**Last Updated:** March 23, 2026  
**Dashboard Version:** 1.0.0
