import React, { useState, useEffect, useCallback } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import Toast from './Toast';
import { exportReportToPDF, formatDateRange } from '../utils/pdfExport';
import { exportToExcel, formatDateRange as formatExcelDateRange, formatDate } from '../utils/excelExport';

const DailyYieldReport = () => {
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
            const response = await api.get('reports/daily-yield/', {
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
            console.error('Error fetching yield data:', error);
            setToast({ message: 'Failed to fetch yield data', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleExportExcel = () => {
        const worksheetData = data.daily_data.map(item => {
            const row = {
                Date: formatDate(item.date),
            };
            data.location_names.forEach(loc => {
                row[`${loc} (KL)`] = item.breakdown[loc]?.yield_kl || 0;
            });
            row['Total Yield (KL)'] = item.total_kl;
            return row;
        });

        // Add Total row to Excel
        if (worksheetData.length > 0) {
            const totalRow = {
                Date: 'Total',
            };
            data.location_names.forEach(loc => {
                totalRow[`${loc} (KL)`] = data.summary.breakdown[loc]?.total_kl || 0;
            });
            totalRow['Total Yield (KL)'] = data.summary.total_kl;
            worksheetData.push(totalRow);
        }

        const summaryData = [
            ['Total Period Yield (KL)', data.summary.total_kl?.toFixed(2) || '0.00']
        ];

        data.location_names.forEach(loc => {
            summaryData.push([`${loc} Total (KL)`, data.summary.breakdown[loc]?.total_kl?.toFixed(2) || '0.00']);
        });

        exportToExcel(
            worksheetData,
            'Daily_Yield_Report',
            'Daily Yield',
            'Daily Yield Tracking Report',
            formatExcelDateRange(startDate, endDate),
            summaryData
        );
    };

    const handleExportPDF = async () => {
        setExporting(true);
        try {
            await exportReportToPDF(
                'Daily Yield Tracking Report',
                formatDateRange(startDate, endDate),
                'daily-yield-charts',
                'daily-yield-table',
                'Daily_Yield_Report',
                'daily-yield-summaries'
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Daily Yield Tracking</h2>

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
                    {/* Summary Cards */}
                    <div id="daily-yield-summaries" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Total Period Yield</p>
                            <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {data.summary.total_kl?.toFixed(2)} <span className="text-sm font-normal text-gray-500">KL</span>
                            </h3>
                        </div>
                        {data.location_names.map((loc, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{loc} Yield</p>
                                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {data.summary.breakdown[loc]?.total_kl?.toFixed(2)} <span className="text-sm font-normal text-gray-500">KL</span>
                                </h3>
                            </div>
                        ))}
                    </div>

                    {/* Chart Section */}
                    <div id="daily-yield-charts" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Yield Trend (KL)</h3>

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
                                            name="Total Yield"
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
                                            dataKey={`breakdown.${loc}.yield_kl`}
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

                    {/* Table Section */}
                    <div id="daily-yield-table" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700 overflow-x-auto">
                        <div className="flex items-center space-x-2 mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Daily Breakdown</h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead className="bg-gray-50 dark:bg-slate-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Date</th>
                                    {data.location_names.map((loc, idx) => (
                                        <th key={idx} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">{loc} (KL)</th>
                                    ))}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Total Yield (KL)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                {data.daily_data.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-100">{formatDate(item.date)}</td>
                                        {data.location_names.map((loc, lIdx) => (
                                            <td key={lIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300">
                                                {(item.breakdown[loc]?.yield_kl || 0).toFixed(2)}
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 font-bold">{item.total_kl.toFixed(2)}</td>
                                    </tr>
                                ))}
                                {data.daily_data.length > 0 && (
                                    <tr className="bg-gray-100 dark:bg-slate-700 font-bold border-t-2 border-gray-300 dark:border-slate-600">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">Total</td>
                                        {data.location_names.map((loc, idx) => (
                                            <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">
                                                {data.summary.breakdown[loc]?.total_kl?.toFixed(2)}
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">{data.summary.total_kl?.toFixed(2)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default DailyYieldReport;
