import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import logo from './assets/logo.png';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Entries from './components/Entries';
import AddEntry from './components/AddEntry';
import Locations from './components/Locations';
import Sources from './components/Sources';
import Vehicles from './components/Vehicles';
import Rates from './components/Rates';
import Reports from './components/Reports';
import SiteDetail from './components/SiteDetail';
import VendorDetail from './components/VendorDetail';
import YieldEntries from './components/YieldEntries';
import ConsumptionEntries from './components/ConsumptionEntries';
import BulkConsumptionEntry from './components/BulkConsumptionEntry';
import BulkYieldEntry from './components/BulkYieldEntry';

// Private Route Component
const PrivateRoute = ({ children, isAuthenticated }) => {
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('auth')
  );
  const [trackEntriesOpen, setTrackEntriesOpen] = useState(false);
  const [masterDataOpen, setMasterDataOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
    // Expose for debugging if needed
    window.__THEME__ = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {isAuthenticated && (
          <nav className="bg-blue-600 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-8">
                  <Link to="/" className="flex items-center space-x-3 group">
                    <img
                      src={logo}
                      alt="Logo"
                      className="h-10 w-auto bg-white rounded-lg p-1 group-hover:scale-105 transition-transform shadow-sm"
                    />
                    <span className="text-xl font-bold tracking-tight">Water Tracker</span>
                  </Link>

                  <div className="flex space-x-4">
                    <Link
                      to="/"
                      className="px-3 py-2 rounded-md hover:bg-blue-700 transition"
                    >
                      Dashboard
                    </Link>

                    {/* Track Entries Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setTrackEntriesOpen(!trackEntriesOpen)}
                        className="px-3 py-2 rounded-md hover:bg-blue-700 transition flex items-center"
                      >
                        Track Entries
                        <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {trackEntriesOpen && (
                        <div className="dropdown-menu absolute left-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-md shadow-lg z-10 border border-gray-100 dark:border-slate-700">
                          <Link
                            to="/entries"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => setTrackEntriesOpen(false)}
                          >
                            Purchase Tracking
                          </Link>
                          <Link
                            to="/yield-entries"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => setTrackEntriesOpen(false)}
                          >
                            Yield Tracking
                          </Link>
                          <Link
                            to="/consumption-entries"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => setTrackEntriesOpen(false)}
                          >
                            Consumption Tracking
                          </Link>
                        </div>
                      )}
                    </div>

                    <Link
                      to="/add-entry"
                      className="px-3 py-2 rounded-md hover:bg-blue-700 transition"
                    >
                      Add Entry
                    </Link>

                    {/* Master Data Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setMasterDataOpen(!masterDataOpen)}
                        className="px-3 py-2 rounded-md hover:bg-blue-700 transition flex items-center"
                      >
                        Master Data
                        <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {masterDataOpen && (
                        <div className="dropdown-menu absolute left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg z-10 border border-gray-100 dark:border-slate-700">

                          <Link
                            to="/locations"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => setMasterDataOpen(false)}
                          >
                            Locations
                          </Link>
                          <Link
                            to="/sources"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => setMasterDataOpen(false)}
                          >
                            Sources
                          </Link>
                          <Link
                            to="/vehicles"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => setMasterDataOpen(false)}
                          >
                            Vehicles
                          </Link>
                          <Link
                            to="/rates"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => setMasterDataOpen(false)}
                          >
                            Rates
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Reports Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setReportsOpen(!reportsOpen)}
                        className="px-3 py-2 rounded-md hover:bg-blue-700 transition flex items-center"
                      >
                        Reports
                        <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {reportsOpen && (
                        <div className="dropdown-menu absolute left-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-md shadow-lg z-10 border border-gray-100 dark:border-slate-700">

                          <Link
                            to="/reports?tab=daily"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => setReportsOpen(false)}
                          >
                            Daily Water Purchase
                          </Link>
                          <Link
                            to="/reports?tab=daily-yield"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => setReportsOpen(false)}
                          >
                            Daily Yield Report
                          </Link>
                          <Link
                            to="/reports?tab=daily-normal-consumption"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => setReportsOpen(false)}
                          >
                            Daily Normal Consumption
                          </Link>
                          <Link
                            to="/reports?tab=monthly"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => setReportsOpen(false)}
                          >
                            Monthly Water Purchase
                          </Link>
                          <Link
                            to="/reports?tab=yearly"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => setReportsOpen(false)}
                          >
                            Yearly Water Purchase
                          </Link>
                          <Link
                            to="/reports?tab=watertype"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => setReportsOpen(false)}
                          >
                            Water Type Purchase
                          </Link>
                          <Link
                            to="/reports?tab=vendor"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => setReportsOpen(false)}
                          >
                            Vendor Usage
                          </Link>
                          <Link
                            to="/reports?tab=vehicle"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => setReportsOpen(false)}
                          >
                            Vehicle Utilization
                          </Link>
                          <Link
                            to="/reports?tab=comparison"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => setReportsOpen(false)}
                          >
                            Cost Comparison
                          </Link>
                          <Link
                            to="/reports?tab=site"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => setReportsOpen(false)}
                          >
                            Site Wise Purchase
                          </Link>
                          <Link
                            to="/reports?tab=capacity"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => setReportsOpen(false)}
                          >
                            Capacity Utilization
                          </Link>
                          <Link
                            to="/reports?tab=rates"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => setReportsOpen(false)}
                          >
                            Rate Details
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-blue-700/50 hover:bg-blue-700 transition-all transform hover:scale-105"
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                  >
                    {theme === 'light' ? (
                      <svg className="h-5 w-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-200" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 rounded-md hover:bg-red-600 transition shadow-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </nav>
        )}

        <Routes>
          <Route
            path="/login"
            element={<Login setIsAuthenticated={setIsAuthenticated} />}
          />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route
            path="/"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/entries"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <Entries />
              </PrivateRoute>
            }
          />
          <Route
            path="/yield-entries"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <YieldEntries />
              </PrivateRoute>
            }
          />
          <Route
            path="/consumption-entries"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <ConsumptionEntries />
              </PrivateRoute>
            }
          />
          <Route
            path="/add-entry"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <AddEntry />
              </PrivateRoute>
            }
          />
          <Route
            path="/edit-entry/:id"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <AddEntry />
              </PrivateRoute>
            }
          />
          <Route
            path="/edit-yield-entry/:id"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <AddEntry />
              </PrivateRoute>
            }
          />
          <Route
            path="/add-consumption-entry"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <AddEntry />
              </PrivateRoute>
            }
          />
          <Route
            path="/edit-consumption-entry/:id"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <AddEntry />
              </PrivateRoute>
            }
          />
          <Route
            path="/locations"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <Locations />
              </PrivateRoute>
            }
          />
          <Route
            path="/sources"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <Sources />
              </PrivateRoute>
            }
          />
          <Route
            path="/vehicles"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <Vehicles />
              </PrivateRoute>
            }
          />
          <Route
            path="/rates"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <Rates />
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <Reports />
              </PrivateRoute>
            }
          />
          <Route
            path="/site-detail/:locationId"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <SiteDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/vendor-detail/:vendorId"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <VendorDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/bulk-yield-entry"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <BulkYieldEntry />
              </PrivateRoute>
            }
          />
          <Route
            path="/bulk-consumption-entry"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <BulkConsumptionEntry />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
