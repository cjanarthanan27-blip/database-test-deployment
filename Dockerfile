FROM python:3.12-slim
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
RUN cd apps/water_tracker/frontend && npm install && npm run build
RUN python manage.py collectstatic --noinput
CMD ["gunicorn", "rathinamHR.wsgi:application", "--bind", "0.0.0.0:8000"]
