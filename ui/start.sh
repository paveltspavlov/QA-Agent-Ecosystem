#!/bin/bash
# Quick start script for QA Agent Ecosystem UI
set -e

echo "Building QA Agent Ecosystem UI..."
npm run build

echo "Starting server on http://localhost:5000"
NODE_ENV=production node dist/index.cjs
