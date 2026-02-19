import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Toast from './Toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportReportToPDF } from '../utils/pdfExport';
import { exportToExcel } from '../utils/excelExport';

const YearlyTrend = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const currentYear = new Date().getFullYear();
    const [startYear, setStartYear] = useState(currentYear - 4);
    const [endYear, setEndYear] = useState(currentYear);

    const fetchData = useCallback(async () => {
        try {
            // Only set loading to true if we're not already loading to avoid linting issues
            setLoading(prev => !prev ? true : prev);
            const response = await api.get('reports/yearly-trend', {
                params: { start_year: startYear, end_year: endYear }
            });
            setData(response.data);
            setLoading(false);
        } catch {
            setToast({ message: 'Failed to load report', type: 'error' });
            setLoading(false);
        }
    }, [startYear, endYear]);

    useEffect(() => {
        // Wrap in setTimeout to avoid 'setState during render' linting issue
        const timer = setTimeout(() => {
            fetchData();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchData]);

    const handleExportPDF = async () => {
        const periodText = `Period: ${startYear} - ${endYear}`;
        const result = await exportReportToPDF(
            'Yearly Water Purchase Report',
            periodText,
            'yearly-charts-container',
            'yearly-trend-table',
            'yearly_purchase_report',
            'yearly-summary-summaries'
        );
        if (!result.success) {
            setToast({ message: 'Failed to export PDF', type: 'error' });
        }
    };

    const handleExportExcel = () => {
        const yearlyData = data.yearly_data || [];
        const summary = data.summary || {};
        const breakdown = summary.breakdown || {};

        const excelData = yearlyData.map(row => ({
            'Year': row.year,
            // Corporation
            'Corporation Vol (KL)': parseFloat((row.breakdown['Corporation Water']?.total_kl || 0).toFixed(2)),
            'Corporation Cost (₹)': parseFloat((row.breakdown['Corporation Water']?.total_cost || 0).toFixed(2)),
            // Drinking
            'Drinking Vol (KL)': parseFloat((row.breakdown['Drinking Water']?.total_kl || 0).toFixed(2)),
            'Drinking Cost (₹)': parseFloat((row.breakdown['Drinking Water']?.total_cost || 0).toFixed(2)),
            // Normal
            'Normal Vol (KL)': parseFloat((row.breakdown['Normal Water (Salt)']?.total_kl || 0).toFixed(2)),
            'Normal Cost (₹)': parseFloat((row.breakdown['Normal Water (Salt)']?.total_cost || 0).toFixed(2)),
            // Total
            'Total Cost (₹)': parseFloat((row.total_cost || 0).toFixed(2))
        }));

        const summaryData = [
            ['Overall Yearly Summary'],
            ['Total Cost (₹)', `₹${(summary.total_cost || 0).toFixed(2)}`],
            [],
            ['Water Type Breakdown'],
            ['Type', 'KL', 'Cost (₹)'],
            ['Corporation Water', `${(breakdown['Corporation Water']?.total_kl || 0).toFixed(2)} KL`, `₹${(breakdown['Corporation Water']?.total_cost || 0).toFixed(2)}`],
            ['Drinking Water', `${(breakdown['Drinking Water']?.total_kl || 0).toFixed(2)} KL`, `₹${(breakdown['Drinking Water']?.total_cost || 0).toFixed(2)}`],
            ['Normal Water (Salt)', `${(breakdown['Normal Water (Salt)']?.total_kl || 0).toFixed(2)} KL`, `₹${(breakdown['Normal Water (Salt)']?.total_cost || 0).toFixed(2)}`]
        ];

        const periodText = `From ${startYear} To ${endYear}`;
        const result = exportToExcel(
            excelData,
            'yearly_purchase_report',
            'Yearly Summary',
            'Detailed Yearly Water Purchase Breakdown Report',
            periodText,
            summaryData
        );

        if (!result.success) {
            setToast({ message: 'Failed to export Excel', type: 'error' });
        }
    };

    if (loading || !data) return <div className="text-center py-8">Loading...</div>;

    const summary = data.summary || { breakdown: {} };
    const yearly_data = data.yearly_data || [];

    // Prepare chart data
    const chartData = yearly_data.map(item => ({
        name: item.year.toString(),
        'Corporation (KL)': item.breakdown['Corporation Water']?.total_kl || 0,
        'Drinking (KL)': item.breakdown['Drinking Water']?.total_kl || 0,
        'Normal (KL)': item.breakdown['Normal Water (Salt)']?.total_kl || 0,
        'Corporation': item.breakdown['Corporation Water']?.total_cost || 0,
        'Drinking': item.breakdown['Drinking Water']?.total_cost || 0,
        'Normal': item.breakdown['Normal Water (Salt)']?.total_cost || 0,
    }));

    const years = [];
    for (let y = currentYear - 10; y <= currentYear + 1; y++) {
        years.push(y);
    }

    return (
        <div className="space-y-6">
            {/* Filters Section */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 border border-gray-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Yearly Water Purchase</h2>
                <div className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Start Year:</label>
                        <select
                            value={startYear}
                            onChange={(e) => setStartYear(parseInt(e.target.value))}
                            className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">End Year:</label>
                        <select
                            value={endYear}
                            onChange={(e) => setEndYear(parseInt(e.target.value))}
                            className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={handleExportPDF}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                    >
                        Export PDF
                    </button>
                    <button
                        onClick={handleExportExcel}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                    >
                        Export Excel
                    </button>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div id="yearly-summary-summaries" className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border-l-4 border-blue-500 dark:border-slate-700">
                    <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium uppercase">Corporation Water</h3>
                    <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">{(summary.breakdown['Corporation Water']?.total_kl || 0).toFixed(2)} KL</div>
                    <div className="text-sm text-green-600 dark:text-green-400 font-semibold">₹{(summary.breakdown['Corporation Water']?.total_cost || 0).toFixed(2)}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border-l-4 border-green-500 dark:border-slate-700">
                    <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium uppercase">Drinking Water</h3>
                    <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">{(summary.breakdown['Drinking Water']?.total_kl || 0).toFixed(2)} KL</div>
                    <div className="text-sm text-green-600 dark:text-green-400 font-semibold">₹{(summary.breakdown['Drinking Water']?.total_cost || 0).toFixed(2)}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border-l-4 border-yellow-500 dark:border-slate-700">
                    <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium uppercase">Normal Water (Salt)</h3>
                    <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">{(summary.breakdown['Normal Water (Salt)']?.total_kl || 0).toFixed(2)} KL</div>
                    <div className="text-sm text-green-600 dark:text-green-400 font-semibold">₹{(summary.breakdown['Normal Water (Salt)']?.total_cost || 0).toFixed(2)}</div>
                </div>
                <div className="bg-blue-600 dark:bg-blue-700 p-6 rounded-lg shadow text-white">
                    <h3 className="text-blue-100 text-sm font-medium uppercase">Overall Yearly Summary</h3>
                    <div className="mt-2 text-2xl font-bold">₹{(summary.total_cost || 0).toFixed(2)}</div>
                </div>
            </div>

            {/* Charts Section */}
            <div id="yearly-charts-container" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 text-center">Yearly Water Purchased Quantity Wise (KL)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} />
                            <Legend />
                            <Line type="monotone" dataKey="Corporation (KL)" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="Drinking (KL)" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="Normal (KL)" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 text-center">Yearly Water Purchased Cost Wise</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} formatter={(value) => `₹${parseFloat(value).toLocaleString()}`} />
                            <Legend />
                            <Line type="monotone" dataKey="Corporation" name="Corporation (₹)" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="Drinking" name="Drinking (₹)" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="Normal" name="Normal (₹)" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Breakdown Table */}
            <div id="yearly-trend-table" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 text-center">Detailed Yearly Water Purchase Breakdown</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-slate-900/50">
                                <th rowSpan="2" className="border dark:border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-400">Year</th>
                                <th colSpan="2" className="border dark:border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20">Corporation</th>
                                <th colSpan="2" className="border dark:border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-400 bg-green-50 dark:bg-green-900/20">Drinking</th>
                                <th colSpan="2" className="border dark:border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-400 bg-yellow-50 dark:bg-yellow-900/20">Normal</th>
                                <th rowSpan="2" className="border dark:border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-400">Total Cost</th>
                            </tr>
                            <tr className="bg-gray-50 dark:bg-slate-900/30">
                                <th className="border dark:border-slate-700 px-4 py-1 text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400 bg-blue-50/50 dark:bg-blue-900/10 text-center">Vol (KL)</th>
                                <th className="border dark:border-slate-700 px-4 py-1 text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400 bg-blue-50/50 dark:bg-blue-900/10 text-right">Cost (₹)</th>
                                <th className="border dark:border-slate-700 px-4 py-1 text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400 bg-green-50/50 dark:bg-green-900/10 text-center">Vol (KL)</th>
                                <th className="border dark:border-slate-700 px-4 py-1 text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400 bg-green-50/50 dark:bg-green-900/10 text-right">Cost (₹)</th>
                                <th className="border dark:border-slate-700 px-4 py-1 text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400 bg-yellow-50/50 dark:bg-yellow-900/10 text-center">Vol (KL)</th>
                                <th className="border dark:border-slate-700 px-4 py-1 text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400 bg-yellow-50/50 dark:bg-yellow-900/10 text-right">Cost (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800">
                            {yearly_data.map((row) => (
                                <tr key={row.year} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 text-sm transition-colors">
                                    <td className="border dark:border-slate-700 px-4 py-2 font-medium text-gray-900 dark:text-slate-200">{row.year}</td>
                                    <td className="border dark:border-slate-700 px-4 py-2 text-center text-gray-600 dark:text-slate-400 bg-blue-50/30 dark:bg-blue-900/5">{(row.breakdown['Corporation Water']?.total_kl || 0).toFixed(2)}</td>
                                    <td className="border dark:border-slate-700 px-4 py-2 text-right text-blue-600 dark:text-blue-400 font-medium bg-blue-50/30 dark:bg-blue-900/5">₹{(row.breakdown['Corporation Water']?.total_cost || 0).toFixed(2)}</td>
                                    <td className="border dark:border-slate-700 px-4 py-2 text-center text-gray-600 dark:text-slate-400 bg-green-50/30 dark:bg-green-900/5">{(row.breakdown['Drinking Water']?.total_kl || 0).toFixed(2)}</td>
                                    <td className="border dark:border-slate-700 px-4 py-2 text-right text-green-600 dark:text-green-400 font-medium bg-green-50/30 dark:bg-green-900/5">₹{(row.breakdown['Drinking Water']?.total_cost || 0).toFixed(2)}</td>
                                    <td className="border dark:border-slate-700 px-4 py-2 text-center text-gray-600 dark:text-slate-400 bg-yellow-50/30 dark:bg-yellow-900/5">{(row.breakdown['Normal Water (Salt)']?.total_kl || 0).toFixed(2)}</td>
                                    <td className="border dark:border-slate-700 px-4 py-2 text-right text-yellow-600 dark:text-yellow-400 font-medium bg-yellow-50/30 dark:bg-yellow-900/5">₹{(row.breakdown['Normal Water (Salt)']?.total_cost || 0).toFixed(2)}</td>
                                    <td className="border dark:border-slate-700 px-4 py-2 text-right font-bold text-gray-900 dark:text-slate-100 bg-gray-50/50 dark:bg-slate-900/20">₹{(row.total_cost || 0).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100 dark:bg-slate-900 font-bold">
                            <tr>
                                <td className="border dark:border-slate-700 px-4 py-2 text-gray-900 dark:text-slate-100">TOTAL</td>
                                <td className="border dark:border-slate-700 px-4 py-2 text-center text-gray-900 dark:text-slate-100 bg-blue-100 dark:bg-blue-900/30">{(summary.breakdown['Corporation Water']?.total_kl || 0).toFixed(2)}</td>
                                <td className="border dark:border-slate-700 px-4 py-2 text-right text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30">₹{(summary.breakdown['Corporation Water']?.total_cost || 0).toFixed(2)}</td>
                                <td className="border dark:border-slate-700 px-4 py-2 text-center text-gray-900 dark:text-slate-100 bg-green-100 dark:bg-green-900/30">{(summary.breakdown['Drinking Water']?.total_kl || 0).toFixed(2)}</td>
                                <td className="border dark:border-slate-700 px-4 py-2 text-right text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30">₹{(summary.breakdown['Drinking Water']?.total_cost || 0).toFixed(2)}</td>
                                <td className="border dark:border-slate-700 px-4 py-2 text-center text-gray-900 dark:text-slate-100 bg-yellow-100 dark:bg-yellow-900/30">{(summary.breakdown['Normal Water (Salt)']?.total_kl || 0).toFixed(2)}</td>
                                <td className="border dark:border-slate-700 px-4 py-2 text-right text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30">₹{(summary.breakdown['Normal Water (Salt)']?.total_cost || 0).toFixed(2)}</td>
                                <td className="border dark:border-slate-700 px-4 py-2 text-right text-gray-900 dark:text-slate-100 text-lg bg-gray-200 dark:bg-slate-800">₹{(summary.total_cost || 0).toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default YearlyTrend;
