FROM python:3.12-slim

RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN pip install -r requirements.txt

# Build the frontend
RUN cd apps/water_tracker/frontend && npm install && npm run build

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Collect static files
RUN python manage.py collectstatic --noinput

ENTRYPOINT ["/app/entrypoint.sh"]
