#!/usr/bin/env bash

# Build the expo frontend (for the web)
cd frontend/fieldtrip/
npm run deploy:web

# Deploy the backend to serve the page
cd ../../backend
source .venv/bin/activate
pkill -f gunicorn
python3 manage.py collectstatic
gunicorn fieldtrip.wsgi --bind 0.0.0.0:8000 &

