# Water Purchase Tracker

A full-stack web application for tracking water purchases and costs, built with **Django REST Framework** (backend) and **React** (frontend).

## 🏗️ Architecture

- **Backend**: Django 6.0 + Django REST Framework
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Database**: PostgreSQL (with SQLite fallback for development)
- **API**: RESTful API with JWT/Basic authentication

```
water-tracker/
├── backend/           # Django backend
│   ├── core/         # Main app (models, views, serializers)
│   └── water_tracker_project/  # Django settings
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   └── services/    # API service layer
│   └── public/
├── legacy/           # Old Flask application (archived)
└── docs/             # Additional documentation
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture information.

## ✨ Features

- **User Authentication**: Role-based access (Admin, Data Entry, Viewer)
- **Water Entry Management**: Track water deliveries from multiple sources
- **Rate Management**: Historical rate tracking for vehicles and vendors
- **Dashboard**: Real-time statistics and recent activity
- **Multi-source Support**: Internal vehicles, vendor vehicles, and pipelines

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL** (optional, SQLite used by default)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

Backend will be available at `http://localhost:8000`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

### 3. Default Credentials

- **Username**: `admin`
- **Password**: `admin123` (change immediately in production!)

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/water_tracker

# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS (for frontend)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

See `.env.example` for complete configuration options.

## 📚 Documentation

- [Architecture Guide](./ARCHITECTURE.md) - System design and technical decisions
- [Backend API Documentation](./backend/API.md) - Complete API reference
- [Backend Models](./backend/MODELS.md) - Database schema documentation
- [Frontend Components](./frontend/COMPONENTS.md) - Component documentation

## 🗄️ Database Setup (PostgreSQL)

If using PostgreSQL instead of SQLite:

```bash
# Initialize database with schema
python init_db_postgres.py

# Or manually:
psql -U postgres -d water_tracker -f schema_postgres.sql
psql -U postgres -d water_tracker -f seed_postgres.sql
```

## 🧪 Development

### Backend

```bash
cd backend

# Run tests
python manage.py test

# Create new migrations
python manage.py makemigrations

# Access Django admin
# http://localhost:8000/admin/
```

### Frontend

```bash
cd frontend

# Run linter
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Production Deployment

1. **Backend**: Use a production WSGI server (gunicorn, uwsgi)
2. **Frontend**: Build static files and serve with nginx/Apache
3. **Database**: Use PostgreSQL (required for production)
4. **Environment**: Set `DEBUG=False`, configure proper `SECRET_KEY`

See deployment guides for detailed instructions.

## 🔄 Migration from Flask

The previous Flask application has been archived in the `legacy/` folder. To migrate existing data:

1. Export data from the old SQLite database
2. Run the PostgreSQL initialization scripts
3. Import the data using Django's management commands

## 📝 License

This project is proprietary software.

## 🤝 Contributing

Internal project - contact the development team for contribution guidelines.

## 📧 Support

For issues or questions, contact the development team.
