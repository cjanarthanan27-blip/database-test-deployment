import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Toast from './Toast';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportReportToPDF, formatDateRange } from '../utils/pdfExport';
import { exportToExcel, formatDateRange as formatExcelDateRange, formatDate } from '../utils/excelExport';

const SiteDetail = () => {
    const { locationId } = useParams();
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
            const response = await api.get(`reports/site-detail/${locationId}`, {
                params: { start_date: startDate, end_date: endDate }
            });
            setData(response.data);
            setLoading(false);
        } catch {
            setToast({ message: 'Failed to load site details', type: 'error' });
            setLoading(false);
        }
    }, [locationId, startDate, endDate]);

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
            `${data.location.name} - Consumption Report`,
            dateRangeText,
            'site-detail-charts',
            'site-detail-table',
            `site_${data.location.name.replace(/[^a-zA-Z0-9]/g, '_')}_report`
        );
        if (!result.success) {
            setToast({ message: 'Failed to export PDF', type: 'error' });
        }
    };

    const handleExportExcel = () => {
        if (!data) return;
        const excelData = data.by_water_type.map(item => ({
            'Water Type': item.water_type,
            'Loads': item.loads,
            'Total KL': parseFloat(item.total_kl.toFixed(2)),
            'Total Cost (₹)': parseFloat(item.total_cost.toFixed(2)),
            'Cost per KL (₹)': item.total_kl > 0 ? parseFloat((item.total_cost / item.total_kl).toFixed(2)) : 0
        }));

        const dateRangeText = formatExcelDateRange(startDate, endDate);
        const result = exportToExcel(
            excelData,
            `site_${data.location.name.replace(/[^a-zA-Z0-9]/g, '_')}_report`,
            'Site Consumption',
            `${data.location.name} - Consumption Report`,
            dateRangeText
        );

        if (!result.success) {
            setToast({ message: 'Failed to export Excel', type: 'error' });
        }
    };

    if (loading) return <div className="text-center py-8">Loading...</div>;
    if (!data) return <div className="text-center py-8">No data available</div>;

    // Prepare chart data
    const COLORS = ['#3B82F6', '#10B981'];
    const pieData = data.by_water_type.map((item) => ({
        name: item.water_type,
        value: item.total_kl
    }));

    const barData = data.by_water_type.map((item) => ({
        name: item.water_type === 'Drinking Water' ? 'Drinking' : 'Normal (Salt)',
        'Water (KL)': item.total_kl,
        'Cost (₹)': item.total_cost / 100,
        'Loads': item.loads
    }));

    const lineData = data.daily_trend.map((day) => ({
        date: new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        'Drinking': day['Drinking Water'] || 0,
        'Normal': day['Normal Water (Salt)'] || 0
    }));

    return (
        <div className="space-y-6">
            {/* Header with Back Button */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow border border-gray-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                    <button
                        onClick={() => navigate('/reports')}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-2 mb-2 transition-colors font-medium"
                    >
                        ← Back to Reports
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{data.location.name}</h2>
                    <p className="text-gray-600 dark:text-slate-400">{data.location.type}</p>
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

            {/* Charts */}
            <div id="site-detail-charts" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                {pieData.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Water Type Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} />
                                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Bar Chart */}
                {barData.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Water Type Comparison</h3>

                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Water (KL)" fill="#3B82F6" />
                                <Bar dataKey="Loads" fill="#F59E0B" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Daily Trend */}
            {lineData.length > 0 && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Water Type Trend</h3>

                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={lineData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="Drinking" stroke="#3B82F6" strokeWidth={2} />
                            <Line type="monotone" dataKey="Normal" stroke="#10B981" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Water Type Details Table */}
            <div id="site-detail-table" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Water Type Breakdown</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Water Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Loads</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Total KL</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Total Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Cost per KL</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {data.by_water_type.map((item) => (
                                <tr key={item.water_type}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.water_type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{item.loads}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{item.total_kl.toFixed(2)} KL</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">₹{item.total_cost.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                        ₹{item.total_kl > 0 ? (item.total_cost / item.total_kl).toFixed(2) : 0}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Daily Consumption Breakdown Table */}
            <div id="site-daily-table" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Consumption Breakdown</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Corporation Water</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Corp. Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Drinking Water</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Drinking Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Normal Water</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Normal Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Total KL</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Total Cost</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {data.daily_trend.map((day) => (
                                <tr key={day.date} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {formatDate(day.date)}
                                    </td>

                                    {/* Corporation */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                        {day['Corporation Water'] ? `${day['Corporation Water'].toFixed(2)} KL` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                        {day['Corporation Water Cost'] ? `₹${day['Corporation Water Cost'].toFixed(2)}` : '-'}
                                    </td>

                                    {/* Drinking */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                        {day['Drinking Water'] ? `${day['Drinking Water'].toFixed(2)} KL` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                        {day['Drinking Water Cost'] ? `₹${day['Drinking Water Cost'].toFixed(2)}` : '-'}
                                    </td>

                                    {/* Normal */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                        {day['Normal Water (Salt)'] ? `${day['Normal Water (Salt)'].toFixed(2)} KL` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                        {day['Normal Water (Salt) Cost'] ? `₹${day['Normal Water (Salt) Cost'].toFixed(2)}` : '-'}
                                    </td>

                                    {/* Totals */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                        {day.total_kl.toFixed(2)} KL
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 dark:text-green-400">
                                        ₹{day.total_cost.toFixed(2)}
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

export default SiteDetail;
