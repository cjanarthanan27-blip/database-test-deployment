import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from './Modal';
import Toast from './Toast';

const PipelineRates = () => {
    const [rates, setRates] = useState([]);
    const [pipelines, setPipelines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRate, setEditingRate] = useState(null);
    const [toast, setToast] = useState(null);
    const [filterPipeline, setFilterPipeline] = useState('');

    const [formData, setFormData] = useState({
        source: '',
        effective_date: new Date().toISOString().split('T')[0],
        cost_per_liter: '',
        notes: ''
    });

    const fetchData = useCallback(async () => {
        try {
            const [ratesRes, sourcesRes] = await Promise.all([
                api.get('rates/pipeline/'),
                api.get('sources/')
            ]);
            // Handle paginated responses
            setRates(ratesRes.data.results || ratesRes.data);
            // Filter to only pipelines
            const sources = sourcesRes.data.results || sourcesRes.data;
            setPipelines(sources.filter(s => s.source_type === 'Pipeline'));
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
            cost_per_liter: '',
            notes: ''
        });
        setShowModal(true);
    };

    const handleEdit = (rate) => {
        setEditingRate(rate);
        setFormData({
            source: rate.source,
            effective_date: rate.effective_date,
            cost_per_liter: rate.cost_per_liter || '',
            notes: rate.notes || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this rate?')) return;

        try {
            await api.delete(`rates/pipeline/${id}/`);
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
                await api.put(`rates/pipeline/${editingRate.id}/`, formData);
                setToast({ message: 'Rate updated successfully', type: 'success' });
            } else {
                await api.post('rates/pipeline/', formData);
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

    const getPipelineName = (sourceId) => {
        const pipeline = pipelines.find(p => p.id === sourceId);
        return pipeline ? pipeline.source_name : 'Unknown';
    };

    const getRateStatus = (effectiveDate) => {
        const today = new Date().toISOString().split('T')[0];
        if (effectiveDate <= today) {
            return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Active</span>;
        } else {
            return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Future</span>;
        }
    };

    const filteredRates = filterPipeline
        ? rates.filter(r => r.source === parseInt(filterPipeline))
        : rates;

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Pipeline Rates</h2>
                    <p className="text-gray-600 dark:text-slate-400 mt-1">Manage per-liter pricing for pipeline water sources</p>
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
                    value={filterPipeline}
                    onChange={(e) => setFilterPipeline(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 dark:text-slate-200"
                >
                    <option value="">All Pipelines</option>
                    {pipelines.map(pipeline => (
                        <option key={pipeline.id} value={pipeline.id}>
                            {pipeline.source_name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Pipeline</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Effective Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Cost per Liter</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Cost per KL</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Notes</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                        {filteredRates.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-4 text-center text-gray-500 dark:text-slate-500">
                                    No rates found
                                </td>
                            </tr>
                        ) : (
                            filteredRates.map(rate => (
                                <tr key={rate.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900 dark:text-slate-200">{getPipelineName(rate.source)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-slate-400">
                                        {rate.effective_date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-slate-200">
                                        ₹{parseFloat(rate.cost_per_liter).toFixed(4)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-slate-200 font-medium">
                                        ₹{(parseFloat(rate.cost_per_liter) * 1000).toFixed(2)}
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
                                Pipeline *
                            </label>
                            <select
                                name="source"
                                value={formData.source}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-100"
                            >
                                <option value="">Select Pipeline</option>
                                {pipelines.map(pipeline => (
                                    <option key={pipeline.id} value={pipeline.id}>
                                        {pipeline.source_name}
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
                                Cost per Liter (₹) *
                            </label>
                            <input
                                type="number"
                                name="cost_per_liter"
                                value={formData.cost_per_liter}
                                onChange={handleChange}
                                required
                                step="0.0001"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                                placeholder="0.0000"
                            />
                            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Up to 4 decimal places</p>
                        </div>

                        {formData.cost_per_liter && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                                <p className="text-sm text-gray-700 dark:text-blue-300">
                                    <strong>Cost per KL:</strong> ₹{(parseFloat(formData.cost_per_liter) * 1000).toFixed(2)}
                                </p>
                            </div>
                        )}

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

export default PipelineRates;
