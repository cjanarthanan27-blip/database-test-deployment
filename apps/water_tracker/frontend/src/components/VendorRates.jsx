import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from './Modal';
import Toast from './Toast';

const VendorRates = () => {
    const [rates, setRates] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRate, setEditingRate] = useState(null);
    const [toast, setToast] = useState(null);
    const [filterVendor, setFilterVendor] = useState('');

    const [formData, setFormData] = useState({
        source: '',
        effective_date: new Date().toISOString().split('T')[0],
        cost_type: 'Per_Liter',
        water_type: 'Drinking Water',
        rate_value: '',
        vehicle_ref_id: '',
        vehicle_capacity: '',
        calculated_cost_per_kl: ''
    });

    // Auto-calculate KL rate
    useEffect(() => {
        if (formData.cost_type === 'Per_Load' && formData.rate_value && formData.vehicle_capacity) {
            const klRate = (parseFloat(formData.rate_value) / parseFloat(formData.vehicle_capacity)) * 1000;
            setFormData(prev => {
                if (prev.calculated_cost_per_kl === klRate.toFixed(4)) return prev;
                return { ...prev, calculated_cost_per_kl: klRate.toFixed(4) };
            });
        } else if (formData.cost_type === 'Per_Liter' && formData.rate_value) {
            const klRate = parseFloat(formData.rate_value) * 1000;
            setFormData(prev => {
                if (prev.calculated_cost_per_kl === klRate.toFixed(4)) return prev;
                return { ...prev, calculated_cost_per_kl: klRate.toFixed(4) };
            });
        } else {
            setFormData(prev => {
                if (prev.calculated_cost_per_kl === '') return prev;
                return { ...prev, calculated_cost_per_kl: '' };
            });
        }
    }, [formData.cost_type, formData.rate_value, formData.vehicle_capacity]);

    const fetchData = useCallback(async () => {
        try {
            const [ratesRes, sourcesRes, vehiclesRes] = await Promise.all([
                api.get('rates/vendor/'),
                api.get('sources/'),
                api.get('internal-vehicles/')
            ]);
            // Handle paginated responses
            setRates(ratesRes.data.results || ratesRes.data);
            const sources = sourcesRes.data.results || sourcesRes.data;
            setVendors(sources.filter(s => s.source_type === 'Vendor'));
            setVehicles(vehiclesRes.data.results || vehiclesRes.data);
            setLoading(false);
        } catch {
            setToast({ message: 'Failed to load data', type: 'error' });
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAdd = () => {
        setEditingRate(null);
        setFormData({
            source: '',
            effective_date: new Date().toISOString().split('T')[0],
            cost_type: 'Per_Liter',
            water_type: 'Drinking Water',
            rate_value: '',
            vehicle_ref_id: '',
            vehicle_capacity: '',
            calculated_cost_per_kl: ''
        });
        setShowModal(true);
    };

    const handleEdit = (rate) => {
        setEditingRate(rate);
        setFormData({
            source: rate.source,
            effective_date: rate.effective_date,
            cost_type: rate.cost_type,
            water_type: rate.water_type || 'Drinking Water',
            rate_value: rate.rate_value || '',
            vehicle_ref_id: rate.vehicle_ref_id || '',
            vehicle_capacity: rate.vehicle_capacity || '',
            calculated_cost_per_kl: rate.calculated_cost_per_kl || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this rate?')) return;

        try {
            await api.delete(`rates/vendor/${id}/`);
            setToast({ message: 'Rate deleted successfully', type: 'success' });
            fetchData();
        } catch {
            setToast({ message: 'Failed to delete rate', type: 'error' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                ...formData,
                // Ensure vehicle_capacity is null if empty string
                vehicle_capacity: formData.vehicle_capacity || null,
            };

            if (editingRate) {
                await api.put(`rates/vendor/${editingRate.id}/`, payload);
                setToast({ message: 'Rate updated successfully', type: 'success' });
            } else {
                await api.post('rates/vendor/', payload);
                setToast({ message: 'Rate added successfully', type: 'success' });
            }
            setShowModal(false);
            fetchData();
        } catch {
            setToast({ message: 'Failed to save rate', type: 'error' });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Auto-populate vehicle capacity when vehicle is selected
        if (name === 'vehicle_ref_id' && value) {
            const selectedVehicle = vehicles.find(v => v.id === parseInt(value));
            setFormData({
                ...formData,
                vehicle_ref_id: value,
                vehicle_capacity: selectedVehicle ? selectedVehicle.capacity_liters : ''
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const getVendorName = (sourceId) => {
        const vendor = vendors.find(v => v.id === sourceId);
        return vendor ? vendor.source_name : 'Unknown';
    };

    const getRateStatus = (effectiveDate) => {
        const today = new Date().toISOString().split('T')[0];
        if (effectiveDate <= today) {
            return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Active</span>;
        } else {
            return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Future</span>;
        }
    };

    const filteredRates = filterVendor
        ? rates.filter(r => r.source === parseInt(filterVendor))
        : rates;

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Vendor Rates</h2>
                    <p className="text-gray-600 dark:text-slate-400 mt-1">Manage pricing for water vendors</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    + Add Rate
                </button>
            </div>

            {/* Filter */}
            <div className="mb-4">
                <select
                    value={filterVendor}
                    onChange={(e) => setFilterVendor(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 dark:text-slate-200"
                >
                    <option value="">All Vendors</option>
                    {vendors.map(vendor => (
                        <option key={vendor.id} value={vendor.id}>
                            {vendor.source_name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Vendor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Water Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Effective Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Cost Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Rate</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Cost per Liter</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Cost per KL</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                        {filteredRates.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="px-6 py-4 text-center text-gray-500 dark:text-slate-500">
                                    No rates found
                                </td>
                            </tr>
                        ) : (
                            filteredRates.map(rate => (
                                <tr key={rate.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900 dark:text-slate-200">{getVendorName(rate.source)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-slate-400">
                                        {rate.water_type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-slate-400">
                                        {rate.effective_date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-slate-400">
                                        <span className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300">
                                            {rate.cost_type === 'Per_Liter' ? 'Per Liter' : 'Per Load'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-slate-200">
                                        ₹{parseFloat(rate.rate_value).toFixed(2)}
                                        {rate.cost_type === 'Per_Load' && rate.vehicle_capacity && (
                                            <span className="text-xs text-gray-500 dark:text-slate-500 ml-1">
                                                ({rate.vehicle_capacity}L)
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-slate-200">
                                        {rate.calculated_cost_per_kl ? `₹${(parseFloat(rate.calculated_cost_per_kl) / 1000).toFixed(4)}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-slate-200 font-medium">
                                        {rate.calculated_cost_per_kl ? `₹${parseFloat(rate.calculated_cost_per_kl).toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getRateStatus(rate.effective_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => handleEdit(rate)}
                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(rate.id)}
                                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <Modal isOpen={true} onClose={() => setShowModal(false)} title={editingRate ? 'Edit Rate' : 'Add Rate'}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Vendor *
                            </label>
                            <select
                                name="source"
                                value={formData.source}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-100"
                            >
                                <option value="">Select Vendor</option>
                                {vendors.map(vendor => (
                                    <option key={vendor.id} value={vendor.id}>
                                        {vendor.source_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Water Type *
                            </label>
                            <select
                                name="water_type"
                                value={formData.water_type}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-100"
                            >
                                <option value="Drinking Water">Drinking Water</option>
                                <option value="Normal Water (Salt)">Normal Water (Salt)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Effective Date *
                            </label>
                            <input
                                type="date"
                                name="effective_date"
                                value={formData.effective_date}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-100"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Cost Type *
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center text-gray-700 dark:text-slate-300">
                                    <input
                                        type="radio"
                                        name="cost_type"
                                        value="Per_Liter"
                                        checked={formData.cost_type === 'Per_Liter'}
                                        onChange={handleChange}
                                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                    />
                                    Per Liter
                                </label>
                                <label className="flex items-center text-gray-700 dark:text-slate-300">
                                    <input
                                        type="radio"
                                        name="cost_type"
                                        value="Per_Load"
                                        checked={formData.cost_type === 'Per_Load'}
                                        onChange={handleChange}
                                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                    />
                                    Per Load
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Rate Value (₹) *
                            </label>
                            <input
                                type="number"
                                name="rate_value"
                                value={formData.rate_value}
                                onChange={handleChange}
                                required
                                step="0.01"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-100"
                            />
                        </div>

                        {formData.cost_type === 'Per_Load' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Vehicle Reference *
                                    </label>
                                    <select
                                        name="vehicle_ref_id"
                                        value={formData.vehicle_ref_id}
                                        onChange={handleChange}
                                        required={formData.cost_type === 'Per_Load'}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-100"
                                    >
                                        <option value="">Select Vehicle</option>
                                        {vehicles.map(vehicle => (
                                            <option key={vehicle.id} value={vehicle.id}>
                                                {vehicle.vehicle_name} ({vehicle.capacity_liters}L)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {formData.vehicle_capacity && (
                                    <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-md">
                                        <p className="text-sm text-gray-700 dark:text-slate-300">
                                            <strong>Selected Capacity:</strong> {formData.vehicle_capacity} Liters
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {formData.calculated_cost_per_kl && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    <strong>Calculated Cost per KL:</strong> ₹{formData.calculated_cost_per_kl}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                {editingRate ? 'Update' : 'Add'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-md hover:bg-gray-300 dark:hover:bg-slate-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default VendorRates;
