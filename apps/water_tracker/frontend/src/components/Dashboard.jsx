import React, { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatDate } from '../utils/excelExport';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Multi-month state
    const [multiMonthData, setMultiMonthData] = useState(null);
    const [selectedMonths, setSelectedMonths] = useState(3);
    const [loadingMM, setLoadingMM] = useState(false);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('dashboard-stats');
            setStats(response.data);
            setLoading(false);
        } catch {
            setError('Failed to load dashboard data');
            setLoading(false);
        }
    };

    const fetchMultiMonthData = async (months) => {
        try {
            setLoadingMM(true);
            const response = await api.get('dashboard/multi-month-stats', {
                params: { months }
            });
            setMultiMonthData(response.data);
            setLoadingMM(false);
        } catch {
            console.error('Failed to load multi-month stats');
            setLoadingMM(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchMultiMonthData(selectedMonths);
    }, [selectedMonths]);

    // Heatmap Color Logic
    const getColorScale = (value, max) => {
        if (!value || value === 0) return 'inherit';
        // HSL: 120 (Green) to 0 (Red)
        // We want 120 - (ratio * 120)
        const ratio = Math.min(value / (max || 1), 1);
        const hue = 120 - (ratio * 120);
        return `hsla(${hue}, 70%, 50%, 0.4)`; // Increased opacity for better visibility
    };

    if (loading) return <div className="text-center mt-10">Loading...</div>;
    if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

    // Find Max Value for Heatmap Scaling (Daily)
    const maxKL = stats.monthly_matrix ? Math.max(...stats.monthly_matrix.locations.flatMap(loc => Object.values(loc.daily).map(d => d.volume))) : 0;

    // Find Max Value for Heatmap Scaling (Monthly)
    const maxMonthlyKL = multiMonthData ? Math.max(...multiMonthData.locations.flatMap(loc => Object.values(loc.monthly).map(m => m.volume))) : 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-8 border-b dark:border-gray-700 pb-4">Dashboard</h1>

            <div className="grid grid-cols-1 gap-8">
                {/* Monthly Consumption Matrix Table (Heatmap) */}
                {stats.monthly_matrix && stats.monthly_matrix.locations && stats.monthly_matrix.locations.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                                <span className="w-2 h-6 bg-orange-500 rounded-full mr-3"></span>
                                Daily Water Purchase Details - {stats.monthly_matrix.month_name} {stats.monthly_matrix.year} (KL)
                            </h2>
                            <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800"></span> Low</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800"></span> High</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-collapse">
                                <thead className="bg-gray-100/50 dark:bg-gray-900/50">
                                    <tr>
                                        <th scope="col" className="sticky left-0 z-20 bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest border-r border-gray-200 dark:border-gray-700">
                                            Locations
                                        </th>
                                        {stats.monthly_matrix.days.map(day => (
                                            <th key={day} scope="col" className="px-1 py-3 text-center text-[10px] font-bold text-gray-500 dark:text-gray-400 border-r border-gray-150 dark:border-gray-700 min-w-[42px]">
                                                {day}
                                            </th>
                                        ))}
                                        <th scope="col" className="px-4 py-3 text-center text-xs font-black text-gray-800 dark:text-white uppercase bg-gray-200/50 dark:bg-gray-800/50 sticky right-0 z-20 backdrop-blur">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                                    {stats.monthly_matrix.locations.map((loc, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                            <td className="sticky left-0 z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                <Link
                                                    to={`/entries?unloading_location=${loc.location_id}&water_type=Normal Water (Salt)`}
                                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    {loc.location}
                                                </Link>
                                            </td>
                                            {stats.monthly_matrix.days.map(day => {
                                                const data = loc.daily[day];
                                                const val = data.volume;
                                                const comments = data.comments || [];
                                                return (
                                                    <td
                                                        key={day}
                                                        style={{ backgroundColor: getColorScale(val, maxKL) }}
                                                        title={comments.length > 0 ? `Comments:\n${comments.join('\n')}` : ''}
                                                        className={`px-1 py-3 whitespace-nowrap text-[11px] font-medium text-center border-r border-gray-50 dark:border-gray-700 ${comments.length > 0 ? 'cursor-help ring-1 ring-inset ring-orange-400/30' : ''} ${val > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}
                                                    >
                                                        {val > 0 ? val.toFixed(1) : '-'}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-black text-center text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 sticky right-0 z-10 backdrop-blur border-l border-blue-100 dark:border-blue-900/30">
                                                {loc.total.toFixed(1)}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Totals Row */}
                                    <tr className="bg-gray-900 dark:bg-black text-white font-bold">
                                        <td className="sticky left-0 z-10 bg-gray-900 dark:bg-black px-4 py-4 whitespace-nowrap text-sm tracking-wider border-r border-gray-700 dark:border-gray-800">
                                            DAILY TOTAL
                                        </td>
                                        {stats.monthly_matrix.days.map(day => (
                                            <td key={day} className="px-1 py-4 whitespace-nowrap text-[11px] text-center border-r border-gray-800 dark:border-gray-900 font-bold text-blue-300 dark:text-blue-400">
                                                {stats.monthly_matrix.daily_totals[day] > 0 ? stats.monthly_matrix.daily_totals[day].toFixed(1) : '-'}
                                            </td>
                                        ))}
                                        <td className="px-4 py-4 whitespace-nowrap text-base font-black text-center bg-blue-600 dark:bg-blue-700 text-white sticky right-0 z-20 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.3)]">
                                            {stats.monthly_matrix.grand_total.toFixed(1)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Multi-Month Purchase Details Matrix */}
                {multiMonthData && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                                <span className="w-2 h-6 bg-purple-600 rounded-full mr-3"></span>
                                Monthly Water Purchase Details
                            </h2>
                            <div className="flex items-center gap-4">
                                <select
                                    value={selectedMonths}
                                    onChange={(e) => setSelectedMonths(Number(e.target.value))}
                                    className="block w-40 pl-3 pr-10 py-2 text-sm border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-gray-700 shadow-sm font-bold text-gray-700 dark:text-gray-200"
                                >
                                    <option value={3}>Last 3 Months</option>
                                    <option value={6}>Last 6 Months</option>
                                    <option value={12}>Last 12 Months</option>
                                    <option value={24}>Last 24 Months</option>
                                </select>
                                {loadingMM && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                                )}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-collapse">
                                <thead className="bg-gray-100/50 dark:bg-gray-900/50">
                                    <tr>
                                        <th scope="col" className="sticky left-0 z-20 bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest border-r border-gray-200 dark:border-gray-700">
                                            Locations
                                        </th>
                                        <th scope="col" className="px-3 py-4 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-150 dark:border-gray-700">
                                            Metric
                                        </th>
                                        {multiMonthData.months.map(m => (
                                            <th key={m.key} scope="col" className="px-4 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 border-r border-gray-150 dark:border-gray-700 min-w-[120px]">
                                                {m.label}
                                            </th>
                                        ))}
                                        <th scope="col" className="px-6 py-4 text-center text-xs font-black text-gray-800 dark:text-white uppercase bg-gray-200/50 dark:bg-gray-800/50 sticky right-0 z-20 backdrop-blur">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                                    {multiMonthData.locations.map((loc, idx) => (
                                        <React.Fragment key={idx}>
                                            {/* Quantity Row */}
                                            <tr className="hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-colors">
                                                <td rowSpan="2" className="sticky left-0 z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                    {loc.location}
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10 border-r border-gray-100 dark:border-gray-700">
                                                    Qty (L)
                                                </td>
                                                {multiMonthData.months.map(m => {
                                                    const data = loc.monthly[m.key] || { volume: 0, cost: 0 };
                                                    const val = data.volume;
                                                    return (
                                                        <td
                                                            key={m.key}
                                                            style={{ backgroundColor: getColorScale(val, maxMonthlyKL) }}
                                                            className="px-4 py-3 whitespace-nowrap text-center border-r border-gray-50 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white"
                                                        >
                                                            {val > 0 ? (val * 1000).toLocaleString() + ' L' : '-'}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-6 py-3 whitespace-nowrap text-sm font-black text-center text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 sticky right-0 z-10 backdrop-blur border-l border-purple-100 dark:border-purple-900/30">
                                                    {(loc.total.volume * 1000).toLocaleString()} L
                                                </td>
                                            </tr>
                                            {/* Amount Row */}
                                            <tr className="hover:bg-green-50/30 dark:hover:bg-green-900/10 transition-colors border-b border-gray-100 dark:border-gray-700">
                                                <td className="px-3 py-3 whitespace-nowrap text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50/30 dark:bg-green-900/10 border-r border-gray-100 dark:border-gray-700">
                                                    Amount
                                                </td>
                                                {multiMonthData.months.map(m => {
                                                    const data = loc.monthly[m.key] || { volume: 0, cost: 0 };
                                                    const cost = data.cost;
                                                    return (
                                                        <td
                                                            key={m.key}
                                                            className="px-4 py-3 whitespace-nowrap text-center border-r border-gray-50 dark:border-gray-700 text-[11px] font-medium text-green-600 dark:text-green-400 bg-green-50/10 dark:bg-green-900/5"
                                                        >
                                                            {cost > 0 ? '₹' + cost.toLocaleString() : '-'}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-6 py-3 whitespace-nowrap text-[11px] font-bold text-center text-green-700 dark:text-green-300 bg-green-50/50 dark:bg-green-900/40 sticky right-0 z-10 backdrop-blur border-l border-green-100 dark:border-green-900/30">
                                                    ₹{loc.total.cost.toLocaleString()}
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                    {/* Monthly Totals Header Row (Implicit) */}
                                    <tr className="bg-gray-900 text-white font-bold">
                                        <td rowSpan="2" className="sticky left-0 z-10 bg-gray-900 px-6 py-4 whitespace-nowrap text-sm tracking-wider border-r border-gray-700">
                                            MONTHLY TOTAL
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-[10px] font-bold text-blue-300 bg-gray-800 border-r border-gray-700">
                                            Qty (L)
                                        </td>
                                        {multiMonthData.months.map(m => (
                                            <td key={m.key} className="px-4 py-3 whitespace-nowrap text-sm text-center border-r border-gray-800 font-bold text-purple-300">
                                                {(multiMonthData.monthly_totals[m.key].volume * 1000).toLocaleString()} L
                                            </td>
                                        ))}
                                        <td className="px-6 py-3 whitespace-nowrap text-sm font-black text-center bg-purple-600 text-white sticky right-0 z-20 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.3)] border-l border-purple-500">
                                            {(multiMonthData.grand_total.volume * 1000).toLocaleString()} L
                                        </td>
                                    </tr>
                                    <tr className="bg-gray-900 text-white font-bold">
                                        <td className="px-3 py-3 whitespace-nowrap text-[10px] font-bold text-green-400 bg-gray-800 border-r border-gray-700">
                                            Amount
                                        </td>
                                        {multiMonthData.months.map(m => (
                                            <td key={m.key} className="px-4 py-3 whitespace-nowrap text-[11px] text-center border-r border-gray-800 font-bold text-green-400">
                                                ₹{multiMonthData.monthly_totals[m.key].cost.toLocaleString()}
                                            </td>
                                        ))}
                                        <td className="px-6 py-3 whitespace-nowrap text-[11px] font-black text-center bg-green-600 text-white sticky right-0 z-20 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.3)] border-l border-green-500">
                                            ₹{multiMonthData.grand_total.cost.toLocaleString()}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Water Purchase Type Summary Table */}
            <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                        <span className="w-2 h-6 bg-blue-500 rounded-full mr-3"></span>
                        Water Purchase Summary ({new Date().toLocaleString('default', { month: 'short' })} '{new Date().getFullYear()})
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Water Type</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total (KL)</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total (Liters)</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Cost</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {stats.breakdown && stats.breakdown.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-200">
                                        <Link
                                            to={`/entries?water_type=${item.type}`}
                                            className="text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            {item.type}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{item.volume_kl.toFixed(1)} KL</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{item.liters.toLocaleString()} L</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 dark:text-green-400">
                                        ₹{item.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-blue-50/30 dark:bg-blue-900/20 font-black">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white uppercase">Total</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700 dark:text-blue-400">{stats.total_volume_kl.toFixed(1)} KL</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700 dark:text-blue-400">{stats.total_volume_liters.toLocaleString()} L</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700 dark:text-green-400">
                                    ₹{stats.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Building Wise Breakdowns */}
            <div className="grid grid-cols-1 gap-12 mt-12 pb-12">
                {/* Normal Water Breakdown */}
                {stats.normal_water_breakdown && stats.normal_water_breakdown.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Muthu Nagar Well Water Yield Details</h2>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">12 KL</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">6 KL</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Total Liters</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Total Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {stats.normal_water_breakdown.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                                        <td className="px-6 py-4 text-sm font-semibold dark:text-gray-200">
                                            <Link
                                                to={`/entries?unloading_location=${item.location_id}&water_type=Normal Water (Salt)`}
                                                className="text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                {item.location}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-sm dark:text-gray-400">{item.count_12kl}</td>
                                        <td className="px-6 py-4 text-sm dark:text-gray-400">{item.count_6kl}</td>
                                        <td className="px-6 py-4 text-sm dark:text-gray-400">{item.total_liters.toLocaleString()} L</td>
                                        <td className="px-6 py-4 text-sm font-bold text-green-600 dark:text-green-400">₹{item.total_amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Recent Activity</h2>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Source / Location</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Vehicle</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Volume</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Cost</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {stats.recent_activity.map((entry, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(entry.date)}</td>
                                    <td className="px-6 py-4 text-sm font-semibold dark:text-gray-200">{entry.source}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{entry.vehicle}</td>
                                    <td className="px-6 py-4 text-sm dark:text-gray-300">{entry.volume}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-green-600 dark:text-green-400">₹{entry.cost}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
