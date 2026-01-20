#!/bin/bash

# Forcefully kill any process on port 8000 (Python or Node)
echo "Cleaning up port 8000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null

if command -v node &>/dev/null; then
    echo "Starting Node.js Proxy Server..."
    node server.js
else
    echo "CRITICAL ERROR: Node.js not found. Please install Node.js."
    exit 1
fi
