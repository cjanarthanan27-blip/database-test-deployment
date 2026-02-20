import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Toast from './Toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportReportToPDF, formatDateRange } from '../utils/pdfExport';
import { exportToExcel, formatDateRange as formatExcelDateRange } from '../utils/excelExport';

const SiteConsumption = () => {
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
            // Only set loading to true if we're not already in a loading state
            // This prevents redundant state updates and potential linting cycles
            setLoading(prev => !prev ? true : prev);
            const response = await api.get('reports/site-consumption', {
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
            'Site Wise Purchase Report',
            dateRangeText,
            'site-consumption-chart',
            'site-consumption-table',
            'site_wise_purchase_report'
        );
        if (!result.success) {
            setToast({ message: 'Failed to export PDF', type: 'error' });
        }
    };

    const handleExportExcel = () => {
        const excelData = data.map(site => ({
            'Site/Location': site.location_name,
            'Loads': site.total_loads,
            'Total KL': parseFloat(site.total_kl.toFixed(2)),
            'Total Cost (₹)': parseFloat(site.total_cost.toFixed(2)),
            '% of Total': totals.kl > 0 ? parseFloat(((site.total_kl / totals.kl) * 100).toFixed(1)) : 0
        }));

        // Add Total Row
        excelData.push({
            'Site/Location': 'Total',
            'Loads': totals.loads,
            'Total KL': parseFloat(totals.kl.toFixed(2)),
            'Total Cost (₹)': parseFloat(totals.cost.toFixed(2)),
            '% of Total': 100
        });

        const dateRangeText = formatExcelDateRange(startDate, endDate);
        const result = exportToExcel(
            excelData,
            'site_wise_purchase_report',
            'Site Wise Purchase',
            'Site Wise Purchase Report',
            dateRangeText
        );

        if (!result.success) {
            setToast({ message: 'Failed to export Excel', type: 'error' });
        }
    };

    const totals = data.reduce((acc, site) => ({
        loads: acc.loads + site.total_loads,
        kl: acc.kl + site.total_kl,
        cost: acc.cost + site.total_cost
    }), { loads: 0, kl: 0, cost: 0 });

    if (loading) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="space-y-6">
            {/* Header with Export Buttons */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Site Wise Purchase</h2>
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
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                    <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium">Total Loads</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-2">{totals.loads}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                    <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium">Total Water to Sites</h3>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{totals.kl.toFixed(2)} KL</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                    <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium">Total Cost</h3>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">₹{totals.cost.toFixed(2)}</p>
                </div>
            </div>

            {/* Site Consumption Chart */}
            {data.length > 0 && (
                <div id="site-consumption-chart" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Top Sites by Water Purchase</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.slice(0, 10).map(site => {
                            const name = site.location_name || 'Unknown';
                            return {
                                name: name.length > 20 ? name.substring(0, 17) + '...' : name,
                                'Water (KL)': site.total_kl || 0,
                                'Loads': site.total_loads || 0,
                                'Cost (₹)': site.total_cost || 0
                            };
                        })}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} />
                            <Legend />
                            <Bar dataKey="Water (KL)" fill="#3B82F6" />
                            <Bar dataKey="Loads" fill="#F59E0B" />
                            <Bar dataKey="Cost (₹)" fill="#10B981" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Site Consumption Table */}
            <div id="site-consumption-table" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700 overflow-x-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Site Wise Purchase</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Site/Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Loads</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total KL</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">% of Total</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {data.map((site) => (
                                <tr key={site.location_id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-100">
                                        <Link
                                            to={`/site-detail/${site.location_id}`}
                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                                        >
                                            {site.location_name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{site.total_loads}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 font-medium">{site.total_kl.toFixed(2)} KL</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 font-medium text-blue-600 dark:text-blue-400">₹{site.total_cost.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                        {totals.kl > 0 ? ((site.total_kl / totals.kl) * 100).toFixed(1) : 0}%
                                    </td>
                                </tr>
                            ))}
                            {/* Total Row */}
                            <tr className="bg-gray-100 dark:bg-slate-900 font-bold">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">Total</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">{totals.loads}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">{totals.kl.toFixed(2)} KL</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">₹{totals.cost.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">100%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default SiteConsumption;
