#!/bin/sh
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Loading data from data_dump.json..."
python manage.py loaddata data_dump.json

echo "Creating superuser..."
python create_superuser.py

echo "Starting Gunicorn..."
exec gunicorn rathinamHR.wsgi:application --bind 0.0.0.0:8000
