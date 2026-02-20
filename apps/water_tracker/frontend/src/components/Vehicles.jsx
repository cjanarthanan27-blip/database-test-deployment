import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from './Modal';
import Toast from './Toast';

const Vehicles = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [toast, setToast] = useState(null);

    const [formData, setFormData] = useState({
        vehicle_name: '',
        vehicle_number: '',
        capacity_liters: ''
    });

    const fetchVehicles = useCallback(async () => {
        try {
            const response = await api.get('internal-vehicles/');
            // Handle paginated response
            const data = response.data.results || response.data;
            setVehicles(data);
            setLoading(false);
        } catch {
            setToast({ message: 'Failed to load vehicles', type: 'error' });
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    const handleOpenModal = (vehicle = null) => {
        if (vehicle) {
            setEditingVehicle(vehicle);
            setFormData(vehicle);
        } else {
            setEditingVehicle(null);
            setFormData({
                vehicle_name: '',
                vehicle_number: '',
                capacity_liters: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingVehicle(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingVehicle) {
                await api.put(`internal-vehicles/${editingVehicle.id}/`, formData);
                setToast({ message: 'Vehicle updated successfully!', type: 'success' });
            } else {
                await api.post('internal-vehicles/', formData);
                setToast({ message: 'Vehicle added successfully!', type: 'success' });
            }
            fetchVehicles();
            handleCloseModal();
        } catch {
            setToast({ message: 'Failed to save vehicle', type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this vehicle?')) return;

        try {
            await api.delete(`internal-vehicles/${id}/`);
            setToast({ message: 'Vehicle deleted successfully!', type: 'success' });
            fetchVehicles();
        } catch {
            setToast({ message: 'Failed to delete vehicle', type: 'error' });
        }
    };

    if (loading) {
        return <div className="text-center mt-10">Loading...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Internal Vehicles</h1>
                    <p className="text-gray-600 dark:text-slate-400 mt-1">Manage company-owned water tankers</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    + Add Vehicle
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Vehicle Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Vehicle Number
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Capacity (L)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                        {vehicles.map(vehicle => (
                            <tr key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-200">
                                    {vehicle.vehicle_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                    {vehicle.vehicle_number || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                    {vehicle.capacity_liters ? vehicle.capacity_liters.toLocaleString() : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => handleOpenModal(vehicle)}
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(vehicle.id)}
                                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            Vehicle Name *
                        </label>
                        <input
                            type="text"
                            name="vehicle_name"
                            value={formData.vehicle_name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                            placeholder="e.g., Truck 001"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            Vehicle Number
                        </label>
                        <input
                            type="text"
                            name="vehicle_number"
                            value={formData.vehicle_number}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                            placeholder="e.g., KA01AB1234"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            Capacity (Liters)
                        </label>
                        <input
                            type="number"
                            name="capacity_liters"
                            value={formData.capacity_liters}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                            placeholder="e.g., 5000"
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            {editingVehicle ? 'Update' : 'Add'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-md hover:bg-gray-300 dark:hover:bg-slate-600"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>

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

export default Vehicles;
