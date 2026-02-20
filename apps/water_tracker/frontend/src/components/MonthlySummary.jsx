import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Toast from './Toast';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportReportToPDF, formatDateRange } from '../utils/pdfExport';
import { exportToExcel } from '../utils/excelExport';

const MonthlySummary = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Default to last 6 months
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 5);

    const [startDate, setStartDate] = useState(sixMonthsAgo.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('reports/monthly-summary', {
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
        fetchData();
    }, [fetchData]);

    const handleExportPDF = async () => {
        const dateRange = formatDateRange(startDate, endDate);
        const result = await exportReportToPDF(
            'Monthly Summary Report',
            dateRange,
            'monthly-charts-container',
            'monthly-summary-table',
            'monthly_summary_report',
            'monthly-summary-summaries'
        );
        if (!result.success) {
            setToast({ message: 'Failed to export PDF', type: 'error' });
        }
    };

    const handleExportExcel = () => {
        const monthlyData = data.monthly_data || [];
        const summary = data.summary || {};
        const breakdown = summary.breakdown || {};

        const excelData = monthlyData.map(row => ({
            'Month': row.month_name,
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
            ['Overall Monthly Summary'],
            ['Total Cost (₹)', `₹${(summary.total_cost || 0).toFixed(2)}`],
            [],
            ['Water Type Breakdown'],
            ['Type', 'KL', 'Cost (₹)'],
            ['Corporation Water', `${(breakdown['Corporation Water']?.total_kl || 0).toFixed(2)} KL`, `₹${(breakdown['Corporation Water']?.total_cost || 0).toFixed(2)}`],
            ['Drinking Water', `${(breakdown['Drinking Water']?.total_kl || 0).toFixed(2)} KL`, `₹${(breakdown['Drinking Water']?.total_cost || 0).toFixed(2)}`],
            ['Normal Water (Salt)', `${(breakdown['Normal Water (Salt)']?.total_kl || 0).toFixed(2)} KL`, `₹${(breakdown['Normal Water (Salt)']?.total_cost || 0).toFixed(2)}`]
        ];

        const periodText = `From ${startDate} To ${endDate}`;
        const result = exportToExcel(
            excelData,
            'monthly_summary_report',
            'Monthly Summary',
            'Detailed Monthly Water Purchase Breakdown Report',
            periodText,
            summaryData
        );

        if (!result.success) {
            setToast({ message: 'Failed to export Excel', type: 'error' });
        }
    };

    if (loading) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="space-y-6">
            {/* Filters Section */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 border border-gray-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Monthly Water Purchase</h2>
                <div className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Start Date:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">End Date:</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        />
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
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Consolidated Summary Cards */}
            {data?.summary?.breakdown && (
                <div id="monthly-summary-summaries" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Corporation Water */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-100 dark:border-slate-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 border-b dark:border-slate-700 pb-2">Corporation Water</h3>
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">Quantity (Volume)</h4>
                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                                    {(data.summary.breakdown['Corporation Water']?.total_kl || 0).toFixed(2)} KL
                                </p>
                            </div>
                            <div className="text-right">
                                <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">Cost</h4>
                                <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                                    ₹{(data.summary.breakdown['Corporation Water']?.total_cost || 0).toFixed(0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Drinking Water */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-100 dark:border-slate-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 border-b dark:border-slate-700 pb-2">Drinking Water</h3>
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">Quantity (Volume)</h4>
                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                                    {(data.summary.breakdown['Drinking Water']?.total_kl || 0).toFixed(2)} KL
                                </p>
                            </div>
                            <div className="text-right">
                                <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">Cost</h4>
                                <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                                    ₹{(data.summary.breakdown['Drinking Water']?.total_cost || 0).toFixed(0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Normal Water */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-100 dark:border-slate-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 border-b dark:border-slate-700 pb-2">Normal Water (Salt)</h3>
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">Quantity (Volume)</h4>
                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                                    {(data.summary.breakdown['Normal Water (Salt)']?.total_kl || 0).toFixed(2)} KL
                                </p>
                            </div>
                            <div className="text-right">
                                <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">Cost</h4>
                                <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                                    ₹{(data.summary.breakdown['Normal Water (Salt)']?.total_cost || 0).toFixed(0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Total Cost Summary */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-lg shadow border-2 border-green-100 dark:border-green-900/30 flex flex-col justify-center">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4 border-b border-green-200 dark:border-green-800/50 pb-2">Overall Monthly Summary</h3>
                        <div className="text-center">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Cost</h4>
                            <p className="text-3xl font-black text-green-700 dark:text-green-500 mt-2">
                                ₹{(data.summary?.total_cost || 0).toFixed(0)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Section */}
            {data?.monthly_data && data.monthly_data.length > 0 && (
                <div id="monthly-charts-container" className="space-y-6">
                    <div id="monthly-quantity-chart" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Monthly Water Purchased Quantity Wise (KL)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.monthly_data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="month" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} />
                                <Legend />
                                <Line type="monotone" dataKey="breakdown['Corporation Water'].total_kl" name="Corporation (KL)" stroke="#3B82F6" strokeWidth={2} />
                                <Line type="monotone" dataKey="breakdown['Drinking Water'].total_kl" name="Drinking (KL)" stroke="#10B981" strokeWidth={2} />
                                <Line type="monotone" dataKey="breakdown['Normal Water (Salt)'].total_kl" name="Normal (KL)" stroke="#F59E0B" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div id="monthly-cost-chart" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Monthly Water Purchased Cost Wise</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.monthly_data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="month" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} formatter={(value) => `₹${value.toLocaleString()}`} />
                                <Legend />
                                <Line type="monotone" dataKey="breakdown['Corporation Water'].total_cost" name="Corporation" stroke="#3B82F6" strokeWidth={2} />
                                <Line type="monotone" dataKey="breakdown['Drinking Water'].total_cost" name="Drinking" stroke="#10B981" strokeWidth={2} />
                                <Line type="monotone" dataKey="breakdown['Normal Water (Salt)'].total_cost" name="Normal" stroke="#F59E0B" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Detailed Breakdown Table */}
            <div id="monthly-summary-table" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700 overflow-x-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Detailed Monthly Water Purchase Breakdown</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                            <tr>
                                <th rowSpan="2" className="px-4 py-3 text-left font-medium text-gray-500 dark:text-slate-400 uppercase border dark:border-slate-700">Month</th>
                                <th colSpan="2" className="px-4 py-2 text-center font-medium text-gray-500 dark:text-slate-400 uppercase border dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20">Corporation</th>
                                <th colSpan="2" className="px-4 py-2 text-center font-medium text-gray-500 dark:text-slate-400 uppercase border dark:border-slate-700 bg-green-50 dark:bg-green-900/20">Drinking</th>
                                <th colSpan="2" className="px-4 py-2 text-center font-medium text-gray-500 dark:text-slate-400 uppercase border dark:border-slate-700 bg-yellow-50 dark:bg-yellow-900/20">Normal</th>
                                <th rowSpan="2" className="px-4 py-3 text-right font-medium text-gray-500 dark:text-slate-400 uppercase border dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 whitespace-nowrap">Total Cost</th>
                            </tr>
                            <tr>
                                <th className="px-2 py-2 text-right border dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20">Vol (KL)</th>
                                <th className="px-2 py-2 text-right border dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20">Cost (₹)</th>
                                <th className="px-2 py-2 text-right border dark:border-slate-700 bg-green-50 dark:bg-green-900/20">Vol (KL)</th>
                                <th className="px-2 py-2 text-right border dark:border-slate-700 bg-green-50 dark:bg-green-900/20">Cost (₹)</th>
                                <th className="px-2 py-2 text-right border dark:border-slate-700 bg-yellow-50 dark:bg-yellow-900/20">Vol (KL)</th>
                                <th className="px-2 py-2 text-right border dark:border-slate-700 bg-yellow-50 dark:bg-yellow-900/20">Cost (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {data?.monthly_data && data.monthly_data.map((row) => (
                                <tr key={row.month} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-slate-200 border dark:border-slate-700">
                                        {row.month_name}
                                    </td>

                                    {/* Corporation */}
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-gray-600 dark:text-slate-400 border dark:border-slate-700 bg-blue-50/50 dark:bg-blue-900/10">
                                        {(row.breakdown['Corporation Water']?.total_kl || 0).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-green-600 dark:text-green-400 border dark:border-slate-700 bg-blue-50/50 dark:bg-blue-900/10">
                                        {(row.breakdown['Corporation Water']?.total_cost || 0).toFixed(0)}
                                    </td>

                                    {/* Drinking */}
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-gray-600 dark:text-slate-400 border dark:border-slate-700 bg-green-50/50 dark:bg-green-900/10">
                                        {(row.breakdown['Drinking Water']?.total_kl || 0).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-green-600 dark:text-green-400 border dark:border-slate-700 bg-green-50/50 dark:bg-green-900/10">
                                        {(row.breakdown['Drinking Water']?.total_cost || 0).toFixed(0)}
                                    </td>

                                    {/* Normal */}
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-gray-600 dark:text-slate-400 border dark:border-slate-700 bg-yellow-50/50 dark:bg-yellow-900/10">
                                        {(row.breakdown['Normal Water (Salt)']?.total_kl || 0).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-green-600 dark:text-green-400 border dark:border-slate-700 bg-yellow-50/50 dark:bg-yellow-900/10">
                                        {(row.breakdown['Normal Water (Salt)']?.total_cost || 0).toFixed(0)}
                                    </td>

                                    {/* Total */}
                                    <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-gray-900 dark:text-slate-100 border dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/30">
                                        ₹{row.total_cost.toFixed(0)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100 dark:bg-slate-900 font-bold">
                            <tr>
                                <td className="px-4 py-3 whitespace-nowrap border dark:border-slate-700 text-gray-900 dark:text-slate-100 uppercase">Total</td>
                                {/* Corporation */}
                                <td className="px-4 py-3 whitespace-nowrap text-right border dark:border-slate-700 text-gray-900 dark:text-slate-100 bg-blue-100 dark:bg-blue-900/30">
                                    {(data?.summary?.breakdown?.['Corporation Water']?.total_kl || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right border dark:border-slate-700 text-green-700 dark:text-green-400 bg-blue-100 dark:bg-blue-900/30">
                                    {(data?.summary?.breakdown?.['Corporation Water']?.total_cost || 0).toFixed(0)}
                                </td>
                                {/* Drinking */}
                                <td className="px-4 py-3 whitespace-nowrap text-right border dark:border-slate-700 text-gray-900 dark:text-slate-100 bg-green-100 dark:bg-green-900/30">
                                    {(data?.summary?.breakdown?.['Drinking Water']?.total_kl || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right border dark:border-slate-700 text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30">
                                    {(data?.summary?.breakdown?.['Drinking Water']?.total_cost || 0).toFixed(0)}
                                </td>
                                {/* Normal */}
                                <td className="px-4 py-3 whitespace-nowrap text-right border dark:border-slate-700 text-gray-900 dark:text-slate-100 bg-yellow-100 dark:bg-yellow-900/30">
                                    {(data?.summary?.breakdown?.['Normal Water (Salt)']?.total_kl || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right border dark:border-slate-700 text-green-700 dark:text-green-400 bg-yellow-100 dark:bg-yellow-900/30">
                                    {(data?.summary?.breakdown?.['Normal Water (Salt)']?.total_cost || 0).toFixed(0)}
                                </td>
                                {/* Final Total */}
                                <td className="px-4 py-3 whitespace-nowrap text-right border dark:border-slate-700 text-green-800 dark:text-green-400 bg-gray-200 dark:bg-slate-800">₹{(data?.summary?.total_cost || 0).toFixed(0)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default MonthlySummary;
