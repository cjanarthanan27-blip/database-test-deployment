# API Documentation

REST API documentation for the Water Purchase Tracker backend.

**Base URL**: `http://localhost:8000/api/`

## Authentication

### Login

**Endpoint**: `POST /api/login`

**Description**: Authenticate user and receive user details.

**Request**:
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "Admin",
    "is_active": true,
    "last_login": "2024-02-09T10:30:00Z"
  }
}
```

**Error** (401 Unauthorized):
```json
{
  "error": "Invalid credentials"
}
```

---

## Users

### List Users

**Endpoint**: `GET /api/users/`

**Response**:
```json
[
  {
    "id": 1,
    "username": "admin",
    "role": "Admin",
    "is_active": true,
    "last_login": "2024-02-09T10:30:00Z"
  }
]
```

### Get User

**Endpoint**: `GET /api/users/{id}/`

### Create User

**Endpoint**: `POST /api/users/`

**Request**:
```json
{
  "username": "newuser",
  "password": "securepassword",
  "role": "Data_Entry",
  "is_active": true
}
```

### Update User

**Endpoint**: `PUT /api/users/{id}/` or `PATCH /api/users/{id}/`

### Delete User

**Endpoint**: `DELETE /api/users/{id}/`

---

## Locations

### List Locations

**Endpoint**: `GET /api/locations/`

**Response**:
```json
[
  {
    "id": 1,
    "location_name": "Site A",
    "location_type": "Loading",
    "address": "123 Main St",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Get Location

**Endpoint**: `GET /api/locations/{id}/`

### Create Location

**Endpoint**: `POST /api/locations/`

**Request**:
```json
{
  "location_name": "New Site",
  "location_type": "Unloading",
  "address": "456 Oak Ave",
  "is_active": true
}
```

### Update Location

**Endpoint**: `PUT /api/locations/{id}/` or `PATCH /api/locations/{id}/`

### Delete Location

**Endpoint**: `DELETE /api/locations/{id}/`

---

## Sources

### List Sources

**Endpoint**: `GET /api/sources/`

**Response**:
```json
[
  {
    "id": 1,
    "source_name": "Vendor A",
    "source_type": "Vendor",
    "contact_person": "John Doe",
    "contact_phone": "123-456-7890",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### CRUD Operations

Similar to Locations: GET, POST, PUT, PATCH, DELETE

---

## Internal Vehicles

### List Internal Vehicles

**Endpoint**: `GET /api/internal-vehicles/`

**Response**:
```json
[
  {
    "id": 1,
    "vehicle_name": "Truck 001",
    "vehicle_number": "KA01AB1234",
    "capacity_liters": 5000,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### CRUD Operations

Similar pattern: GET, POST, PUT, PATCH, DELETE

---

## Vendor Vehicles

**Endpoint**: `/api/vendor-vehicles/`

Similar to Internal Vehicles.

---

## Rate History

### Internal Vehicle Rates

**Endpoint**: `GET /api/rates/internal/`

**Response**:
```json
[
  {
    "id": 1,
    "vehicle": 1,
    "effective_date": "2024-01-01",
    "cost_per_load": 500.00,
    "notes": "Standard rate",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Vendor Rates

**Endpoint**: `GET /api/rates/vendor/`

**Response**:
```json
[
  {
    "id": 1,
    "source": 1,
    "source_name": "Vendor A",
    "effective_date": "2024-01-01",
    "cost_type": "Per_Liter",
    "rate_value": 0.50,
    "vehicle_capacity": null,
    "calculated_cost_per_kl": 500.00,
    "notes": "",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Pipeline Rates

**Endpoint**: `GET /api/rates/pipeline/`

**CRUD Operations**: GET, POST, PUT, PATCH, DELETE for all rate endpoints

---

## Water Entries

### List Entries

**Endpoint**: `GET /api/entries/`

**Response**:
```json
[
  {
    "id": 1,
    "entry_date": "2024-02-09",
    "source": 1,
    "source_name": "Vendor A",
    "loading_location": 1,
    "loading_location_name": "Site A",
    "unloading_location": 2,
    "unloading_location_name": "Site B",
    "shift": "Morning",
    "water_type": "Potable",
    "vehicle": 1,
    "vehicle_name": "Truck 001",
    "load_count": 2,
    "meter_reading_current": 15000,
    "meter_reading_previous": 10000,
    "manual_capacity_liters": null,
    "total_quantity_liters": 5000.00,
    "total_cost": 2500.00,
    "snapshot_cost_per_liter": 0.50,
    "snapshot_cost_per_kl": 500.00,
    "snapshot_paise_per_liter": 50.00,
    "created_by": 1,
    "created_by_username": "admin",
    "created_at": "2024-02-09T10:30:00Z"
  }
]
```

### Create Entry

**Endpoint**: `POST /api/entries/`

**Request**:
```json
{
  "entry_date": "2024-02-09",
  "source": 1,
  "loading_location": 1,
  "unloading_location": 2,
  "shift": "Morning",
  "water_type": "Potable",
  "vehicle": 1,
  "load_count": 2,
  "total_quantity_liters": 5000,
  "total_cost": 2500
}
```

### CRUD Operations

GET, POST, PUT, PATCH, DELETE

---

## Custom Endpoints

### Calculate Cost

**Endpoint**: `POST /api/calculate-cost`

**Description**: Calculate water cost based on source type, date, and quantity.

**Request**:
```json
{
  "source_type": "vendor",
  "source_id": 1,
  "vehicle_id": null,
  "quantity_liters": 5000,
  "entry_date": "2024-02-09"
}
```

**Response**:
```json
{
  "total_cost": 2500.00
}
```

**Source Types**:
- `internal` - Uses vehicle rate
- `vendor` - Uses vendor rate
- `pipeline` - Uses pipeline rate

---

### Dashboard Statistics

**Endpoint**: `GET /api/dashboard-stats`

**Description**: Get current month statistics and recent activity.

**Response**:
```json
{
  "total_cost": 150000.00,
  "total_volume_kl": 300.50,
  "avg_rate": 499.17,
  "recent_activity": [
    {
      "date": "2024-02-09",
      "source": "Vendor A",
      "vehicle": "Truck 001",
      "volume": "5.0 KL",
      "cost": 2500.00
    }
  ]
}
```

---

### Dropdown Data

**Endpoint**: `GET /api/dropdown-data`

**Description**: Get all active master data for form dropdowns.

**Response**:
```json
{
  "locations": [
    {
      "id": 1,
      "location_name": "Site A",
      "location_type": "Loading"
    }
  ],
  "sources": [
    {
      "id": 1,
      "source_name": "Vendor A",
      "source_type": "Vendor"
    }
  ],
  "vehicles": [
    {
      "id": 1,
      "vehicle_name": "Truck 001",
      "capacity_liters": 5000
    }
  ]
}
```

---

## HTTP Status Codes

- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid input/validation error
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Error Response Format

```json
{
  "error": "Brief error message",
  "detail": "Detailed error information (optional)"
}
```

## Pagination

List endpoints support pagination (default: 100 items):

**Query Parameters**:
- `limit` - Items per page
- `offset` - Number of items to skip

**Example**: `GET /api/entries/?limit=50&offset=100`

## Filtering & Ordering

Most list endpoints support filtering and ordering:

**Query Parameters**:
- `ordering` - Sort by field (prefix with `-` for descending)
- `search` - Search across relevant fields

**Example**: `GET /api/entries/?ordering=-entry_date&search=vendor`

## CORS Configuration

Cross-Origin Resource Sharing is enabled for:
- `http://localhost:5173` (React dev server)
- `http://127.0.0.1:5173`

Production deployment requires updating `CORS_ALLOWED_ORIGINS` in settings.
