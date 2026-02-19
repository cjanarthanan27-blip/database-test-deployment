# Architecture Documentation

## System Overview

The Water Purchase Tracker is a full-stack web application using a modern API-first architecture with clear separation between backend and frontend.

## Technology Stack

### Backend
- **Framework**: Django 6.0 with Django REST Framework
- **Database**: PostgreSQL (production), SQLite (development fallback)
- **ORM**: Django ORM
- **API**: RESTful API with JSON responses
- **Authentication**: Django authentication system with Basic Auth (to be upgraded to JWT)

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 7.3
- **Styling**: Tailwind CSS 3.4
- **HTTP Client**: Axios
- **Routing**: React Router DOM v7

## Architecture Patterns

### Backend Architecture

```
backend/
├── water_tracker_project/    # Django project configuration
│   ├── settings.py           # Application settings
│   ├── urls.py               # Root URL configuration
│   └── wsgi.py               # WSGI application
├── core/                      # Main application
│   ├── models.py             # Database models (ORM)
│   ├── serializers.py        # DRF serializers
│   ├── views.py              # API views (ViewSets)
│   ├── urls.py               # API endpoint routing
│   └── migrations/           # Database migrations
└── manage.py                 # Django management script
```

**Key Design Decisions**:

1. **ViewSets over Function-based Views**: Using DRF ViewSets for automatic CRUD operations
2. **Custom User Model**: Extended Django's `AbstractUser` to include role field
3. **Serializer-based Validation**: All input validation handled by DRF serializers
4. **Database URL Configuration**: Using `dj-database-url` for flexible database configuration

### Frontend Architecture

```
frontend/
├── src/
│   ├── components/           # React components
│   │   ├── Login.jsx        # Authentication
│   │   ├── Dashboard.jsx    # Dashboard view
│   │   └── Entries.jsx      # Entries management
│   ├── services/
│   │   └── api.js           # Axios API client
│   ├── App.jsx              # Root component with routing
│   ├── main.jsx             # Application entry point
│   └── index.css            # Tailwind CSS imports
├── public/                   # Static assets
└── index.html               # HTML template
```

**Key Design Decisions**:

1. **SPA Architecture**: Single-page application with client-side routing
2. **Component-based Design**: Reusable, stateful functional components
3. **Centralized API Service**: Single `api.js` module for all backend communication
4. **Route Protection**: `PrivateRoute` wrapper component for authentication checks

## Data Flow

### Authentication Flow

```
1. User submits credentials → Login.jsx
2. POST /api/login → Django authentication
3. Django validates credentials
4. Success: Return user data → Store in localStorage
5. Frontend redirects to Dashboard
```

### Data Fetching Flow

```
1. Component mounts → useEffect hook
2. api.get() → Axios request with auth header
3. Django View → Serializer → Database query
4. JSON response → Component state update
5. UI re-renders with data
```

## Database Schema

### Core Models

1. **User** (extends AbstractUser)
   - Custom fields: `role` (Admin/Data_Entry/Viewer)
   - Authentication and authorization

2. **Master Tables**
   - `MasterLocation`: Physical locations
   - `MasterSource`: Water sources (vendors, pipelines)
   - `MasterInternalVehicle`: Company-owned vehicles
   - `MasterVendorVehicle`: Vendor vehicles

3. **Rate History Tables**
   - `RateHistoryInternalVehicle`: Vehicle cost tracking
   - `RateHistoryVendor`: Vendor rate tracking
   - `RateHistoryPipeline`: Pipeline rate tracking

4. **Transaction Table**
   - `WaterEntry`: Individual water purchase records

See [backend/MODELS.md](./backend/MODELS.md) for complete schema documentation.

## API Design

### RESTful Endpoints

- **Resource-based URLs**: `/api/entries/`, `/api/locations/`
- **HTTP Methods**: GET, POST, PUT, PATCH, DELETE
- **Standard Status Codes**: 200, 201, 400, 401, 404, 500
- **JSON Responses**: Consistent response format

### Authentication

Current: Basic Authentication (username:password encoded in Base64)
Future: JWT tokens for stateless authentication

## Security Considerations

1. **CORS Configuration**: Restricted to localhost during development
2. **CSRF Protection**: Django CSRF middleware enabled
3. **Input Validation**: DRF serializers validate all inputs
4. **Password Hashing**: Django's PBKDF2 password hasher
5. **SQL Injection Prevention**: ORM-based queries (parameterized)

## Performance Optimization

1. **Database Connection Pooling**: `conn_max_age=600` in settings
2. **Static File Serving**: Vite's optimized build process
3. **Lazy Loading**: React Router lazy imports (future)
4. **Database Indexing**: Foreign keys automatically indexed

## Development vs. Production

### Development
- DEBUG=True
- SQLite fallback
- CORS allows localhost
- Django dev server
- Vite dev server with HMR

### Production
- DEBUG=False
- PostgreSQL required
- Restricted CORS origins
- Gunicorn/uWSGI
- Static files served by nginx

## Migration Strategy

### From Flask to Django

**Completed**:
- ✅ Models migrated to Django ORM
- ✅ API endpoints recreated with DRF
- ✅ Authentication system reimplemented
- ✅ Frontend rebuilt with React

**Pending**:
- ⏳ Data migration from old SQLite database
- ⏳ Complete form implementation
- ⏳ Advanced features (reporting, analytics)

## Future Enhancements

1. **JWT Authentication**: Replace Basic Auth with JWT tokens
2. **WebSocket Support**: Real-time updates for dashboard
3. **File Uploads**: Support for invoices and documents
4. **Advanced Filtering**: Complex queries and search
5. **Export Features**: PDF/Excel report generation
6. **Audit Logging**: Track all data changes
7. **API Versioning**: `/api/v1/`, `/api/v2/`

## Technology Justifications

### Why Django?
- Robust ORM with migrations
- Built-in admin interface
- Strong security features
- Excellent documentation
- Large ecosystem

### Why React?
- Component reusability
- Virtual DOM performance
- Large community and tooling
- Easy state management
- Strong TypeScript support (future)

### Why PostgreSQL?
- Advanced features (JSON fields, full-text search)
- Better performance for complex queries
- Production-ready scalability
- Django optimization

## Deployment Architecture (Future)

```
                    ┌─────────────────┐
                    │   nginx/Proxy   │
                    └────────┬────────┘
                             │
            ┌────────────────┴────────────────┐
            │                                  │
    ┌───────▼───────┐                ┌────────▼────────┐
    │  Static Files │                │  Django (WSGI)  │
    │  (React Build)│                │   Gunicorn      │
    └───────────────┘                └────────┬────────┘
                                              │
                                     ┌────────▼────────┐
                                     │   PostgreSQL    │
                                     └─────────────────┘
```
