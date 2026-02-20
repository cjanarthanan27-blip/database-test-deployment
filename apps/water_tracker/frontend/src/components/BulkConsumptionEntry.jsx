import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import Toast from './Toast';

const BulkConsumptionEntry = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [date, setDate] = useState(location.state?.initialDate || new Date().toISOString().split('T')[0]);
    const [consumptionType, setConsumptionType] = useState(location.state?.initialType || 'Normal');
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get(`consumption-entries/bulk_data/?date=${date}&consumption_type=${consumptionType}`);
            setRows(response.data.map(item => ({
                ...item,
                current_reading: item.current_reading || '',
                comments: item.comments || ''
            })));
        } catch (error) {
            console.error('Failed to fetch bulk data:', error);
            setToast({ message: 'Failed to fetch locations', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [date, consumptionType]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleReadingChange = (index, value) => {
        const newRows = [...rows];
        newRows[index].current_reading = value;
        setRows(newRows);
    };

    const handleCommentChange = (index, value) => {
        const newRows = [...rows];
        newRows[index].comments = value;
        setRows(newRows);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validEntries = rows.filter(r => r.current_reading && parseFloat(r.current_reading) > 0);

        if (validEntries.length === 0) {
            setToast({ message: 'Please enter at least one reading', type: 'error' });
            return;
        }

        setSubmitting(true);
        try {
            await api.post('consumption-entries/bulk_create/', {
                date,
                entries: validEntries.map(r => ({
                    location_id: r.location_id,
                    current_reading: parseFloat(r.current_reading),
                    comments: r.comments
                }))
            });
            setToast({ message: `Successfully saved ${validEntries.length} entries`, type: 'success' });
            setTimeout(() => navigate('/consumption-entries'), 1500);
        } catch (error) {
            console.error('Bulk save failed:', error);
            setToast({ message: 'Failed to save entries', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const calculateConsumption = (row) => {
        if (!row.current_reading || isNaN(row.current_reading)) return 0;
        const diff = parseFloat(row.current_reading) - row.previous_reading;
        return diff > 0 ? (diff * 1000).toLocaleString() : 0;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Consumption Entry</h1>
                <button
                    onClick={() => navigate('/consumption-entries')}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                    Back to List
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            Consumption Type
                        </label>
                        <select
                            value={consumptionType}
                            onChange={(e) => setConsumptionType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                        >
                            <option value="Normal">Normal Water Consumption</option>
                            <option value="Drinking">Drinking Water Consumption</option>
                        </select>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Prev Reading (KL)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Curr Reading (KL)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Consumption (L)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Comments</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-slate-400">Loading locations...</td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-slate-400">No locations found for this type</td>
                                </tr>
                            ) : rows.map((row, index) => (
                                <tr key={row.location_id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {row.location_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                        {row.category_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-900/20">
                                        {row.previous_reading}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={row.current_reading}
                                            onChange={(e) => handleReadingChange(index, e.target.value)}
                                            placeholder="0.00"
                                            className="w-32 px-2 py-1 border border-gray-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-white text-sm"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 font-semibold">
                                        {calculateConsumption(row)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="text"
                                            value={row.comments}
                                            onChange={(e) => handleCommentChange(index, e.target.value)}
                                            placeholder="Optional comments"
                                            className="w-full min-w-[200px] px-2 py-1 border border-gray-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-white text-sm"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900/50 flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => navigate('/consumption-entries')}
                        className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting || loading || rows.length === 0}
                        className={`px-4 py-2 rounded-md text-sm font-medium text-white shadow-sm ${submitting || loading || rows.length === 0
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                            }`}
                    >
                        {submitting ? 'Saving Entries...' : 'Save All Readings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BulkConsumptionEntry;
