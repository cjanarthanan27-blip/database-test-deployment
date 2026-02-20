import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Toast from './Toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportReportToPDF, formatDateRange } from '../utils/pdfExport';
import { exportToExcel, formatDateRange as formatExcelDateRange } from '../utils/excelExport';

const VendorUsage = () => {
    const [data, setData] = useState([]);
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
            // Only set loading to true if we're not already loading
            setLoading(prev => !prev ? true : prev);
            const response = await api.get('reports/vendor-usage', {
                params: { start_date: startDate, end_date: endDate }
            });
            setData(response.data);
            setLoading(false);
        } catch {
            setToast({ message: 'Failed to load report', type: 'error' });
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        // Wrap in setTimeout to avoid 'setState during render' linting issue
        const timer = setTimeout(() => {
            fetchData();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchData]);

    const handleExportPDF = async () => {
        const dateRangeText = formatDateRange(startDate, endDate);
        const result = await exportReportToPDF(
            'Vendor Usage Report',
            dateRangeText,
            'vendor-usage-chart',
            'vendor-usage-table',
            'vendor_usage_report',
            'vendor-usage-summaries'
        );
        if (!result.success) {
            setToast({ message: 'Failed to export PDF', type: 'error' });
        }
    };

    const handleExportExcel = () => {
        const excelData = (data.vendor_data || []).map(vendor => ({
            'Vendor Name': vendor.vendor_name,
            'Loads': vendor.loads,
            'Total KL': parseFloat(vendor.total_kl.toFixed(2)),
            'Total Cost (₹)': parseFloat(vendor.total_cost.toFixed(2)),
            '% of Total': summary.total_kl > 0 ? parseFloat(((vendor.total_kl / summary.total_kl) * 100).toFixed(1)) : 0
        }));

        const summaryData = [
            ['Overall Summary'],
            ['Total Vendor Loads', summary.total_loads],
            ['Total Water from Vendors (KL)', summary.total_kl.toFixed(2)],
            ['Total Paid to Vendors (₹)', summary.total_cost.toFixed(2)],
            [],
            ['Water Type Breakdown'],
            ['Type', 'KL', 'Cost (₹)']
        ];

        if (summary.breakdown) {
            Object.entries(summary.breakdown).forEach(([type, values]) => {
                summaryData.push([type, values.total_kl.toFixed(2), values.total_cost.toFixed(2)]);
            });
        }

        const dateRangeText = formatExcelDateRange(startDate, endDate);
        const result = exportToExcel(
            excelData,
            'vendor_usage_report',
            'Vendor Usage',
            'Vendor Usage Report',
            dateRangeText,
            summaryData
        );

        if (!result.success) {
            setToast({ message: 'Failed to export Excel', type: 'error' });
        }
    };

    const summary = data.summary || { total_loads: 0, total_kl: 0, total_cost: 0, breakdown: {} };
    const vendor_data = data.vendor_data || [];

    // Prepare chart data
    const chartData = vendor_data.map(vendor => ({
        name: vendor.vendor_name.length > 15 ? vendor.vendor_name.substring(0, 15) + '...' : vendor.vendor_name,
        'Water (KL)': vendor.total_kl,
        'Cost (₹)': vendor.total_cost,
        'Loads': vendor.loads
    }));

    if (loading) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="space-y-6">
            {/* Header with Export Buttons */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Vendor Usage</h2>
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
            <div id="vendor-usage-summaries" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                        <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Total Vendor Loads</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-2">{summary.total_loads}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                        <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Total Water from Vendors</h3>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{summary.total_kl.toFixed(2)} KL</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                        <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Total Paid to Vendors</h3>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">₹{summary.total_cost.toFixed(2)}</p>
                    </div>
                </div>

                {/* Water Type Breakdown Cards */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 text-center">Summary Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {summary.breakdown && Object.entries(summary.breakdown).map(([type, values]) => (
                            <div key={type} className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-2 bg-gray-50 dark:bg-slate-900/40 rounded-r-lg">
                                <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">{type}</h4>
                                <div className="mt-2 flex flex-col">
                                    <span className="text-xl font-bold text-gray-900 dark:text-slate-100">{values.total_kl.toFixed(2)} KL</span>
                                    <span className="text-sm text-green-600 dark:text-green-400 font-semibold">₹{values.total_cost.toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chart */}
            {vendor_data.length > 0 && (
                <div id="vendor-usage-chart" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Vendor Comparison</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} stroke="#94a3b8" />
                            <YAxis yAxisId="left" stroke="#94a3b8" />
                            <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} />
                            <Legend />
                            <Bar yAxisId="left" dataKey="Water (KL)" fill="#3B82F6" />
                            <Bar yAxisId="right" dataKey="Cost (₹)" fill="#10B981" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Vendor Table */}
            <div id="vendor-usage-table" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700 overflow-x-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Vendor-wise Breakdown</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Vendor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Loads</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total KL</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Avg Cost/KL</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {vendor_data.map((vendor) => (
                                <tr key={vendor.vendor_id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Link
                                            to={`/vendor-detail/${vendor.vendor_id}`}
                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                                        >
                                            {vendor.vendor_name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{vendor.loads}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 font-medium">{vendor.total_kl.toFixed(2)} KL</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 font-medium text-blue-600 dark:text-blue-400">₹{vendor.total_cost.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 italic">
                                        ₹{vendor.total_kl > 0 ? (vendor.total_cost / vendor.total_kl).toFixed(2) : 0}
                                    </td>
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

export default VendorUsage;
