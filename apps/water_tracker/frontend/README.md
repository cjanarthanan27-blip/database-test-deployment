# Frontend - React Application

React frontend for the Water Purchase Tracker application, built with Vite and Tailwind CSS.

## 🏗️ Structure

```
frontend/
├── public/                # Static assets
├── src/
│   ├── components/       # React components
│   │   ├── Login.jsx    # Authentication page
│   │   ├── Dashboard.jsx # Dashboard view
│   │   └── Entries.jsx  # Entries list
│   ├── services/
│   │   └── api.js       # API client (Axios)
│   ├── App.jsx          # Root component & routing
│   ├── main.jsx         # Application entry point
│   └── index.css        # Tailwind CSS
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── postcss.config.js    # PostCSS configuration
```

## 🚀 Setup

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Development server: `http://localhost:5173`

## 📦 Dependencies

### Core
- `react` - UI library
- `react-dom` - React DOM renderer
- `react-router-dom` - Client-side routing
- `axios` - HTTP client

### Styling
- `tailwindcss` - Utility-first CSS framework
- `postcss` - CSS processing
- `autoprefixer` - Auto-prefix CSS

### Development
- `vite` - Build tool and dev server
- `@vitejs/plugin-react` - React plugin for Vite
- `eslint` - Code linting

## 🎨 Styling with Tailwind CSS

### Configuration

Tailwind is configured in `tailwind.config.js`:

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Usage

```jsx
// Example component with Tailwind classes
<div className="bg-white shadow-md rounded-lg p-6">
  <h1 className="text-2xl font-bold text-gray-900">Title</h1>
  <p className="text-gray-600 mt-2">Description</p>
</div>
```

## 🔌 API Integration

### API Service (`src/services/api.js`)

Centralized Axios instance for all API calls:

```javascript
import api from '../services/api';

// GET request
const response = await api.get('entries/');

// POST request
const response = await api.post('login', { username, password });

// PUT request
const response = await api.put('entries/1/', data);

// DELETE request
await api.delete('entries/1/');
```

### Authentication

API service automatically adds authentication header from localStorage:

```javascript
localStorage.setItem('auth', btoa(`${username}:${password}`));
localStorage.removeItem('auth');  // Logout
```

## 📄 Components

### Login (`src/components/Login.jsx`)

**Purpose**: User authentication

**Features**:
- Username/password form
- Error handling
- Redirect to dashboard on success

**Usage**:
```jsx
<Login setIsAuthenticated={setIsAuthenticated} />
```

### Dashboard (`src/components/Dashboard.jsx`)

**Purpose**: Main dashboard view

**Features**:
- Statistics cards (Total Cost, Volume, Avg Rate)
- Recent activity table
- Real-time data from API

**API Calls**:
- `GET /api/dashboard-stats`

### Entries (`src/components/Entries.jsx`)

**Purpose**: List water entries

**Features**:
- Entry list with cards
- Entry details display

**API Calls**:
- `GET /api/entries/`

### App (`src/App.jsx`)

**Purpose**: Root component with routing

**Features**:
- Navigation bar
- Route protection
- Authentication state management

**Routes**:
- `/login` - Login page
- `/` - Dashboard (protected)
- `/entries` - Entries list (protected)

## 🛣️ Routing

Using React Router DOM v7:

```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

<Router>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
  </Routes>
</Router>
```

### Protected Routes

```jsx
const PrivateRoute = ({ children }) => {
  return isAuthenticated ? children : <Navigate to="/login" />;
};
```

## 🔧 Development

### Running Dev Server

```bash
npm run dev
```

Features:
- Hot Module Replacement (HMR)
- Fast refresh for React components
- Automatic port selection

### Linting

```bash
npm run lint
```

### Building for Production

```bash
npm run build
```

Output: `dist/` folder with optimized assets

### Preview Production Build

```bash
npm run preview
```

## 🎨 UI Design Patterns

### Card Components

```jsx
<div className="bg-white overflow-hidden shadow rounded-lg">
  <div className="px-4 py-5 sm:p-6">
    <dt className="text-sm font-medium text-gray-500">Label</dt>
    <dd className="mt-1 text-3xl font-semibold text-gray-900">Value</dd>
  </div>
</div>
```

### Tables

```jsx
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        Header
      </th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        Data
      </td>
    </tr>
  </tbody>
</table>
```

### Forms

```jsx
<form onSubmit={handleSubmit} className="space-y-6">
  <div>
    <label className="block text-sm font-medium text-gray-700">
      Label
    </label>
    <input
      type="text"
      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  </div>
  <button
    type="submit"
    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
  >
    Submit
  </button>
</form>
```

## 🚀 Production Deployment

### Build Configuration

Update `vite.config.js` for production:

```javascript
export default {
  base: '/',  // URL base path
  build: {
    outDir: 'dist',
    sourcemap: false,  // Disable in production
  },
}
```

### Environment Variables

Create `.env.production`:

```env
VITE_API_URL=https://api.yourdomain.com
```

Access in code:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

### Deployment Steps

1. **Build**:
```bash
npm run build
```

2. **Static Hosting** (nginx example):
```nginx
server {
  listen 80;
  server_name yourdomain.com;
  root /var/www/frontend/dist;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

3. **API Proxy** (if needed):
```nginx
location /api {
  proxy_pass http://backend:8000;
}
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9   # macOS/Linux
netstat -ano | findstr :5173    # Windows
```

### Tailwind Styles Not Applying

1. Check `tailwind.config.js` content paths
2. Verify `postcss.config.js` exists
3. Restart dev server
4. Clear browser cache

### API Connection Issues

1. Check backend is running (`http://localhost:8000`)
2. Verify CORS configuration in Django
3. Check API URL in `src/services/api.js`
4. Check browser console for errors

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
```

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vite.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [React Router Documentation](https://reactrouter.com/)
- [Axios Documentation](https://axios-http.com/)

## 🔄 Future Enhancements

- [ ] Form validation library (React Hook Form)
- [ ] State management (Redux/Zustand)
- [ ] TypeScript migration
- [ ] Unit testing (Vitest)
- [ ] E2E testing (Playwright)
- [ ] Component library (shadcn/ui)
- [ ] Dark mode support
- [ ] Responsive mobile design
