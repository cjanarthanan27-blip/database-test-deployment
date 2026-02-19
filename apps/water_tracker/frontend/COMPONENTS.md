# Component Documentation

React components for the Water Purchase Tracker frontend.

## Component Hierarchy

```
App
├── Router
│   ├── Login (public route)
│   └── PrivateRoute (authenticated routes)
│       ├── Dashboard
│       └── Entries
```

---

## App Component

**File**: `src/App.jsx`

**Purpose**: Root component managing routing and authentication state.

### State

```javascript
const [isAuthenticated, setIsAuthenticated] = useState(
  !!localStorage.getItem('auth')
);
```

### Features

- Client-side routing with React Router
- Navigation bar (when authenticated)
- Route protection via `PrivateRoute` wrapper
- Logout functionality

### Routes

| Path       | Component | Protection |
| ---------- | --------- | ---------- |
| `/login`   | Login     | Public     |
| `/`        | Dashboard | Private    |
| `/entries` | Entries   | Private    |

### Navigation

```jsx
<nav className="bg-blue-600 text-white">
  <Link to="/">Dashboard</Link>
  <Link to="/entries">Entries</Link>
  <button onClick={handleLogout}>Logout</button>
</nav>
```

---

## Login Component

**File**: `src/components/Login.jsx`

**Purpose**: User authentication page.

### Props

| Prop               | Type     | Required | Description               |
| ------------------ | -------- | -------- | ------------------------- |
| setIsAuthenticated | Function | Yes      | Updates auth state in App |

### State

```javascript
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
```

### Features

- Username/password input form
- Form validation
- Error display
- localStorage auth token storage
- Automatic redirect on success

### API Integration

```javascript
const response = await api.post('login', { username, password });
const authString = btoa(`${username}:${password}`);
localStorage.setItem('auth', authString);
localStorage.setItem('user', JSON.stringify(response.data.user));
```

### Usage

```jsx
<Login setIsAuthenticated={setIsAuthenticated} />
```

### Styling

- Centered layout
- Card-style form container
- Tailwind CSS classes
- Responsive design

---

## Dashboard Component

**File**: `src/components/Dashboard.jsx`

**Purpose**: Main dashboard displaying statistics and recent activity.

### State

```javascript
const [stats, setStats] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

### Features

1. **Statistics Cards**
   - Total Cost (This Month)
   - Total Volume (This Month)
   - Average Rate

2. **Recent Activity Table**
   - Last 5 water entries
   - Date, Source, Vehicle, Volume, Cost

### API Integration

```javascript
useEffect(() => {
  const fetchStats = async () => {
    const response = await api.get('dashboard-stats');
    setStats(response.data);
  };
  fetchStats();
}, []);
```

### Data Structure

```javascript
{
  total_cost: 150000.00,
  total_volume_kl: 300.50,
  avg_rate: 499.17,
  recent_activity: [
    {
      date: "2024-02-09",
      source: "Vendor A",
      vehicle: "Truck 001",
      volume: "5.0 KL",
      cost: 2500.00
    }
  ]
}
```

### Styling

- Grid layout for stat cards
- Table layout for recent activity
- Shadow and rounded corners
- Responsive breakpoints

### Usage

```jsx
<Dashboard />
```

---

## Entries Component

**File**: `src/components/Entries.jsx`

**Purpose**: Display list of all water entries.

### State

```javascript
const [entries, setEntries] = useState([]);
const [loading, setLoading] = useState(true);
```

### Features

- List view of water entries
- Entry cards with key details
- Color-coded cost badges

### API Integration

```javascript
useEffect(() => {
  const fetchEntries = async () => {
    const response = await api.get('entries/');
    setEntries(response.data);
  };
  fetchEntries();
}, []);
```

### Data Structure

```javascript
{
  id: 1,
  entry_date: "2024-02-09",
  source_name: "Vendor A",
  vehicle_name: "Truck 001",
  total_quantity_liters: 5000,
  total_cost: 2500.00
}
```

### Styling

- List with dividers
- Card-style entries
- Badge for cost
- Hover effects

### Usage

```jsx
<Entries />
```

---

## PrivateRoute Component

**Purpose**: Route protection wrapper for authenticated routes.

### Implementation

```jsx
const PrivateRoute = ({ children }) => {
  return isAuthenticated ? children : <Navigate to="/login" />;
};
```

### Usage

```jsx
<Route path="/" element={
  <PrivateRoute>
    <Dashboard />
  </PrivateRoute>
} />
```

---

## API Service

**File**: `src/services/api.js`

**Purpose**: Centralized HTTP client for backend communication.

### Configuration

```javascript
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
  headers: { 'Content-Type': 'application/json' }
});
```

### Interceptors

**Request Interceptor**: Adds authentication header

```javascript
api.interceptors.request.use((config) => {
  const auth = localStorage.getItem('auth');
  if (auth) {
    config.headers['Authorization'] = `Basic ${auth}`;
  }
  return config;
});
```

### Methods

```javascript
// GET
await api.get('entries/');

// POST
await api.post('login', { username, password });

// PUT
await api.put('entries/1/', data);

// DELETE
await api.delete('entries/1/');
```

---

## Common Patterns

### Loading State

```jsx
if (loading) {
  return <div className="text-center mt-10">Loading...</div>;
}
```

### Error State

```jsx
if (error) {
  return <div className="text-center mt-10 text-red-500">{error}</div>;
}
```

### Data Fetching

```jsx
useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await api.get('endpoint/');
      setData(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load data');
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

### Form Handling

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await api.post('endpoint/', formData);
    // Handle success
  } catch (err) {
    setError(err.response?.data?.error || 'An error occurred');
  }
};
```

---

## Future Components

### Planned Components

1. **AddEntry**
   - Form for creating new water entries
   - Dropdown population from master data
   - Cost calculation preview

2. **ManageRates**
   - CRUD for rate history
   - Date-based rate management

3. **ManageLocations**
   - CRUD for locations
   - Active/inactive toggle

4. **ManageSources**
   - CRUD for water sources
   - Vendor/pipeline type selection

5. **ManageVehicles**
   - CRUD for internal vehicles
   - Capacity management

6. **Reports**
   - Monthly summary reports
   - Cost analysis charts
   - Export functionality

### Reusable Components

1. **Form Components**
   - Input field
   - Select dropdown
   - Date picker
   - Submit button

2. **Layout Components**
   - Card
   - Table
   - Modal
   - Alert/Toast

3. **Data Display**
   - Stat card
   - Chart wrapper
   - Empty state
   - Pagination

---

## Best Practices

1. **Component Organization**
   - One component per file
   - Clear naming conventions
   - props validation with PropTypes (future)

2. **State Management**
   - Local state for UI-only data
   - API calls in useEffect
   - Error boundaries (future)

3. **Performance**
   - Memo for expensive computations
   - Lazy loading for routes
   - Debounce for search inputs

4. **Accessibility**
   - Semantic HTML
   - ARIA labels
   - Keyboard navigation
   - Focus management

5. **Code Style**
   - Consistent formatting
   - ESLint compliance
   - Meaningful variable names
   - Comments for complex logic
