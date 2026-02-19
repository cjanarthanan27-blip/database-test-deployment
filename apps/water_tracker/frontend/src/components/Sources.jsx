import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from './Modal';
import Toast from './Toast';

const Sources = () => {
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSource, setEditingSource] = useState(null);
    const [toast, setToast] = useState(null);

    const [formData, setFormData] = useState({
        source_name: '',
        source_type: 'Vendor',
        contact_person: '',
        contact_phone: '',
        is_active: true
    });

    const fetchSources = useCallback(async () => {
        try {
            const response = await api.get('sources/');
            // Handle paginated response
            const data = response.data.results || response.data;
            setSources(data);
            setLoading(false);
        } catch {
            setToast({ message: 'Failed to load sources', type: 'error' });
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSources();
    }, [fetchSources]);

    const handleOpenModal = (source = null) => {
        if (source) {
            setEditingSource(source);
            setFormData(source);
        } else {
            setEditingSource(null);
            setFormData({
                source_name: '',
                source_type: 'Vendor',
                contact_person: '',
                contact_phone: '',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSource(null);
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
            if (editingSource) {
                await api.put(`sources/${editingSource.id}/`, formData);
                setToast({ message: 'Source updated successfully!', type: 'success' });
            } else {
                await api.post('sources/', formData);
                setToast({ message: 'Source added successfully!', type: 'success' });
            }
            fetchSources();
            handleCloseModal();
        } catch {
            setToast({ message: 'Failed to save source', type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this source?')) return;

        try {
            await api.delete(`sources/${id}/`);
            setToast({ message: 'Source deleted successfully!', type: 'success' });
            fetchSources();
        } catch {
            setToast({ message: 'Failed to delete source', type: 'error' });
        }
    };

    if (loading) {
        return <div className="text-center mt-10">Loading...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Water Sources</h1>
                    <p className="text-gray-600 dark:text-slate-400 mt-1">Manage vendors and pipeline sources</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    + Add Source
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Contact Person
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Phone
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                        {sources.map(source => (
                            <tr key={source.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-200">
                                    {source.source_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                    <span className={`px-2 py-1 text-xs rounded ${source.source_type === 'Vendor'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                                        }`}>
                                        {source.source_type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                    {source.contact_person || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                    {source.contact_phone || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${source.is_active
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                                        }`}>
                                        {source.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => handleOpenModal(source)}
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(source.id)}
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

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingSource ? 'Edit Source' : 'Add Source'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            Source Name *
                        </label>
                        <input
                            type="text"
                            name="source_name"
                            value={formData.source_name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            Type
                        </label>
                        <select
                            name="source_type"
                            value={formData.source_type}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                        >
                            <option value="Vendor">Vendor</option>
                            <option value="Pipeline">Pipeline</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            Contact Person
                        </label>
                        <input
                            type="text"
                            name="contact_person"
                            value={formData.contact_person}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            Phone
                        </label>
                        <input
                            type="text"
                            name="contact_phone"
                            value={formData.contact_phone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                        />
                    </div>

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
                            {editingSource ? 'Update' : 'Add'}
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

export default Sources;
