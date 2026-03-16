#!/usr/bin/env bash

skip_frontend=false

while getopts "s" opt; do
  case $opt in
    s)
      skip_frontend=true
      ;;
  esac
done

# Build the expo frontend (for the web)
if [ "$skip_frontend" = false ]; then
  cd frontend/fieldtrip/ || exit
  npm run deploy:web
  cd ../../
fi

# Deploy the backend to serve the page
cd backend || exit
source .venv/bin/activate
pkill -f gunicorn
python3 manage.py collectstatic --noinput
gunicorn fieldtrip.wsgi --bind 0.0.0.0:8000 &
