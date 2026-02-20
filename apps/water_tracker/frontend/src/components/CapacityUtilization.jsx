import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Toast from './Toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportReportToPDF, formatDateRange } from '../utils/pdfExport';
import { exportToExcel, formatDateRange as formatExcelDateRange } from '../utils/excelExport';

const CapacityUtilization = () => {
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
            setLoading(true);
            const response = await api.get('reports/capacity-utilization', {
                params: { start_date: startDate, end_date: endDate }
            });
            const responseData = response.data.results || response.data;
            setData(responseData);
            setLoading(false);
        } catch (err) {
            console.error('Capacity Utilization Error:', err.response?.data || err.message);
            setToast({ message: `Failed to load report: ${err.response?.data?.error || err.message}`, type: 'error' });
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchData]);

    const handleExportPDF = async () => {
        const dateRangeText = formatDateRange(startDate, endDate);
        const result = await exportReportToPDF(
            'Capacity Utilization Report',
            dateRangeText,
            'capacity-utilization-chart',
            'capacity-utilization-table',
            'capacity_utilization_report'
        );
        if (!result.success) {
            setToast({ message: 'Failed to export PDF', type: 'error' });
        }
    };

    const handleExportExcel = () => {
        const excelData = data.map(vehicle => ({
            'Vehicle Number': vehicle.vehicle_number,
            'Capacity (KL)': vehicle.capacity_kl,
            'Total Delivered (KL)': parseFloat(vehicle.total_delivered_kl.toFixed(2)),
            'Utilization %': parseFloat(vehicle.utilization_percentage.toFixed(1))
        }));

        const dateRangeText = formatExcelDateRange(startDate, endDate);
        const result = exportToExcel(
            excelData,
            'capacity_utilization_report',
            'Capacity Utilization',
            'Capacity Utilization Report',
            dateRangeText
        );

        if (!result.success) {
            setToast({ message: 'Failed to export Excel', type: 'error' });
        }
    };

    const avgUtilization = data.length > 0
        ? (data.reduce((acc, v) => acc + v.utilization_percentage, 0) / data.length).toFixed(1)
        : 0;

    if (loading) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="space-y-6">
            {/* Header with Export Buttons */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Capacity Utilization</h2>
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

            {/* Summary */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-100 dark:border-slate-700">
                <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Average Capacity Utilization</h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{avgUtilization}%</p>
            </div>

            {/* Capacity Utilization Chart */}
            {data.length > 0 && (
                <div id="capacity-utilization-chart" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vehicle Capacity Utilization Overview</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.map(vehicle => {
                            const name = vehicle.vehicle_name || 'Unknown';
                            return {
                                name: name.length > 15 ? name.substring(0, 12) + '...' : name,
                                'Utilization %': vehicle.utilization_percentage || 0,
                                'Capacity (KL)': (vehicle.capacity_liters || 0) / 1000,
                                'Avg Load (KL)': (vehicle.avg_load_liters || 0) / 1000
                            };
                        })}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} />
                            <Legend />
                            <Bar dataKey="Utilization %" fill="#3B82F6" />
                            <Bar dataKey="Capacity (KL)" fill="#10B981" />
                            <Bar dataKey="Avg Load (KL)" fill="#F59E0B" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Capacity Table */}
            <div id="capacity-utilization-table" className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vehicle Capacity Utilization</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Vehicle</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Capacity (L)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Avg Load (L)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Utilization %</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Trips</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {data.map((vehicle, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{vehicle.vehicle_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{vehicle.capacity_liters.toFixed(0)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{vehicle.avg_load_liters}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center">
                                            <span className={`font-bold ${vehicle.utilization_percentage >= 80 ? 'text-green-600 dark:text-green-400' :
                                                vehicle.utilization_percentage >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                                                    'text-red-600 dark:text-red-400'
                                                }`}>
                                                {vehicle.utilization_percentage}%
                                            </span>
                                            <div className="ml-2 w-24 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${vehicle.utilization_percentage >= 80 ? 'bg-green-600' :
                                                        vehicle.utilization_percentage >= 60 ? 'bg-yellow-600' :
                                                            'bg-red-600'
                                                        }`}
                                                    style={{ width: `${Math.min(vehicle.utilization_percentage, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{vehicle.trips}</td>
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

export default CapacityUtilization;
