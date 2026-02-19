import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from './Modal';
import Toast from './Toast';

const InternalVehicleRates = () => {
    const [rates, setRates] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [locations, setLocations] = useState([]); // [NEW] Locations state
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRate, setEditingRate] = useState(null);
    const [toast, setToast] = useState(null);
    const [filterVehicle, setFilterVehicle] = useState('');

    const [formData, setFormData] = useState({
        vehicle: '',
        loading_location: '', // [NEW]
        effective_date: new Date().toISOString().split('T')[0],
        cost_per_load: '',
        notes: ''
    });

    const fetchData = useCallback(async () => {
        try {
            const [ratesRes, vehiclesRes, locationsRes] = await Promise.all([
                api.get('rates/internal/'),
                api.get('internal-vehicles/'),
                api.get('locations/') // [NEW] Fetch locations
            ]);
            // Handle paginated responses
            setRates(ratesRes.data.results || ratesRes.data);
            setVehicles(vehiclesRes.data.results || vehiclesRes.data);
            setLocations(locationsRes.data.results || locationsRes.data); // [NEW]
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
            vehicle: '',
            loading_location: '', // [NEW]
            effective_date: new Date().toISOString().split('T')[0],
            cost_per_load: '',
            notes: ''
        });
        setShowModal(true);
    };

    const handleEdit = (rate) => {
        setEditingRate(rate);
        setFormData({
            vehicle: rate.vehicle,
            loading_location: rate.loading_location || '', // [NEW]
            effective_date: rate.effective_date,
            cost_per_load: rate.cost_per_load || '',
            notes: rate.notes || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this rate?')) return;

        try {
            await api.delete(`rates/internal/${id}/`);
            setToast({ message: 'Rate deleted successfully', type: 'success' });
            fetchData();
        } catch {
            setToast({ message: 'Failed to delete rate', type: 'error' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingRate) {
                await api.put(`rates/internal/${editingRate.id}/`, formData);
                setToast({ message: 'Rate updated successfully', type: 'success' });
            } else {
                await api.post('rates/internal/', formData);
                setToast({ message: 'Rate added successfully', type: 'success' });
            }
            setShowModal(false);
            fetchData();
        } catch {
            setToast({ message: 'Failed to save rate', type: 'error' });
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const getVehicleName = (vehicleId) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        return vehicle ? vehicle.vehicle_name : 'Unknown';
    };

    // [NEW] Helper to get location name
    const getLocationName = (locationId) => {
        if (!locationId) return '-';
        const location = locations.find(l => l.id === locationId);
        return location ? location.location_name : 'Unknown';
    };

    const getRateStatus = (effectiveDate) => {
        const today = new Date().toISOString().split('T')[0];
        if (effectiveDate <= today) {
            return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Active</span>;
        } else {
            return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Future</span>;
        }
    };

    const filteredRates = filterVehicle
        ? rates.filter(r => r.vehicle === parseInt(filterVehicle))
        : rates;

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Internal Vehicle Rates</h2>
                    <p className="text-gray-600 dark:text-slate-400 mt-1">Manage cost per load for company vehicles</p>
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
                    value={filterVehicle}
                    onChange={(e) => setFilterVehicle(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 dark:text-slate-200"
                >
                    <option value="">All Vehicles</option>
                    {vehicles.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.vehicle_name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Vehicle</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Loading Location</th>{/* [NEW] */}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Effective Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Cost per Load</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Notes</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                        {filteredRates.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-4 text-center text-gray-500 dark:text-slate-500"> {/* Updated colSpan */}
                                    No rates found
                                </td>
                            </tr>
                        ) : (
                            filteredRates.map(rate => (
                                <tr key={rate.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900 dark:text-slate-200">{getVehicleName(rate.vehicle)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-slate-400"> {/* [NEW] */}
                                        {getLocationName(rate.loading_location)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-slate-400">
                                        {rate.effective_date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-slate-200 font-medium">
                                        ₹{parseFloat(rate.cost_per_load).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getRateStatus(rate.effective_date)}
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 dark:text-slate-400">
                                        {rate.notes || '-'}
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
                                Vehicle *
                            </label>
                            <select
                                name="vehicle"
                                value={formData.vehicle}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-100"
                            >
                                <option value="">Select Vehicle</option>
                                {vehicles.map(vehicle => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.vehicle_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Loading Location *
                            </label>
                            <select
                                name="loading_location"
                                value={formData.loading_location}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-100"
                            >
                                <option value="">Select Location</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.location_name}
                                    </option>
                                ))}
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
                                Cost per Load (₹) *
                            </label>
                            <input
                                type="number"
                                name="cost_per_load"
                                value={formData.cost_per_load}
                                onChange={handleChange}
                                required
                                step="0.01"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-100"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Notes
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-100"
                            />
                        </div>

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

export default InternalVehicleRates;
