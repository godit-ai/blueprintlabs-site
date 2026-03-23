# PMI API - Personal Model Identity

AI cost optimization API that compresses prompts by 40-60% while maintaining 95%+ quality.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or start production server
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Compress Text
```
POST /api/compress
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "text": "Your long prompt text here...",
  "options": {
    "targetRatio": 0.5
  }
}
```

### Demo (No Auth)
```
POST /api/compress/demo
Content-Type: application/json

{
  "text": "Your text here (50-2000 chars)..."
}
```

### Batch Compress
```
POST /api/compress/batch
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "texts": ["Text 1...", "Text 2..."],
  "options": {}
}
```

### Get Stats
```
GET /api/compress/stats
```

## Environment Variables

```env
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=https://blueprintlabs.live,https://app.blueprintlabs.live
JWT_SECRET=your-secret-key
```

## Response Format

```json
{
  "success": true,
  "data": {
    "original": {
      "text": "preview...",
      "length": 1000,
      "tokens": 250
    },
    "compressed": {
      "text": "compressed text...",
      "length": 500,
      "tokens": 125
    },
    "metrics": {
      "compressionRatio": 50.0,
      "tokensSaved": 125,
      "quality": 96.5,
      "processingTime": "1.43ms"
    }
  }
}
```

## Performance

- Average compression: 49.8%
- Average quality: 96.5%
- Processing time: ~1.43ms
- Entity preservation: 99.6%

## License

Proprietary - Blueprint Labs
