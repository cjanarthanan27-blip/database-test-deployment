import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Toast from './Toast';

const RateDetails = () => {
    const [data, setData] = useState({ vendor_rates: [], internal_rates: [], pipeline_rates: [] });
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('reports/rate-details/');
            setData(response.data);
            setLoading(false);
        } catch (error) {
            setToast({ message: 'Failed to load rate details', type: 'error' });
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow flex flex-col md:flex-row justify-between items-center border border-gray-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Rate Details Report</h2>
                <button
                    onClick={fetchData}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                >
                    Refresh
                </button>
            </div>

            {/* Vendor Rate Details */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700 overflow-x-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 pb-2 border-b dark:border-slate-700">Vendor Rate Details</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                            <tr>
                                <th rowSpan="2" className="px-4 py-3 text-left font-medium text-gray-500 dark:text-slate-400 uppercase border dark:border-slate-700">Vendor Name</th>
                                <th rowSpan="2" className="px-4 py-3 text-center font-medium text-gray-500 dark:text-slate-400 uppercase border dark:border-slate-700">Capacity (L)</th>
                                <th colSpan="3" className="px-4 py-2 text-center font-medium text-gray-500 dark:text-slate-400 uppercase border dark:border-slate-700 bg-yellow-50 dark:bg-yellow-900/20">Normal Water (Salt)</th>
                                <th colSpan="3" className="px-4 py-2 text-center font-medium text-gray-500 dark:text-slate-400 uppercase border dark:border-slate-700 bg-green-50 dark:bg-green-900/20">Drinking Water (RO)</th>
                            </tr>
                            <tr>
                                <th className="px-2 py-2 text-right border dark:border-slate-700 bg-yellow-50 dark:bg-yellow-900/20">Per Load</th>
                                <th className="px-2 py-2 text-right border dark:border-slate-700 bg-yellow-50 dark:bg-yellow-900/20">Per KL</th>
                                <th className="px-2 py-2 text-right border dark:border-slate-700 bg-yellow-50 dark:bg-yellow-900/20">Per Litre</th>
                                <th className="px-2 py-2 text-right border dark:border-slate-700 bg-green-50 dark:bg-green-900/20">Per Load</th>
                                <th className="px-2 py-2 text-right border dark:border-slate-700 bg-green-50 dark:bg-green-900/20">Per KL</th>
                                <th className="px-2 py-2 text-right border dark:border-slate-700 bg-green-50 dark:bg-green-900/20">Per Litre</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {data.vendor_rates.map((v, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-slate-200 border dark:border-slate-700">{v.vendor_name}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center text-gray-600 dark:text-slate-400 border dark:border-slate-700">
                                        {v.normal.capacity || v.drinking.capacity || '-'}
                                    </td>
                                    {/* Normal */}
                                    <td className="px-2 py-3 text-right text-gray-600 dark:text-slate-400 border dark:border-slate-700 bg-yellow-50/30 dark:bg-yellow-900/5">
                                        {v.normal.per_load ? `₹${v.normal.per_load}` : '-'}
                                    </td>
                                    <td className="px-2 py-3 text-right text-gray-600 dark:text-slate-400 border dark:border-slate-700 bg-yellow-50/30 dark:bg-yellow-900/5">
                                        {v.normal.per_kl ? `₹${v.normal.per_kl.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-2 py-3 text-right text-gray-600 dark:text-slate-400 border dark:border-slate-700 bg-yellow-50/30 dark:bg-yellow-900/5">
                                        {v.normal.per_litre ? `₹${v.normal.per_litre.toFixed(4)}` : '-'}
                                    </td>
                                    {/* Drinking */}
                                    <td className="px-2 py-3 text-right text-gray-600 dark:text-slate-400 border dark:border-slate-700 bg-green-50/30 dark:bg-green-900/5">
                                        {v.drinking.per_load ? `₹${v.drinking.per_load}` : '-'}
                                    </td>
                                    <td className="px-2 py-3 text-right text-gray-600 dark:text-slate-400 border dark:border-slate-700 bg-green-50/30 dark:bg-green-900/5">
                                        {v.drinking.per_kl ? `₹${v.drinking.per_kl.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-2 py-3 text-right text-gray-600 dark:text-slate-400 border dark:border-slate-700 bg-green-50/30 dark:bg-green-900/5">
                                        {v.drinking.per_litre ? `₹${v.drinking.per_litre.toFixed(4)}` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rathinam Vehicle Rate Details */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700 overflow-x-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 pb-2 border-b dark:border-slate-700">Rathinam Vehicle Rate Details</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {data.internal_rates.map((vehicle, idx) => (
                        <div key={idx} className="border dark:border-slate-700 rounded-lg overflow-hidden">
                            <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 border-b dark:border-slate-700 flex justify-between">
                                <span className="font-bold text-blue-800 dark:text-blue-300">{vehicle.vehicle_name}</span>
                                <span className="text-sm text-gray-500 dark:text-slate-400">Capacity: {vehicle.capacity} L</span>
                            </div>
                            <table className="min-w-full text-xs">
                                <thead className="bg-gray-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="px-3 py-2 text-left border-b dark:border-slate-700 uppercase">Loading Point</th>
                                        <th className="px-3 py-2 text-right border-b dark:border-slate-700 uppercase">Per Load</th>
                                        <th className="px-3 py-2 text-right border-b dark:border-slate-700 uppercase">Per KL</th>
                                        <th className="px-3 py-2 text-right border-b dark:border-slate-700 uppercase">Per Litre</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-slate-700">
                                    {vehicle.location_rates.map((loc, lIdx) => (
                                        <tr key={lIdx} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                            <td className="px-3 py-2 text-gray-700 dark:text-slate-300">{loc.loading_location}</td>
                                            <td className="px-3 py-2 text-right font-medium text-green-600 dark:text-green-400">
                                                {loc.per_load ? `₹${loc.per_load}` : '-'}
                                            </td>
                                            <td className="px-3 py-2 text-right text-gray-600 dark:text-slate-400">
                                                {loc.per_kl ? `₹${loc.per_kl.toFixed(2)}` : '-'}
                                            </td>
                                            <td className="px-3 py-2 text-right text-gray-600 dark:text-slate-400">
                                                {loc.per_litre ? `₹${loc.per_litre.toFixed(4)}` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            </div>

            {/* Corporation (Pipeline) Rates */}
            {data.pipeline_rates.length > 0 && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 pb-2 border-b dark:border-slate-700">Corporation (Pipeline) Rate Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.pipeline_rates.map((p, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg border dark:border-slate-700">
                                <h4 className="font-bold text-gray-900 dark:text-slate-100 mb-2">{p.source_name}</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-slate-400">Rate Per Litre:</span>
                                        <span className="font-medium text-green-600 dark:text-green-400">₹{p.cost_per_liter.toFixed(4)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-slate-400">Rate Per KL:</span>
                                        <span className="font-medium text-green-600 dark:text-green-400">₹{p.cost_per_kl.toFixed(2)}</span>
                                    </div>
                                    <div className="mt-2 text-[10px] text-gray-400 uppercase">Effective: {p.effective_date}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default RateDetails;
