# PMI Dashboard

Real-time monitoring dashboard for **Predictive Memory Intelligence** (PMI) - Blueprint Labs' intelligent context compression and object memory system.

## Features

### 📊 Usage Overview
- Total tokens saved across all conversations
- Compression ratio trends over time
- Cost savings calculations
- API call statistics

### 🧠 Object Memory Visualization
- Extracted structured entities (meetings, decisions, facts, people, dates, topics)
- Filter by type and search functionality
- Confidence scoring for each extraction
- Semantic storage and reconstruction metrics

### 💾 Prefix Cache Stats
- Cache hit rate visualization
- Most frequently cached prefixes
- Savings breakdown per prefix
- Performance optimization insights

### 🧪 Real-time Testing
- Live text input and compression
- Before/after comparison
- Extracted objects display
- Token savings calculation

## Tech Stack

- **React 18** + **TypeScript** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling (dark theme)
- **Recharts** - Data visualization
- **Lucide React** - Icon library

## Development

### Install Dependencies
```bash
npm install
```

### Start Dev Server
```bash
npm run dev
```
Visit `http://localhost:5173/dashboard/`

### Build for Production
```bash
npm run build
```
Output: `dist/` directory

### Preview Build
```bash
npm run preview
```

## Project Structure

```
dashboard/
├── src/
│   ├── components/
│   │   ├── tabs/          # Main tab views
│   │   ├── charts/        # Recharts visualizations
│   │   ├── cards/         # Reusable card components
│   │   ├── memory/        # Object memory components
│   │   ├── testing/       # Live testing interface
│   │   └── Navbar.tsx     # Navigation
│   ├── hooks/
│   │   └── usePMI.ts      # PMI API hooks
│   ├── data/
│   │   └── mockData.ts    # Demo data
│   ├── types/
│   │   └── index.ts       # TypeScript types
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── index.html             # HTML template
└── package.json
```

## API Integration

The dashboard currently uses mock data. To connect to a real PMI API:

1. Update `src/hooks/usePMI.ts` to replace `simulateCompression()` with actual API calls
2. Add environment variables for API endpoint and authentication
3. Implement proper error handling and loading states

Example API integration:
```typescript
async function compress(text: string) {
  const response = await fetch('https://api.blueprintlabs.co/v1/pmi/compress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, options: { extractObjects: true } })
  });
  return await response.json();
}
```

## Design System

The dashboard follows Blueprint Labs' design language:

- **Colors**: Primary blue (`#2563eb`), Secondary purple (`#7c3aed`), Success green (`#10b981`)
- **Dark Theme**: Background (`#0f172a`), Cards (`#1e293b`), Borders (`#334155`)
- **Typography**: Inter font family, responsive sizing
- **Components**: Glass-morphism cards, gradient accents, smooth animations

## Deployment

### Static Hosting
```bash
npm run build
# Upload dist/ to your static host (Netlify, Vercel, S3, etc.)
```

### GitHub Pages
```bash
npm run build
# Push dist/ to gh-pages branch
```

### Docker
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/dashboard/
```

## License

© 2026 Blueprint Labs. All rights reserved.
