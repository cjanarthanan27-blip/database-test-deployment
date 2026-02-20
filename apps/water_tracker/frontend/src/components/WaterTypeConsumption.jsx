import { useState, useEffect } from 'react';
import api from '../services/api';
import Toast from './Toast';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportReportToPDF, formatDateRange } from '../utils/pdfExport';
import { exportToExcel, formatDateRange as formatExcelDateRange } from '../utils/excelExport';

const WaterTypeConsumption = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(1);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('reports/water-type', {
                params: { start_date: startDate, end_date: endDate }
            });
            const responseData = response.data.results || response.data;
            setData(responseData);
            setLoading(false);
        } catch (err) {
            setToast({ message: 'Failed to load report', type: 'error' });
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        const dateRangeText = formatDateRange(startDate, endDate);
        const result = await exportReportToPDF(
            'Water Type Purchase Report',
            dateRangeText,
            'water-type-chart',
            'water-type-table',
            'water_type_report'
        );
        if (!result.success) {
            setToast({ message: 'Failed to export PDF', type: 'error' });
        }
    };

    const handleExportExcel = () => {
        if (!data) return;
        const excelData = Object.entries(data).map(([type, values]) => ({
            'Water Type': type,
            'Loads': values.loads,
            'Total KL': parseFloat(values.total_kl.toFixed(2)),
            'Total Cost (₹)': parseFloat(values.total_cost.toFixed(2)),
            'Cost per KL (₹)': values.total_kl > 0 ? parseFloat((values.total_cost / values.total_kl).toFixed(2)) : 0
        }));

        const dateRangeText = formatExcelDateRange(startDate, endDate);
        const result = exportToExcel(
            excelData,
            'water_type_purchase_report',
            'Water Type Purchase',
            'Water Type Purchase Report',
            dateRangeText
        );

        if (!result.success) {
            setToast({ message: 'Failed to export Excel', type: 'error' });
        }
    };

    // Prepare chart data
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
    const chartData = data ? Object.entries(data).map(([type, values]) => ({
        name: type,
        value: values.total_kl
    })) : [];

    if (loading) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="space-y-6">
            {/* Header with Export Buttons */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Water Type Purchase</h2>
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
            </div >

            {/* Pie Chart */}
            {
                chartData.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Water Type Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} />
                                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )
            }

            {/* Water Type Comparison */}
            <div id="water-type-table" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700 overflow-x-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Water Type Purchase Breakdown</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider border-b dark:border-slate-700">Water Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider border-b dark:border-slate-700">Loads</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider border-b dark:border-slate-700">Total KL</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider border-b dark:border-slate-700">Total Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider border-b dark:border-slate-700">Cost per KL</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {data && Object.entries(data).map(([type, values]) => (
                                <tr key={type} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-100">{type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{values.loads}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 font-medium">{values.total_kl.toFixed(2)} KL</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 font-medium text-blue-600 dark:text-blue-400">₹{values.total_cost.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 italic">
                                        ₹{values.total_kl > 0 ? (values.total_cost / values.total_kl).toFixed(2) : 0}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div >
    );
};

export default WaterTypeConsumption;
