import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from './Modal';
import Toast from './Toast';

const Locations = () => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [toast, setToast] = useState(null);
    const [activeTab, setActiveTab] = useState('Purchase'); // 'Purchase', 'Borewell', 'Well', 'Normal Consumption', 'Drinking Consumption', 'Category'
    const [selectedIds, setSelectedIds] = useState([]);
    const [categories, setCategories] = useState([]);
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);
    const [orderChanged, setOrderChanged] = useState(false);

    const [formData, setFormData] = useState({
        location_name: '',
        location_type: 'Loading',    // for Purchase
        yield_type: 'Borewell',       // for Yield
        consumption_type: 'Normal',   // for Consumption
        category: '',                 // for Consumption
        address: '',
        is_manual_yield: false,
        is_active: true
    });

    const fetchLocations = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'Purchase') {
                const response = await api.get('locations/');
                const data = response.data.results || response.data;
                setLocations(data);
            } else if (activeTab === 'Borewell' || activeTab === 'Well') {
                const response = await api.get('yield-locations/');
                const data = response.data.results || response.data;
                // Filter by yield_type
                setLocations(data.filter(loc => loc.yield_type === activeTab));
            } else if (activeTab === 'Category') {
                const response = await api.get('consumption-categories/');
                const data = response.data.results || response.data;
                setLocations(data);
            } else {
                // Consumption
                const type = activeTab === 'Normal Water Consumption' ? 'Normal' : 'Drinking';
                const response = await api.get('consumption-locations/');
                const data = response.data.results || response.data;
                setLocations(data.filter(loc => loc.consumption_type === type));
            }
            setLoading(false);
        } catch {
            setToast({ message: 'Failed to load locations', type: 'error' });
            setLoading(false);
        }
    }, [activeTab]);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await api.get('consumption-categories/');
            setCategories(response.data.results || response.data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    }, []);

    useEffect(() => {
        fetchLocations();
        if (activeTab === 'Normal Water Consumption' || activeTab === 'Drinking Water Consumption') {
            fetchCategories();
        }
    }, [fetchLocations, activeTab, fetchCategories]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setLocations([]);
        setSelectedIds([]);
    };

    const handleOpenModal = (location = null) => {
        if (location) {
            setEditingLocation(location);
            // Ensure category name is mapped to location_name for the form
            const data = { ...location };
            if (activeTab === 'Category' && location.name) {
                data.location_name = location.name;
            }
            setFormData(data);
        } else {
            setEditingLocation(null);
            setFormData({
                location_name: '',
                location_type: 'Loading',
                yield_type: (activeTab === 'Borewell' || activeTab === 'Well') ? activeTab : 'Borewell',
                consumption_type: (activeTab === 'Normal Water Consumption' || activeTab === 'Drinking Water Consumption')
                    ? (activeTab === 'Normal Water Consumption' ? 'Normal' : 'Drinking')
                    : 'Normal',
                category: '',
                address: '',
                is_manual_yield: false,
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingLocation(null);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let endpoint = 'locations/';
            if (activeTab === 'Borewell' || activeTab === 'Well') {
                endpoint = 'yield-locations/';
            } else if (activeTab === 'Normal Water Consumption' || activeTab === 'Drinking Water Consumption') {
                endpoint = 'consumption-locations/';
            } else if (activeTab === 'Category') {
                endpoint = 'consumption-categories/';
            }

            // Prepare data based on model
            const payload = { ...formData };
            if (activeTab === 'Borewell' || activeTab === 'Well') {
                payload.yield_type = activeTab;
                delete payload.location_type;
                delete payload.consumption_type;
            } else if (activeTab === 'Normal Water Consumption' || activeTab === 'Drinking Water Consumption') {
                payload.consumption_type = activeTab === 'Normal Water Consumption' ? 'Normal' : 'Drinking';
                delete payload.location_type;
                delete payload.yield_type;
            } else if (activeTab === 'Category') {
                delete payload.location_type;
                delete payload.yield_type;
                delete payload.consumption_type;
                delete payload.address;
                payload.name = payload.location_name; // ConsumptionCategory uses 'name'
                delete payload.location_name;
            } else {
                delete payload.yield_type;
                delete payload.consumption_type;
                delete payload.category;
            }

            if (editingLocation) {
                await api.put(`${endpoint}${editingLocation.id}/`, payload);
                setToast({ message: 'Location updated successfully!', type: 'success' });
            } else {
                await api.post(endpoint, payload);
                setToast({ message: 'Location added successfully!', type: 'success' });
            }
            fetchLocations();
            handleCloseModal();
        } catch (error) {
            console.error('Save error:', error);
            setToast({ message: 'Failed to save location', type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this location?')) return;

        try {
            let endpoint = 'locations/';
            if (activeTab === 'Borewell' || activeTab === 'Well') {
                endpoint = 'yield-locations/';
            } else if (activeTab === 'Normal Water Consumption' || activeTab === 'Drinking Water Consumption') {
                endpoint = 'consumption-locations/';
            } else if (activeTab === 'Category') {
                endpoint = 'consumption-categories/';
            }
            await api.delete(`${endpoint}${id}/`);
            setToast({ message: 'Location deleted successfully!', type: 'success' });
            fetchLocations();
        } catch {
            setToast({ message: 'Failed to delete location', type: 'error' });
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected locations?`)) return;

        setLoading(true);
        try {
            let endpoint = 'locations/bulk_delete/';
            if (activeTab === 'Borewell' || activeTab === 'Well') {
                endpoint = 'yield-locations/bulk_delete/';
            } else if (activeTab === 'Normal Water Consumption' || activeTab === 'Drinking Water Consumption') {
                endpoint = 'consumption-locations/bulk_delete/';
            } else if (activeTab === 'Category') {
                endpoint = 'consumption-categories/bulk_delete/';
            }

            await api.delete(endpoint, { data: { ids: selectedIds } });
            setToast({ message: `${selectedIds.length} locations deleted successfully!`, type: 'success' });
            setSelectedIds([]);
            fetchLocations();
        } catch (err) {
            console.error('Bulk delete error:', err);
            setToast({ message: 'Failed to delete selected locations', type: 'error' });
            setLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === locations.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(locations.map(l => l.id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
        );
    };

    const handleDragStart = (e, index) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // HTML5 drag image setup (optional but good for UX)
        e.target.style.opacity = '0.5';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === index) return;

        const newLocations = [...locations];
        const draggedItem = newLocations[draggedItemIndex];

        // Remove dragged item and insert at new position
        newLocations.splice(draggedItemIndex, 1);
        newLocations.splice(index, 0, draggedItem);

        setDraggedItemIndex(index);
        setLocations(newLocations);
        setOrderChanged(true);
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1';
        setDraggedItemIndex(null);
    };

    const handleSaveOrder = async () => {
        setLoading(true);
        try {
            let endpoint = 'locations/reorder/';
            if (activeTab === 'Borewell' || activeTab === 'Well') {
                endpoint = 'yield-locations/reorder/';
            } else if (activeTab === 'Normal Water Consumption' || activeTab === 'Drinking Water Consumption') {
                endpoint = 'consumption-locations/reorder/';
            } else if (activeTab === 'Category') {
                endpoint = 'consumption-categories/reorder/';
            }

            const orders = locations.map((loc, index) => ({
                id: loc.id,
                sort_order: index
            }));

            await api.post(endpoint, { orders });
            setToast({ message: 'Order saved successfully!', type: 'success' });
            setOrderChanged(false);
            fetchLocations();
        } catch (error) {
            console.error('Save order error:', error);
            setToast({ message: 'Failed to save order', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Master Data Locations</h1>
                    <p className="text-gray-600 dark:text-slate-400 mt-1">Manage all water-related locations</p>
                </div>
                <div className="flex gap-2">
                    {orderChanged && (
                        <button
                            onClick={handleSaveOrder}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save Order
                        </button>
                    )}
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Selected ({selectedIds.length})
                        </button>
                    )}
                    <button
                        onClick={() => handleOpenModal()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        + Add {activeTab === 'Purchase' ? 'Location' : (activeTab === 'Category' ? 'Category' : activeTab)}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-slate-700 mb-6 overflow-x-auto">
                {['Purchase', 'Borewell', 'Well', 'Normal Water Consumption', 'Drinking Water Consumption', 'Category'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`px-6 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                            }`}
                    >
                        {tab === 'Purchase' ? 'Purchase Locations' : (tab === 'Category' ? 'Categories' : tab + (tab.includes('Consumption') ? '' : 's'))}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                        )}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                        <tr>
                            <th className="px-6 py-3 text-left">
                                <span className="sr-only">Move</span>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Name
                            </th>
                            {activeTab === 'Purchase' && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Type
                                </th>
                            )}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Address / Description
                            </th>
                            {(activeTab === 'Normal Water Consumption' || activeTab === 'Drinking Water Consumption') && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Category
                                </th>
                            )}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Status
                            </th>
                            {(activeTab === 'Borewell' || activeTab === 'Well') && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Yield Entry
                                </th>
                            )}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Actions
                            </th>
                            <th className="px-6 py-3 text-right">
                                <input
                                    type="checkbox"
                                    checked={locations.length > 0 && selectedIds.length === locations.length}
                                    onChange={toggleSelectAll}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer dark:bg-slate-800 dark:border-slate-600"
                                />
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-10 text-center text-gray-500 dark:text-slate-400">
                                    Loading...
                                </td>
                            </tr>
                        ) : locations.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-10 text-center text-gray-500 dark:text-slate-400">
                                    No {activeTab.toLowerCase()} locations found.
                                </td>
                            </tr>
                        ) : (
                            locations.map((location, index) => (
                                <tr
                                    key={location.id}
                                    className={`${selectedIds.includes(location.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''} hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-move`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                >
                                    <td className="px-4 py-4 whitespace-nowrap text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                        </svg>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-200">
                                        {activeTab === 'Category' ? location.name : location.location_name}
                                    </td>
                                    {activeTab === 'Purchase' && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                            {location.location_type}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                                        {activeTab === 'Category' ? '-' : (location.address || location.description || '-')}
                                    </td>
                                    {(activeTab === 'Normal Water Consumption' || activeTab === 'Drinking Water Consumption') && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                            {location.category_name || '-'}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${location.is_active
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                                            }`}>
                                            {location.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    {(activeTab === 'Borewell' || activeTab === 'Well') && (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${location.is_manual_yield
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                                }`}>
                                                {location.is_manual_yield ? 'Manual' : 'Auto'}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleOpenModal(location)}
                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(location.id)}
                                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(location.id)}
                                            onChange={() => toggleSelect(location.id)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer dark:bg-slate-800 dark:border-slate-600"
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={`${editingLocation ? 'Edit' : 'Add'} ${activeTab === 'Purchase' ? 'Location' : activeTab}`}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            {activeTab} Name *
                        </label>
                        <input
                            type="text"
                            name="location_name"
                            value={formData.location_name || ''}
                            onChange={handleChange}
                            required
                            placeholder={`Enter ${activeTab.toLowerCase()} name`}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                        />
                    </div>

                    {activeTab === 'Purchase' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Type
                            </label>
                            <select
                                name="location_type"
                                value={formData.location_type || 'Loading'}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                            >
                                <option value="Loading">Loading</option>
                                <option value="Unloading">Unloading</option>
                                <option value="Both">Both</option>
                            </select>
                        </div>
                    )}

                    {(activeTab === 'Normal Water Consumption' || activeTab === 'Drinking Water Consumption') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Category
                            </label>
                            <select
                                name="category"
                                value={formData.category || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                            >
                                <option value="">Select Category</option>
                                {categories.filter(c => c.is_active).map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {activeTab !== 'Category' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                {activeTab === 'Purchase' ? 'Address' : 'Description / Notes'}
                            </label>
                            <textarea
                                name="address"
                                value={formData.address || formData.description || ''}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                    )}

                    {(activeTab === 'Borewell' || activeTab === 'Well') && (
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="is_manual_yield"
                                checked={formData.is_manual_yield}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                            />
                            <label className="ml-2 block text-sm text-gray-900 dark:text-slate-300">
                                Manual Yield Entry
                            </label>
                        </div>
                    )}

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                        />
                        <label className="ml-2 block text-sm text-gray-900 dark:text-slate-300">
                            Active
                        </label>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            {editingLocation ? 'Update' : 'Add'}
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

export default Locations;
