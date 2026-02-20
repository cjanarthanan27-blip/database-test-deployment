import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import Toast from './Toast';
import { exportToExcel, formatDateRange, formatDate } from '../utils/excelExport';

const YieldEntries = () => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [count, setCount] = useState(0);
    const [limit, setLimit] = useState(10);
    const [offset, setOffset] = useState(0);
    const [toast, setToast] = useState(null);
    const [ordering, setOrdering] = useState('-date');
    const navigate = useNavigate();
    const location = useLocation();

    // Filter States
    const [filterLocation, setFilterLocation] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Parse query parameters on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const locId = params.get('location');
        if (locId) setFilterLocation(locId);
    }, [location]);

    // Dropdown Data
    const [locations, setLocations] = useState([]);

    const [selectedEntries, setSelectedEntries] = useState(new Set());

    // Fetch Dropdown Data
    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const response = await api.get('yield-locations/');
                setLocations(response.data.results || response.data);
            } catch (error) {
                console.error("Failed to fetch locations", error);
            }
        };
        fetchDropdowns();
    }, []);

    const fetchYieldEntries = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                limit,
                offset,
                location: filterLocation || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                ordering: ordering
            };
            const response = await api.get('yield-entries/', { params });
            const data = response.data.results || response.data;
            setEntries(data);
            setCount(response.data.count || data.length);
        } catch (err) {
            console.error("Failed to fetch yield entries", err);
            setToast({ message: 'Failed to load yield entries', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [limit, offset, filterLocation, startDate, endDate, ordering]);

    useEffect(() => {
        fetchYieldEntries();
    }, [fetchYieldEntries]);

    const handleSort = (field) => {
        if (ordering === field) {
            setOrdering(`-${field}`);
        } else {
            setOrdering(field);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = new Set(entries.map(entry => entry.id));
            setSelectedEntries(allIds);
        } else {
            setSelectedEntries(new Set());
        }
    };

    const handleSelectRow = (id) => {
        const newSelected = new Set(selectedEntries);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedEntries(newSelected);
    };

    const handleBulkDelete = async () => {
        if (selectedEntries.size === 0) return;

        if (window.confirm(`Are you sure you want to delete ${selectedEntries.size} yield entries?`)) {
            try {
                await Promise.all(Array.from(selectedEntries).map(id => api.delete(`yield-entries/${id}/`)));
                setSelectedEntries(new Set());
                setToast({ message: 'Entries deleted successfully', type: 'success' });
                fetchYieldEntries();
            } catch (err) {
                console.error("Failed to delete entries", err);
                setToast({ message: 'Failed to delete some entries', type: 'error' });
            }
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this yield entry?")) return;
        try {
            await api.delete(`yield-entries/${id}/`);
            setToast({ message: 'Entry deleted successfully', type: 'success' });
            fetchYieldEntries();
        } catch {
            setToast({ message: 'Failed to delete entry', type: 'error' });
        }
    };

    const handleEdit = (id) => {
        navigate(`/edit-yield-entry/${id}`);
    };

    const handleExportExcel = async () => {
        try {
            const params = {
                location: filterLocation || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                ordering: '-date'
            };

            const response = await api.get('yield-entries/export/', { params });
            const exportData = response.data.map(entry => ({
                'Date': formatDate(entry.date),
                'Location': entry.location_name,
                'Yield Type': entry.yield_type,
                'Previous Reading (KL)': entry.previous_reading,
                'Current Reading (KL)': entry.current_reading,
                'Yield (Liters)': entry.yield_liters,
                'Comments': entry.comments || '-',
                'Created By': entry.created_by_username || '-'
            }));

            const dateRange = (startDate && endDate) ? formatDateRange(startDate, endDate) : 'All Entries';

            exportToExcel(
                exportData,
                'Yield_Tracking_Report',
                'YieldEntries',
                'Water Yield Tracking Report',
                dateRange
            );
        } catch (err) {
            console.error("Failed to export yield entries", err);
            setToast({ message: 'Failed to export yield entries', type: 'error' });
        }
    };

    const handleLimitChange = (e) => {
        setLimit(parseInt(e.target.value));
        setOffset(0);
    };

    const startIdx = offset + 1;
    const endIdx = Math.min(offset + limit, count);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Yield Tracking Entries</h1>
                    <p className="text-gray-600 dark:text-slate-400 mt-1">Daily meter readings and calculated yield</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={handleExportExcel}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center transition shadow-sm"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export Excel
                    </button>
                    <button
                        onClick={() => navigate('/bulk-yield-entry')}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition shadow-sm flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Bulk Entry
                    </button>
                    <button
                        onClick={() => navigate('/add-entry')}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition shadow-sm"
                    >
                        + Add New Reading
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 border border-gray-100 dark:border-slate-700">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date Range</label>
                    <div className="flex space-x-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setOffset(0); }}
                            className="w-full text-sm border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setOffset(0); }}
                            className="w-full text-sm border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Location</label>
                    <select
                        value={filterLocation}
                        onChange={(e) => { setFilterLocation(e.target.value); setOffset(0); }}
                        className="w-full text-sm border-gray-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                    >
                        <option value="">All Locations</option>
                        {locations.map(l => (
                            <option key={l.id} value={l.id}>{l.location_name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-end">
                    <button
                        onClick={() => {
                            setFilterLocation('');
                            setStartDate('');
                            setEndDate('');
                            setOffset(0);
                        }}
                        className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 text-sm w-full transition"
                    >
                        Reset Filters
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                                    onClick={() => handleSort('date')}
                                >
                                    Date {ordering === 'date' ? '↑' : ordering === '-date' ? '↓' : ''}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right">KL Readings</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right">Yield (L)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Comments</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    Actions
                                    {selectedEntries.size > 0 && (
                                        <button
                                            onClick={handleBulkDelete}
                                            className="text-red-600 hover:text-red-900 bg-red-50 dark:bg-red-900/20 p-1 rounded transition"
                                            title="Delete Selected"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={entries.length > 0 && selectedEntries.size === entries.length}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                            {loading && entries.length === 0 ? (
                                <tr><td colSpan="7" className="px-6 py-10 text-center text-gray-500 dark:text-slate-400">Loading...</td></tr>
                            ) : entries.length === 0 ? (
                                <tr><td colSpan="7" className="px-6 py-10 text-center text-gray-500 dark:text-slate-400">No yield entries found.</td></tr>
                            ) : (
                                entries.map(entry => (
                                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-200">
                                            <button
                                                onClick={() => navigate('/bulk-yield-entry', { state: { initialDate: entry.date } })}
                                                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                                title="Edit all yield readings for this date"
                                            >
                                                {formatDate(entry.date)}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-200">
                                            <div className="font-medium">{entry.location_name}</div>
                                            <div className="text-xs text-gray-500 dark:text-slate-400">{entry.yield_type}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 text-right">
                                            <div className="text-xs">Prev: {entry.previous_reading.toLocaleString()}</div>
                                            <div className="font-medium text-gray-900 dark:text-slate-200">Curr: {entry.current_reading.toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-1 rounded font-bold">
                                                    {entry.yield_liters.toLocaleString()} L
                                                </span>
                                                {entry.is_manual_yield && (
                                                    <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/50">
                                                        Manual
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400 max-w-xs truncate" title={entry.comments}>
                                            {entry.comments || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(entry.id)}
                                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedEntries.has(entry.id)}
                                                onChange={() => handleSelectRow(entry.id)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-700 dark:text-slate-400">
                        Showing <span className="font-medium">{count === 0 ? 0 : startIdx}</span> to <span className="font-medium">{endIdx}</span> of <span className="font-medium">{count}</span> entries
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <label htmlFor="limit" className="text-sm text-gray-700 dark:text-slate-300 mr-2">Rows per page:</label>
                        <select
                            id="limit"
                            value={limit}
                            onChange={handleLimitChange}
                            className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setOffset(Math.max(0, offset - limit))}
                            disabled={offset === 0}
                            className="px-4 py-2 border rounded-md disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setOffset(offset + limit)}
                            disabled={offset + limit >= count}
                            className="px-4 py-2 border rounded-md disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div >
    );
};

export default YieldEntries;
