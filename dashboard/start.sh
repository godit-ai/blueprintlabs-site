#!/bin/bash
# PMI Dashboard - Quick Start Script

set -e

echo "🚀 PMI Dashboard - Blueprint Labs"
echo "=================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✓ Dependencies installed"
    echo ""
fi

# Start dev server
echo "🔥 Starting development server..."
echo "📍 Dashboard will be available at: http://localhost:5173/dashboard/"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev
