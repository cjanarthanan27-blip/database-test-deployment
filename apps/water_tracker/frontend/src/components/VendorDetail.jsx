import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Toast from './Toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportReportToPDF, formatDateRange } from '../utils/pdfExport';
import { exportToExcel, formatDateRange as formatExcelDateRange, formatDate } from '../utils/excelExport';

const VendorDetail = () => {
    const { vendorId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(1);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`reports/vendor-detail/${vendorId}`, {
                params: { start_date: startDate, end_date: endDate }
            });
            setData(response.data);
            setLoading(false);
        } catch {
            setToast({ message: 'Failed to load vendor details', type: 'error' });
            setLoading(false);
        }
    }, [vendorId, startDate, endDate]);

    useEffect(() => {
        // Wrap in setTimeout to avoid 'setState during render' linting issue
        const timer = setTimeout(() => {
            fetchData();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchData]);

    const handleExportPDF = async () => {
        if (!data) return;
        const dateRangeText = formatDateRange(startDate, endDate);
        const result = await exportReportToPDF(
            `${data.vendor.name} - Purchase Report`,
            dateRangeText,
            'vendor-detail-charts',
            'vendor-detail-table',
            `vendor_${data.vendor.name.replace(/[^a-zA-Z0-9]/g, '_')}_report`
        );
        if (!result.success) {
            setToast({ message: 'Failed to export PDF', type: 'error' });
        }
    };

    const handleExportExcel = () => {
        if (!data) return;
        const excelData = data.purchase_history.map(item => ({
            'Date': formatDate(item.date),
            'Location': item.location_name,
            'Water Type': item.water_type,
            'Loads': item.loads,
            'Total KL': parseFloat(item.kl.toFixed(2)),
            'Total Cost (₹)': parseFloat(item.cost.toFixed(2))
        }));

        const dateRangeText = formatExcelDateRange(startDate, endDate);
        const result = exportToExcel(
            excelData,
            `vendor_${data.vendor.name.replace(/[^a-zA-Z0-9]/g, '_')}_report`,
            'Vendor Purchases',
            `${data.vendor.name} - Purchase Report`,
            dateRangeText
        );

        if (!result.success) {
            setToast({ message: 'Failed to export Excel', type: 'error' });
        }
    };

    if (loading) return <div className="text-center py-8">Loading...</div>;
    if (!data) return <div className="text-center py-8">No data available</div>;

    const chartData = data.purchase_history.reduce((acc, item) => {
        const existing = acc.find(d => d.date === item.date);
        if (existing) {
            existing['Water (KL)'] += item.kl;
            existing['Cost (₹)'] += item.cost;
        } else {
            acc.push({
                date: new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                'Water (KL)': item.kl,
                'Cost (₹)': item.cost
            });
        }
        return acc;
    }, []);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow border border-gray-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                    <button
                        onClick={() => navigate('/reports?tab=vendor')}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-2 mb-2 transition-colors font-medium"
                    >
                        ← Back to Vendor Usage
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{data.vendor.name}</h2>
                    <p className="text-gray-600 dark:text-slate-400">Vendor Detail Report</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportExcel}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export Excel
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow flex gap-4 border border-gray-200 dark:border-slate-700">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-100 dark:border-slate-700">
                    <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Total Loads</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{data.totals.total_loads}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-100 dark:border-slate-700">
                    <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Total Water</h3>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{data.totals.total_kl.toFixed(2)} KL</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-100 dark:border-slate-700">
                    <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Total Cost</h3>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">₹{data.totals.total_cost.toFixed(2)}</p>
                </div>
            </div>

            {/* Daily Purchase Trend Chart */}
            <div id="vendor-detail-charts" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Purchase Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="date" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} />
                        <Legend />
                        <Bar dataKey="Water (KL)" fill="#3B82F6" />
                        <Bar dataKey="Cost (₹)" fill="#10B981" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Purchase History Table */}
            <div id="vendor-detail-table" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700 overflow-x-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Purchase History</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Water Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Loads</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total KL</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Cost</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {data.purchase_history.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                        {formatDate(item.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.location_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{item.water_type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{item.loads}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 font-medium">{item.kl.toFixed(2)} KL</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 font-medium text-blue-600 dark:text-blue-400">₹{item.cost.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default VendorDetail;
