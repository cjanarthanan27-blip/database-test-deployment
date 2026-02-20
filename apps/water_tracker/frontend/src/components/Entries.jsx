import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useNavigate and useLocation
import api from '../services/api';
import { exportToExcel, formatDateRange, formatDate } from '../utils/excelExport';

const Entries = () => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [count, setCount] = useState(0);
    const [limit, setLimit] = useState(10);
    const [offset, setOffset] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    // Filter States
    const [filterVehicle, setFilterVehicle] = useState('');
    const [filterLoadingLocation, setFilterLoadingLocation] = useState('');
    const [filterUnloadingLocation, setFilterUnloadingLocation] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterWaterType, setFilterWaterType] = useState('');
    const [ordering, setOrdering] = useState('-entry_date');

    // Parse query parameters on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const unloadingLoc = params.get('unloading_location');
        const waterType = params.get('water_type');

        if (unloadingLoc) setFilterUnloadingLocation(unloadingLoc);
        if (waterType) setFilterWaterType(waterType);
    }, [location]);

    // Dropdown Data
    const [vehicles, setVehicles] = useState([]);
    const [locations, setLocations] = useState([]);

    // Fetch Dropdown Data
    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const response = await api.get('dropdown-data');
                setVehicles(response.data.vehicles || []);
                setLocations(response.data.locations || []);
            } catch (error) {
                console.error("Failed to fetch dropdown data", error);
            }
        };
        fetchDropdowns();
    }, []);

    const fetchEntries = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                limit,
                offset,
                vehicle: filterVehicle || undefined,
                loading_location: filterLoadingLocation || undefined,
                unloading_location: filterUnloadingLocation || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                water_type: filterWaterType || undefined,
                ordering
            };

            const response = await api.get('entries/', { params });

            if (response.data.results) {
                setEntries(response.data.results);
                setCount(response.data.count);
            } else {
                setEntries(response.data);
                setCount(response.data.length);
            }
        } catch (err) {
            console.error("Failed to fetch entries", err);
        } finally {
            setLoading(false);
        }
    }, [limit, offset, filterVehicle, filterLoadingLocation, filterUnloadingLocation, startDate, endDate, filterWaterType, ordering]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    const handleLimitChange = (e) => {
        setLimit(parseInt(e.target.value));
        setOffset(0);
    };

    const handlePageChange = (newOffset) => {
        setOffset(newOffset);
    };

    const handleSort = (field) => {
        if (ordering === field) {
            setOrdering(`-${field}`);
        } else {
            setOrdering(field);
        }
    };

    const [selectedEntries, setSelectedEntries] = useState(new Set());

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

        if (window.confirm(`Are you sure you want to delete ${selectedEntries.size} entries?`)) {
            try {
                // Delete sequentially to avoid overwhelmed server or use a bulk endpoint if available
                // For now, we'll loop through
                await Promise.all(Array.from(selectedEntries).map(id => api.delete(`entries/${id}/`)));

                setSelectedEntries(new Set());
                fetchEntries();
            } catch (err) {
                console.error("Failed to delete entries", err);
                alert("Failed to delete some entries");
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this entry?")) {
            try {
                await api.delete(`entries/${id}/`);
                fetchEntries();
            } catch (err) {
                console.error("Failed to delete entry", err);
                alert("Failed to delete entry");
            }
        }
    };

    const handleEdit = (id) => {
        navigate(`/edit-entry/${id}`);
    };

    const handleExportExcel = async () => {
        try {
            const params = {
                vehicle: filterVehicle || undefined,
                loading_location: filterLoadingLocation || undefined,
                unloading_location: filterUnloadingLocation || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                water_type: filterWaterType || undefined,
                ordering
            };

            const response = await api.get('entries/export/', { params });
            const exportData = response.data.map(entry => ({
                'Date': formatDate(entry.entry_date),
                'Shift': entry.shift,
                'Source/Vehicle': entry.source_name || entry.vehicle_name,
                'Water Type': entry.water_type,
                'Loading Location': entry.loading_location_name || '-',
                'Unloading Location': entry.unloading_location_name || '-',
                'Quantity (L)': parseFloat(entry.total_quantity_liters),
                'Cost (₹)': parseFloat(entry.total_cost),
                'Comments': entry.comments || '-'
            }));

            const dateRange = (startDate && endDate) ? formatDateRange(startDate, endDate) : 'All Entries';

            exportToExcel(
                exportData,
                'Water_Entries',
                'Purchase Tracking',
                'Water Purchase Entries Report',
                dateRange
            );
        } catch (err) {
            console.error("Failed to export entries", err);
            alert("Failed to export entries");
        }
    };

    const startIdx = offset + 1;
    const endIdx = Math.min(offset + limit, count);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Purchase Tracking</h1>
                <div className="flex space-x-3">
                    <button
                        onClick={handleExportExcel}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export Excel
                    </button>
                    <button
                        onClick={() => navigate('/add-entry')}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Add New Entry
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date Range</label>
                    <div className="flex space-x-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setOffset(0); }}
                            className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Start"
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setOffset(0); }}
                            className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="End"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Vehicle</label>
                    <select
                        value={filterVehicle}
                        onChange={(e) => { setFilterVehicle(e.target.value); setOffset(0); }}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Vehicles</option>
                        {vehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.vehicle_name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Loading Location</label>
                    <select
                        value={filterLoadingLocation}
                        onChange={(e) => { setFilterLoadingLocation(e.target.value); setOffset(0); }}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Loading Locations</option>
                        {locations.map(l => (
                            <option key={l.id} value={l.id}>{l.location_name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Unloading Location</label>
                    <select
                        value={filterUnloadingLocation}
                        onChange={(e) => { setFilterUnloadingLocation(e.target.value); setOffset(0); }}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Unloading Locations</option>
                        {locations.map(l => (
                            <option key={l.id} value={l.id}>{l.location_name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Water Type</label>
                    <select
                        value={filterWaterType}
                        onChange={(e) => { setFilterWaterType(e.target.value); setOffset(0); }}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Types</option>
                        <option value="Drinking Water">Drinking Water</option>
                        <option value="Normal Water (Salt)">Normal Water (Salt)</option>
                        <option value="Corporation">Corporation (Pipeline)</option>
                    </select>
                </div>

                <div className="flex items-end">
                    <button
                        onClick={() => {
                            setFilterVehicle('');
                            setFilterLoadingLocation('');
                            setFilterUnloadingLocation('');
                            setStartDate('');
                            setEndDate('');
                            setFilterWaterType('');
                            setOrdering('-entry_date');
                            setOffset(0);
                        }}
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 text-sm"

                    >
                        Reset Filters
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-800/50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"

                                    onClick={() => handleSort('entry_date')}
                                >
                                    Date {ordering === 'entry_date' ? '↑' : ordering === '-entry_date' ? '↓' : ''}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Source / Vehicle</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Water Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Quantity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">

                                    Actions
                                    {selectedEntries.size > 0 && (
                                        <button
                                            onClick={handleBulkDelete}
                                            className="text-red-600 hover:text-red-900"
                                            title="Delete Selected"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Comments</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={entries.length > 0 && selectedEntries.size === entries.length}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">

                            {loading && entries.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                                </tr>
                            ) : entries.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">No entries found</td>
                                </tr>
                            ) : (
                                entries.map((entry) => (
                                    <tr key={entry.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-200">
                                            <button
                                                onClick={() => navigate(`/edit-entry/${entry.id}`)}
                                                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                                title="Edit this entry"
                                            >
                                                {formatDate(entry.entry_date)}
                                            </button>
                                            <div className="text-xs text-gray-500 dark:text-slate-400">{entry.shift}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-200">
                                            {entry.source_name ? (
                                                <span className="font-medium">{entry.source_name}</span>
                                            ) : (
                                                <div>
                                                    <span className="font-medium">{entry.vehicle_name}</span>
                                                    <div className="text-xs text-gray-500 dark:text-slate-400">{entry.load_count} Load(s)</div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-200">
                                            {entry.source_name && entry.source_type === 'Pipeline' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                                                    Corporation
                                                </span>
                                            ) : (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${entry.water_type === 'Drinking Water'
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                                    : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                                    }`}>
                                                    {entry.water_type}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                            {entry.loading_location_name && <div>L: {entry.loading_location_name}</div>}
                                            {entry.unloading_location_name && <div>U: {entry.unloading_location_name}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-200">
                                            <div>{parseFloat(entry.total_quantity_liters).toLocaleString()} L</div>
                                            {entry.manual_capacity_liters && (
                                                <div className="text-[10px] text-blue-500 font-medium text-blue-600 dark:text-blue-400 uppercase tracking-tighter">Manual Override</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                                            ₹{parseFloat(entry.total_cost).toFixed(2)}
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
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400 max-w-xs truncate" title={entry.comments}>
                                            {entry.comments || '-'}
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

                {/* Pagination Controls */}
                <div className="bg-white dark:bg-slate-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-slate-700 sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700 dark:text-slate-300">
                                Showing <span className="font-medium">{count === 0 ? 0 : startIdx}</span> to <span className="font-medium">{endIdx}</span> of <span className="font-medium">{count}</span> results
                            </p>
                        </div>


                        <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                                <label htmlFor="limit" className="text-sm text-gray-700 dark:text-slate-300 mr-2">Rows per page:</label>

                                <select
                                    id="limit"
                                    value={limit}
                                    onChange={handleLimitChange}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>

                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => handlePageChange(Math.max(0, offset - limit))}
                                    disabled={offset === 0}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium ${offset === 0 ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed' : 'text-gray-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(offset + limit)}
                                    disabled={offset + limit >= count}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium ${offset + limit >= count ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed' : 'text-gray-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default Entries;
