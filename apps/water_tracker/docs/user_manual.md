# Water Purchase Tracker - User & Developer Manual

This manual provides a comprehensive guide to the Water Purchase Tracker project, detailing the file structure, component responsibilities, data flows, and instructions for maintenance and programming corrections.

## 1. Project Overview

The **Water Purchase Tracker** is a full-stack web application designed to track water purchases, costs, and consumption.

-   **Backend**: Django 6.0 (Python) with Django REST Framework.
-   **Frontend**: React 19 (JavaScript) with Tailwind CSS.
-   **Database**: PostgreSQL (Production) / SQLite (Development).

---

## 2. Directory Structure & File Responsibilities

### Root Directory (`d:\DatabaseTest`)

| File/Folder              | Description                                           |
| :----------------------- | :---------------------------------------------------- |
| `backend/`               | Contains the Django backend code.                     |
| `frontend/`              | Contains the React frontend code.                     |
| `legacy/`                | Archived Flask application (do not use).              |
| `start.bat` / `stop.bat` | Windows batch scripts to start/stop the application.  |
| `requirements.txt`       | Python dependencies for the backend.                  |
| `README.md`              | General project overview and setup instructions.      |
| `ARCHITECTURE.md`        | High-level architectural decisions and stack details. |

### Backend Structure (`backend/`)

The backend is built with Django. The core logic resides in the `core` app.

| File/Folder                         | Description                                                                  |
| :---------------------------------- | :--------------------------------------------------------------------------- |
| `manage.py`                         | Django's command-line utility for administrative tasks (runserver, migrate). |
| `water_tracker_project/`            | Project-level configuration.                                                 |
| `water_tracker_project/settings.py` | Global settings (DB, Apps, Middleware, CORS).                                |
| `water_tracker_project/urls.py`     | Main URL routing entry point.                                                |
| `core/`                             | The main application containing business logic.                              |

#### Core App (`backend/core/`)

| File               | Type                | Description & Purpose                                                                                                |
| :----------------- | :------------------ | :------------------------------------------------------------------------------------------------------------------- |
| `models.py`        | **Database Schema** | Defines data structures (User, MasterLocation, WaterEntry, etc.). **Modify this** to change database tables/columns. |
| `views.py`         | **API Logic**       | Handles HTTP requests, business logic, and CRUD operations. **Modify this** to change how API endpoints behave.      |
| `reports_views.py` | **Reporting Logic** | Specialized views for complex reports (e.g., aggregations, summaries).                                               |
| `serializers.py`   | **Data Conversion** | Converts complex types (Models) to native Python datatypes (JSON) and validates input.                               |
| `urls.py`          | **Routing**         | Maps URL endpoints (e.g., `api/entries/`) to specific views.                                                         |
| `admin.py`         | **Admin Interface** | Configuration for the built-in Django Admin UI.                                                                      |
| `migrations/`      | **DB Changes**      | Auto-generated files that propagate model changes to the database schema.                                            |

### Frontend Structure (`frontend/`)

The frontend is a Single Page Application (SPA) built with React and Vite.

| File/Folder      | Description                                             |
| :--------------- | :------------------------------------------------------ |
| `package.json`   | JavaScript dependencies and scripts (dev, build, lint). |
| `vite.config.js` | Configuration for the Vite build tool.                  |
| `src/`           | Source code directory.                                  |
| `public/`        | Static assets (images, favicon).                        |

#### Source Code (`frontend/src/`)

| File/Folder       | Description & Purpose                                                                                                                               |
| :---------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main.jsx`        | Entry point. Renders the root `App` component into the DOM.                                                                                         |
| `App.jsx`         | **Root Component**. Sets up Routing (`react-router-dom`) and global layout.                                                                         |
| `services/api.js` | **API Layer**. Centralized Axios instance for making HTTP requests to the backend. **Modify this** to change how the frontend talks to the backend. |
| `components/`     | Contains all UI components.                                                                                                                         |

#### Components (`frontend/src/components/`)

| Component File  | Role | Description                                                                 |
| :-------------- | :--- | :-------------------------------------------------------------------------- |
| `Login.jsx`     | Page | Authentication screen. Handles user login and token storage.                |
| `Dashboard.jsx` | Page | Main landing page. Shows stats and recent activity charts.                  |
| `Entries.jsx`   | Page | List view of all water entries.                                             |
| `AddEntry.jsx`  | Form | Form to add new water purchase records. Handles dropdowns and calculations. |
| `Locations.jsx` | CRUD | Manage Master Locations (Loading/Unloading sites).                          |
| `Sources.jsx`   | CRUD | Manage Master Sources (Vendors/Pipelines).                                  |
| `Vehicles.jsx`  | CRUD | Manage Internal/Vendor Vehicles.                                            |
| `*Rates.jsx`    | CRUD | Manage pricing rates (InternalVehicleRates, VendorRates, PipelineRates).    |
| `Reports.jsx`   | Page | UI for viewing aggregated reports and cost analysis.                        |

---

## 3. System Flows

### 3.1 Authentication Flow

1.  **User** enters credentials in `Login.jsx`.
2.  **Frontend** sends `POST /api/login` via `api.js`.
3.  **Backend** (`views.py`) verifies credentials using Django Auth.
4.  **Success**: Backend returns User object. Frontend stores `auth` (Basic Auth string) in `localStorage`.
5.  **Redirect**: User is redirected to `Dashboard.jsx`.

### 3.2 Data Entry Flow (Adding a Water Load)

1.  **User** navigates to "Add Entry".
2.  **Frontend** (`AddEntry.jsx`) fetches dropdown data (Locs, Sources, Vehicles) from `GET /api/dropdown-data`.
3.  **User** fills form. Frontend calls `POST /api/calculate-cost` to preview cost.
4.  **User** submits. Frontend sends `POST /api/entries/` with JSON data.
5.  **Backend** (`serializers.py`) validates data (e.g., checks dates, types).
6.  **Backend** (`views.py`) saves `WaterEntry` to Database (`models.py`).
7.  **Response**: 201 Created. Frontend shows success toast and redirects.

### 3.3 Dashboard Loading Flow

1.  **User** lands on Dashboard.
2.  **Frontend** (`Dashboard.jsx`) calls `GET /api/dashboard-stats`.
3.  **Backend** (`views.py`) queries `WaterEntry` model for aggregates (Sum of cost, Volume).
4.  **Backend** returns JSON stats.
5.  **Frontend** renders charts and tables with the data.

---

## 4. Maintenance & Programming Guide

### How to Fix or Correct Programming

#### Scenario A: Modifying a Database Field
*Example: Adding a "Driver Name" to Water Entry.*

1.  **Backend**: Open `backend/core/models.py`.
2.  Add field to `WaterEntry` class: `driver_name = models.CharField(max_length=100, null=True, blank=True)`.
3.  Run migrations:
    ```bash
    cd backend
    python manage.py makemigrations
    python manage.py migrate
    ```
4.  **Backend**: Update `backend/core/serializers.py` to include `'driver_name'` in `WaterEntrySerializer` fields.
5.  **Frontend**: Update `frontend/src/components/AddEntry.jsx` to add an input field for Driver Name.
6.  **Frontend**: Update `frontend/src/components/Entries.jsx` to display the new column.

#### Scenario B: Fixing a Calculation Bug
*Example: Cost calculation is wrong for Vendor type.*

1.  **Identify Logic**: logic is likely in `backend/core/views.py` (for `calculate_cost` endpoint) or `backend/core/models.py` (if it's a model method).
2.  **Locate Code**: Look for `CalculateCostView` in `views.py`.
3.  **Debug**: Check the math in the `post` method.
    ```python
    # Example logic in views.py
    if source_type == 'vendor':
        # Check if rate is multiplied correctly
        total_cost = rate * quantity # Ensure units match (Liters vs KL)
    ```
4.  **Apply Fix**: Correct the formula.
5.  **Verify**: Restart backend (`start.bat` or `python manage.py runserver`) and test via "Add Entry" form.

#### Scenario C: Changing UI Styling
*Example: Making the "Submit" button green instead of blue.*

1.  **Frontend**: Identify the component (e.g., `frontend/src/components/AddEntry.jsx`).
2.  **Locate Element**: Find the `<button>`.
3.  **Update Tailwind Class**: Change `bg-blue-600` to `bg-green-600`.
    ```jsx
    <button className="bg-green-600 hover:bg-green-700 text-white ...">
      Submit
    </button>
    ```
4.  **Verify**: Changes reflect immediately if `npm run dev` is running (HMR).

### Troubleshooting Common Issues

*   **Backend won't start**: Check `requirements.txt` is installed and Venv is active. Check database connection in `.env`.
*   **Frontend API Errors**: Check Network tab in Browser DevTools. 401 = Auth issue (re-login). 500 = Backend crash (check backend console logs).
*   **CORS Errors**: Ensure `CORS_ALLOWED_ORIGINS` in `settings.py` includes your frontend URL (e.g., `http://localhost:5173`).

---

## 5. Deployment & Execution

*   **Start Local Dev**: Run `start.bat` in root. This likely launches both servers.
*   **Manual Start**:
    *   Backend: `cd backend && python manage.py runserver`
    *   Frontend: `cd frontend && npm run dev`
*   **Access**:
    *   Frontend: http://localhost:5173
    *   Backend API: http://localhost:8000/api/
