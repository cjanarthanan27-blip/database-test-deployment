import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Toast from './Toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportReportToPDF, formatDateRange } from '../utils/pdfExport';
import { exportToExcel, formatDateRange as formatExcelDateRange } from '../utils/excelExport';

const CostComparison = () => {
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
            const response = await api.get('reports/cost-comparison', {
                params: { start_date: startDate, end_date: endDate }
            });
            const responseData = response.data.results || response.data;
            setData(responseData);
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
            'Cost Comparison Report',
            dateRangeText,
            'cost-comparison-chart',
            'cost-comparison-table',
            'cost_comparison_report'
        );
        if (!result.success) {
            setToast({ message: 'Failed to export PDF', type: 'error' });
        }
    };

    const handleExportExcel = () => {
        if (!data) return;
        const excelData = Object.entries(data).map(([type, values]) => ({
            'Type': type === 'pipeline' ? 'Corporation Water' :
                type === 'rathinam_vehicles' ? 'Rathinam Vehicles' :
                    type.charAt(0).toUpperCase() + type.slice(1),
            'Total KL': parseFloat(values.total_kl.toFixed(2)),
            'Total Cost (₹)': parseFloat(values.total_cost.toFixed(2)),
            'Cost per KL (₹)': parseFloat(values.cost_per_kl.toFixed(2)),
            'Cost per Liter (₹)': parseFloat(values.cost_per_liter.toFixed(4))
        }));

        const dateRangeText = formatExcelDateRange(startDate, endDate);
        const result = exportToExcel(
            excelData,
            'cost_comparison_report',
            'Cost Comparison',
            'Cost Comparison Report',
            dateRangeText
        );

        if (!result.success) {
            setToast({ message: 'Failed to export Excel', type: 'error' });
        }
    };

    // Prepare chart data
    const chartData = data ? Object.entries(data).map(([type, values]) => ({
        name: type === 'pipeline' ? 'Corporation Water' :
            type === 'rathinam_vehicles' ? 'Rathinam Vehicles' :
                type.charAt(0).toUpperCase() + type.slice(1),
        'Cost per KL (₹)': parseFloat(values.cost_per_kl),
        'Total Water (KL)': values.total_kl
    })) : [];

    if (loading) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="space-y-6">
            {/* Header with Export Buttons */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cost Comparison</h2>
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

            {/* Cost Comparison Chart */}
            {chartData.length > 0 && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cost per KL Comparison</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} />
                            <Legend wrapperStyle={{ color: '#94a3b8' }} />
                            <Bar dataKey="Cost per KL (₹)" fill="#3B82F6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Cost Comparison Table */}
            <div id="cost-comparison-table" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cost per KL Comparison</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Source Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total KL</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Cost per KL</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Cost per Liter</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {data && Object.entries(data).map(([type, values]) => (
                                <tr key={type} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white capitalize">
                                        {type === 'pipeline' ? 'Corporation Water' :
                                            type === 'rathinam_vehicles' ? 'Rathinam Vehicles' :
                                                type.replace('_', ' ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{values.total_kl.toFixed(2)} KL</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">₹{values.total_cost.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-blue-400 font-medium">₹{values.cost_per_kl}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 dark:text-green-400">₹{values.cost_per_liter}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Visual Comparison */}
            {data && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border-l-4 border-blue-500 border dark:border-slate-700">
                        <h3 className="text-gray-700 dark:text-slate-300 font-medium uppercase tracking-wider text-sm">Vendor</h3>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">₹{data.vendor.cost_per_kl} /KL</p>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{data.vendor.total_kl.toFixed(2)} KL consumed</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border-l-4 border-green-500 border dark:border-slate-700">
                        <h3 className="text-gray-700 dark:text-slate-300 font-medium uppercase tracking-wider text-sm">Rathinam Vehicles</h3>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">₹{data.rathinam_vehicles.cost_per_kl} /KL</p>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{data.rathinam_vehicles.total_kl.toFixed(2)} KL transported</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border-l-4 border-purple-500 border dark:border-slate-700">
                        <h3 className="text-gray-700 dark:text-slate-300 font-medium uppercase tracking-wider text-sm">Corporation Water</h3>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">₹{data.pipeline.cost_per_kl} /KL</p>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{data.pipeline.total_kl.toFixed(2)} KL received</p>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default CostComparison;
