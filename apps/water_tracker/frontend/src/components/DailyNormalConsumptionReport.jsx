import React, { useState, useEffect, useCallback } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import Toast from './Toast';
import { exportReportToPDF, formatDateRange } from '../utils/pdfExport';
import { exportToExcel, formatDateRange as formatExcelDateRange, formatDate } from '../utils/excelExport';

const DailyNormalConsumptionReport = () => {
    const [data, setData] = useState({ daily_data: [], summary: {}, location_names: [] });
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [visibleLines, setVisibleLines] = useState({ total_kl: true });
    const [exporting, setExporting] = useState(false);
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(1); // Start of current month
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('reports/daily-normal-consumption/', {
                params: {
                    start_date: startDate,
                    end_date: endDate
                }
            });
            setData(response.data);
            // Initialize visibleLines for new locations
            setVisibleLines(prev => {
                const newState = { ...prev };
                response.data.location_names.forEach(loc => {
                    if (newState[loc] === undefined) newState[loc] = true;
                });
                return newState;
            });
        } catch (error) {
            console.error('Error fetching consumption data:', error);
            setToast({ message: 'Failed to fetch consumption data', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleExportExcel = () => {
        // Headers: Location, Date1, Date2, ..., Total (KL)
        const worksheetData = [];

        // Rows for each location
        data.location_names.forEach(loc => {
            const row = { 'Location': loc };
            data.daily_data.forEach(item => {
                row[formatDate(item.date)] = item.breakdown[loc]?.consumption_kl || 0;
            });
            row['Total (KL)'] = data.summary.breakdown[loc]?.total_kl || 0;
            worksheetData.push(row);
        });

        // Final total row
        const totalRow = { 'Location': 'Total' };
        data.daily_data.forEach(item => {
            totalRow[formatDate(item.date)] = item.total_kl || 0;
        });
        totalRow['Total (KL)'] = data.summary.total_kl || 0;
        worksheetData.push(totalRow);

        const summaryData = [
            ['Total Period Consumption (KL)', data.summary.total_kl?.toFixed(2) || '0.00']
        ];

        data.location_names.forEach(loc => {
            summaryData.push([`${loc} Total (KL)`, data.summary.breakdown[loc]?.total_kl?.toFixed(2) || '0.00']);
        });

        exportToExcel(
            worksheetData,
            'Daily_Normal_Consumption_Report',
            'Daily Consumption',
            'Daily Normal Water Consumption Report',
            formatExcelDateRange(startDate, endDate),
            summaryData
        );
    };

    const handleExportPDF = async () => {
        setExporting(true);
        try {
            await exportReportToPDF(
                'Daily Normal Water Consumption Report',
                formatDateRange(startDate, endDate),
                'daily-consumption-charts',
                'daily-consumption-table',
                'Daily_Normal_Consumption_Report',
                'daily-consumption-summaries'
            );
        } catch (error) {
            console.error('PDF Export Error:', error);
            setToast({ message: 'Failed to export PDF', type: 'error' });
        } finally {
            setExporting(false);
        }
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-800 p-4 border border-gray-200 dark:border-slate-700 shadow-lg rounded-lg">
                    <p className="font-bold text-gray-900 dark:text-slate-100 mb-2">{formatDate(label)}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            {entry.name}: {entry.value.toFixed(2)} KL
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 border border-gray-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Daily Normal Water Consumption</h2>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">From:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">To:</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleExportExcel}
                            disabled={exporting}
                            className={`flex items-center space-x-1 ${exporting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white px-3 py-2 rounded-md transition`}
                        >
                            <span>{exporting ? '...' : 'Excel'}</span>
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={exporting}
                            className={`flex items-center space-x-1 ${exporting ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'} text-white px-3 py-2 rounded-md transition`}
                        >
                            <span>{exporting ? 'Exporting...' : 'PDF'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <>
                    {/* Compact Summary Section */}
                    <div id="daily-consumption-summaries" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Primary Total Card */}
                            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl shadow-lg border border-blue-500/20 text-white">
                                <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Total Period Consumption</p>
                                <div className="flex items-baseline space-x-2">
                                    <h3 className="text-4xl font-extrabold">{data.summary.total_kl?.toFixed(2)}</h3>
                                    <span className="text-blue-200 font-semibold italic">KL</span>
                                </div>
                                <div className="mt-4 flex items-center text-blue-100 text-xs bg-white/10 w-fit px-2 py-1 rounded-full">
                                    <span className="mr-1">📍</span> {data.location_names.length} Active Locations
                                </div>
                            </div>

                            {/* Top 3 Highlights */}
                            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-gray-200 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Top 3 Consuming Sites</h4>
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Insights</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {data.location_names
                                        .map(loc => ({ name: loc, val: data.summary.breakdown[loc]?.total_kl || 0 }))
                                        .sort((a, b) => b.val - a.val)
                                        .slice(0, 3)
                                        .map((loc, idx) => (
                                            <div key={idx} className="relative overflow-hidden bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg border border-gray-100 dark:border-slate-700 group hover:border-blue-500/30 transition-all">
                                                <div className="absolute -right-2 -top-2 text-4xl font-black text-gray-200/20 dark:text-slate-700/20 group-hover:text-blue-500/10 transition-colors">
                                                    #{idx + 1}
                                                </div>
                                                <p className="text-xs font-bold text-gray-400 dark:text-slate-500 truncate mb-1" title={loc.name}>
                                                    {loc.name.replace(/\s+consumption/i, '')}
                                                </p>
                                                <div className="flex items-baseline space-x-1">
                                                    <span className="text-xl font-bold text-gray-900 dark:text-slate-100">{loc.val.toFixed(1)}</span>
                                                    <span className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase">KL</span>
                                                </div>
                                                <div className="mt-2 w-full bg-gray-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-blue-600 h-full rounded-full"
                                                        style={{ width: `${(loc.val / data.summary.total_kl) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Compact Badge Grid for all locations */}
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow border border-gray-200 dark:border-slate-700">
                            <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Location-wise Breakdown</h4>
                            <div className="flex flex-wrap gap-2">
                                {data.location_names.map((loc, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-800 group hover:shadow-sm transition-all"
                                    >
                                        <span className="text-xs font-medium text-gray-600 dark:text-slate-400 whitespace-nowrap">
                                            {loc.replace(/\s+consumption/i, '')}
                                        </span>
                                        <div className="flex items-center space-x-1">
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                {data.summary.breakdown[loc]?.total_kl?.toFixed(1)}
                                            </span>
                                            <span className="text-[9px] font-bold text-gray-400 dark:text-slate-600 uppercase">KL</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div id="daily-consumption-charts" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Consumption Trend (KL)</h3>

                            {/* Visibility Controls */}
                            <div className="flex flex-wrap items-center gap-3 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mr-2">Show/Hide:</span>
                                <label className="flex items-center space-x-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={visibleLines.total_kl}
                                        onChange={() => setVisibleLines(prev => ({ ...prev, total_kl: !prev.total_kl }))}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-slate-600"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Total</span>
                                </label>
                                {data.location_names.map((loc, idx) => (
                                    <label key={idx} className="flex items-center space-x-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={visibleLines[loc]}
                                            onChange={() => setVisibleLines(prev => ({ ...prev, [loc]: !prev[loc] }))}
                                            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 dark:border-slate-600"
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:emerald-600 dark:group-hover:text-emerald-400 transition-colors">{loc}</span>
                                    </label>
                                ))}
                                <div className="h-4 w-px bg-gray-300 dark:bg-slate-700 mx-1"></div>
                                <button
                                    onClick={() => {
                                        const newState = { total_kl: true };
                                        data.location_names.forEach(l => newState[l] = true);
                                        setVisibleLines(newState);
                                    }}
                                    className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => {
                                        const newState = { total_kl: false };
                                        data.location_names.forEach(l => newState[l] = false);
                                        setVisibleLines(newState);
                                    }}
                                    className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                                >
                                    None
                                </button>
                            </div>
                        </div>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.daily_data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.1} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickFormatter={(str) => formatDate(str)}
                                    />
                                    <YAxis stroke="#94a3b8" fontSize={12} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    {visibleLines.total_kl && (
                                        <Line
                                            type="monotone"
                                            dataKey="total_kl"
                                            name="Total Consumption"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    )}
                                    {data.location_names.map((loc, idx) => visibleLines[loc] && (
                                        <Line
                                            key={idx}
                                            type="monotone"
                                            dataKey={`breakdown.${loc}.consumption_kl`}
                                            name={loc}
                                            stroke={[
                                                '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'
                                            ][idx % 5]}
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Transposed Table Section */}
                    <div id="daily-consumption-table" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700 overflow-x-auto">
                        <div className="flex items-center space-x-2 mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Daily Breakdown (KL)</h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead className="bg-gray-50 dark:bg-slate-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-slate-700 z-10">Location</th>
                                    {data.daily_data.map((item, idx) => (
                                        <th key={idx} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">{formatDate(item.date)}</th>
                                    ))}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider font-bold bg-blue-50 dark:bg-blue-900/30">Total (KL)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                {/* Location Rows */}
                                {data.location_names.map((loc, locIdx) => (
                                    <tr key={locIdx} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition font-medium">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-800 z-10">{loc}</td>
                                        {data.daily_data.map((day, dayIdx) => (
                                            <td key={dayIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300">
                                                {(day.breakdown[loc]?.consumption_kl || 0).toFixed(2)}
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/30 dark:bg-emerald-900/10">
                                            {data.summary.breakdown[loc]?.total_kl?.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}

                                {/* Final Total Row */}
                                <tr className="bg-blue-50 dark:bg-blue-900/20 font-bold border-t-2 border-blue-200 dark:border-blue-800">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-800 dark:text-blue-300 sticky left-0 bg-blue-50 dark:bg-blue-900/20 z-10">Daily Total (KL)</td>
                                    {data.daily_data.map((day, dayIdx) => (
                                        <td key={dayIdx} className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                                            {day.total_kl.toFixed(2)}
                                        </td>
                                    ))}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-800 dark:text-blue-300 text-lg">
                                        {data.summary.total_kl?.toFixed(2)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </>
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default DailyNormalConsumptionReport;
