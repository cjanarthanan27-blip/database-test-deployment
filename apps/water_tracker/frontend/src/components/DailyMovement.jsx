import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Toast from './Toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportReportToPDF, formatDateRange } from '../utils/pdfExport';
import { exportToExcel, formatDateRange as formatExcelDateRange, formatDate } from '../utils/excelExport';

const DailyMovement = () => {
    const [data, setData] = useState({ daily_data: [], summary: {} });
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
            const response = await api.get('reports/daily-movement', {
                params: { start_date: startDate, end_date: endDate }
            });
            const responseData = response.data.results || response.data;
            // Ensure responseData has expected structure or default
            if (Array.isArray(responseData)) {
                // Handle legacy response if backend update hasn't propagated or failed
                setData({ daily_data: responseData, summary: {} });
            } else {
                setData(responseData);
            }
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
        const dateRangeText = formatDateRange(startDate, endDate);
        const result = await exportReportToPDF(
            'Daily Water Purchase Report',
            dateRangeText,
            'daily-charts-container',
            'daily-movement-table',
            'daily_water_purchase_report',
            'daily-movement-summaries'
        );
        if (!result.success) {
            setToast({ message: 'Failed to export PDF', type: 'error' });
        }
    };

    const handleExportExcel = () => {
        const entries = data.daily_data || [];
        const summary = data.summary || {};
        const breakdown = summary.breakdown || {};

        // Prepare summary data for Excel
        const summaryData = [
            ['Total Monthly Summary'],
            ['Total Cost', `₹${(summary.total_cost || 0).toFixed(2)}`],
            [],
            ['Water Type Breakdown'],
            ['Type', 'Quantity (Volume)', 'Cost'],
            ['Corporation Water', `${(breakdown['Corporation Water']?.total_kl || 0).toFixed(2)} KL`, `₹${(breakdown['Corporation Water']?.total_cost || 0).toFixed(2)}`],
            ['Drinking Water', `${(breakdown['Drinking Water']?.total_kl || 0).toFixed(2)} KL`, `₹${(breakdown['Drinking Water']?.total_cost || 0).toFixed(2)}`],
            ['Normal Water (Salt)', `${(breakdown['Normal Water (Salt)']?.total_kl || 0).toFixed(2)} KL`, `₹${(breakdown['Normal Water (Salt)']?.total_cost || 0).toFixed(2)}`]
        ];

        const excelData = entries.map(day => ({
            'Date': formatDate(day.date),
            // Corporation
            'Corporation Vol (KL)': parseFloat((day.breakdown['Corporation Water']?.total_kl || 0).toFixed(2)),
            'Corporation Cost (₹)': parseFloat((day.breakdown['Corporation Water']?.total_cost || 0).toFixed(2)),
            // Drinking
            'Drinking Vol (KL)': parseFloat((day.breakdown['Drinking Water']?.total_kl || 0).toFixed(2)),
            'Drinking Cost (₹)': parseFloat((day.breakdown['Drinking Water']?.total_cost || 0).toFixed(2)),
            // Normal
            'Normal Vol (KL)': parseFloat((day.breakdown['Normal Water (Salt)']?.total_kl || 0).toFixed(2)),
            'Normal Cost (₹)': parseFloat((day.breakdown['Normal Water (Salt)']?.total_cost || 0).toFixed(2)),
            // Total
            'Total Cost (₹)': parseFloat((day.total_cost || 0).toFixed(2))
        }));

        // Add Total row to Excel
        excelData.push({
            'Date': 'TOTAL',
            'Corporation Vol (KL)': parseFloat(totals.corp_vol.toFixed(2)),
            'Corporation Cost (₹)': parseFloat(totals.corp_cost.toFixed(2)),
            'Drinking Vol (KL)': parseFloat(totals.drink_vol.toFixed(2)),
            'Drinking Cost (₹)': parseFloat(totals.drink_cost.toFixed(2)),
            'Normal Vol (KL)': parseFloat(totals.normal_vol.toFixed(2)),
            'Normal Cost (₹)': parseFloat(totals.normal_cost.toFixed(2)),
            'Total Cost (₹)': parseFloat(totals.total_cost.toFixed(2))
        });

        const dateRangeText = formatExcelDateRange(startDate, endDate);
        const result = exportToExcel(
            excelData,
            'daily_water_purchase_report',
            'Daily Water Purchase',
            'Daily Water Purchase Breakdown Report',
            dateRangeText,
            summaryData
        );

        if (!result.success) {
            setToast({ message: 'Failed to export Excel', type: 'error' });
        }
    };

    // Prepare totals for display and export
    const totals = (data.daily_data || []).reduce((acc, day) => {
        acc.loads += (day.loads || 0);
        acc.corp_vol += (day.breakdown['Corporation Water']?.total_kl || 0);
        acc.corp_cost += (day.breakdown['Corporation Water']?.total_cost || 0);
        acc.drink_vol += (day.breakdown['Drinking Water']?.total_kl || 0);
        acc.drink_cost += (day.breakdown['Drinking Water']?.total_cost || 0);
        acc.normal_vol += (day.breakdown['Normal Water (Salt)']?.total_kl || 0);
        acc.normal_cost += (day.breakdown['Normal Water (Salt)']?.total_cost || 0);
        acc.total_kl += (day.total_kl || 0);
        acc.total_cost += (day.total_cost || 0);
        return acc;
    }, {
        loads: 0, corp_vol: 0, corp_cost: 0, drink_vol: 0, drink_cost: 0,
        normal_vol: 0, normal_cost: 0, total_kl: 0, total_cost: 0
    });

    // Prepare chart data
    const chartData = (data.daily_data || []).map(day => ({
        date: new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        'Corporation (KL)': day.breakdown['Corporation Water']?.total_kl || 0,
        'Drinking (KL)': day.breakdown['Drinking Water']?.total_kl || 0,
        'Normal (KL)': day.breakdown['Normal Water (Salt)']?.total_kl || 0
    }));

    const breakdownChartData = (data.daily_data || []).map(day => ({
        date: new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        'Corporation': day.breakdown['Corporation Water']?.total_cost || 0,
        'Drinking': day.breakdown['Drinking Water']?.total_cost || 0,
        'Normal': day.breakdown['Normal Water (Salt)']?.total_cost || 0,
    }));

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 border border-gray-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Daily Water Purchase</h2>
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

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <>
                    <div id="daily-movement-summaries" className="space-y-6">
                        {/* Consolidated Summary Cards */}
                        {data.summary?.breakdown && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                                ₹{(data.summary.breakdown['Corporation Water']?.total_cost || 0).toFixed(2)}
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
                                                ₹{(data.summary.breakdown['Drinking Water']?.total_cost || 0).toFixed(2)}
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
                                                ₹{(data.summary.breakdown['Normal Water (Salt)']?.total_cost || 0).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Cost Summary */}
                                <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-lg shadow border-2 border-green-100 dark:border-green-900/30 flex flex-col justify-center">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4 border-b border-green-200 dark:border-green-800/50 pb-2">Total Monthly Summary</h3>
                                    <div className="text-center">
                                        <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Cost</h4>
                                        <p className="text-3xl font-black text-green-700 dark:text-green-500 mt-2">
                                            ₹{(data.summary?.total_cost || 0).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Charts Section */}
            {
                data.daily_data && data.daily_data.length > 0 && (
                    <div id="daily-charts-container" className="space-y-6">
                        <div id="daily-movement-chart" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Daily Water Purchased Quantity Wise (KL)</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="date" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="Corporation (KL)" stroke="#3B82F6" strokeWidth={2} />
                                    <Line type="monotone" dataKey="Drinking (KL)" stroke="#10B981" strokeWidth={2} />
                                    <Line type="monotone" dataKey="Normal (KL)" stroke="#F59E0B" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div id="daily-breakdown-chart" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Daily Water Purchased Cost Wise</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={breakdownChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="date" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} formatter={(value) => `₹${value.toLocaleString()}`} />
                                    <Legend />
                                    <Line type="monotone" dataKey="Corporation" stroke="#3B82F6" strokeWidth={2} />
                                    <Line type="monotone" dataKey="Drinking" stroke="#10B981" strokeWidth={2} />
                                    <Line type="monotone" dataKey="Normal" stroke="#F59E0B" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )
            }

            {/* Daily Data Table */}
            <div id="daily-movement-table" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700 overflow-x-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Daily Water Purchase Breakdown</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                            <tr>
                                <th rowSpan="2" className="px-4 py-3 text-left font-medium text-gray-500 dark:text-slate-400 uppercase border dark:border-slate-700">Date</th>
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
                            {data.daily_data && data.daily_data.map((day) => (
                                <tr key={day.date} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-slate-200 border dark:border-slate-700">
                                        {formatDate(day.date)}
                                    </td>

                                    {/* Corporation */}
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-gray-600 dark:text-slate-400 border dark:border-slate-700 bg-blue-50/50 dark:bg-blue-900/10">
                                        {(day.breakdown['Corporation Water']?.total_kl || 0).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-green-600 dark:text-green-400 border dark:border-slate-700 bg-blue-50/50 dark:bg-blue-900/10">
                                        {(day.breakdown['Corporation Water']?.total_cost || 0).toFixed(0)}
                                    </td>

                                    {/* Drinking */}
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-gray-600 dark:text-slate-400 border dark:border-slate-700 bg-green-50/50 dark:bg-green-900/10">
                                        {(day.breakdown['Drinking Water']?.total_kl || 0).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-green-600 dark:text-green-400 border dark:border-slate-700 bg-green-50/50 dark:bg-green-900/10">
                                        {(day.breakdown['Drinking Water']?.total_cost || 0).toFixed(0)}
                                    </td>

                                    {/* Normal */}
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-gray-600 dark:text-slate-400 border dark:border-slate-700 bg-yellow-50/50 dark:bg-yellow-900/10">
                                        {(day.breakdown['Normal Water (Salt)']?.total_kl || 0).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-green-600 dark:text-green-400 border dark:border-slate-700 bg-yellow-50/50 dark:bg-yellow-900/10">
                                        {(day.breakdown['Normal Water (Salt)']?.total_cost || 0).toFixed(0)}
                                    </td>

                                    {/* Total */}
                                    <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-gray-900 dark:text-slate-100 border dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/30">
                                        ₹{day.total_cost.toFixed(0)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100 dark:bg-slate-900 font-bold">
                            <tr>
                                <td className="px-4 py-3 whitespace-nowrap border dark:border-slate-700 text-gray-900 dark:text-slate-100 uppercase">Total</td>
                                {/* Corporation */}
                                <td className="px-4 py-3 whitespace-nowrap text-right border dark:border-slate-700 text-gray-900 dark:text-slate-100 bg-blue-100 dark:bg-blue-900/30">{totals.corp_vol.toFixed(2)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-right border dark:border-slate-700 text-green-700 dark:text-green-400 bg-blue-100 dark:bg-blue-900/30">{totals.corp_cost.toFixed(0)}</td>
                                {/* Drinking */}
                                <td className="px-4 py-3 whitespace-nowrap text-right border dark:border-slate-700 text-gray-900 dark:text-slate-100 bg-green-100 dark:bg-green-900/30">{totals.drink_vol.toFixed(2)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-right border dark:border-slate-700 text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30">{totals.drink_cost.toFixed(0)}</td>
                                {/* Normal */}
                                <td className="px-4 py-3 whitespace-nowrap text-right border dark:border-slate-700 text-gray-900 dark:text-slate-100 bg-yellow-100 dark:bg-yellow-900/30">{totals.normal_vol.toFixed(2)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-right border dark:border-slate-700 text-green-700 dark:text-green-400 bg-yellow-100 dark:bg-yellow-900/30">{totals.normal_cost.toFixed(0)}</td>
                                {/* Final Total */}
                                <td className="px-4 py-3 whitespace-nowrap text-right border dark:border-slate-700 text-green-800 dark:text-green-400 bg-gray-200 dark:bg-slate-800">₹{totals.total_cost.toFixed(0)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default DailyMovement;
