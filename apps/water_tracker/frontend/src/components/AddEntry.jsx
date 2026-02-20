import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Toast from './Toast';

const AddEntry = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID from URL if editing
    const isEditMode = !!id;
    const isYieldEdit = window.location.pathname.includes('yield');
    const isConsumptionEdit = window.location.pathname.includes('consumption');

    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Dropdown data
    const [locations, setLocations] = useState([]);
    const [sources, setSources] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [yieldLocations, setYieldLocations] = useState([]);
    const [consumptionLocations, setConsumptionLocations] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [consumptionType, setConsumptionType] = useState('Normal');
    const [dataLoading, setDataLoading] = useState(true);
    const [generalRates, setGeneralRates] = useState([]);

    // Form data
    const [formData, setFormData] = useState({
        entry_date: new Date().toISOString().split('T')[0],
        source: '',
        loading_location: '',
        unloading_location: '',
        shift: 'Morning',
        water_type: 'Drinking Water',
        vehicle: '',
        load_count: 1,
        meter_reading_current: '',
        meter_reading_previous: '',
        manual_capacity_liters: '',
        total_quantity_liters: '',
        total_cost: 0,
        comments: ''
    });

    const [calculatedCost, setCalculatedCost] = useState(null);

    // State for Entry Type
    const [entryType, setEntryType] = useState('Vendor');

    // State for Manual Override
    const [isManualOverride, setIsManualOverride] = useState(false);

    // State for Main Tab (Purchase vs Yield)
    const [mainTab, setMainTab] = useState('Purchase');

    // Yield Entry Form Data
    const [yieldFormData, setYieldFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        location: '',
        current_reading: '',
        previous_reading: 0,
        yield_liters: '',
        comments: ''
    });

    // Consumption Entry Form Data
    const [consumptionFormData, setConsumptionFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        location: '',
        current_reading: '',
        previous_reading: 0,
        comments: ''
    });

    // General Rates Form Data
    const [generalRatesFormData, setGeneralRatesFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        normal_water_rate: '',
        drinking_water_rate: '',
        effective_date: new Date().toISOString().split('T')[0]
    });

    // State for Comments Section
    const [showComments, setShowComments] = useState(false);

    // Filtered data based on Entry Type
    const getFilteredSources = () => {
        if (!sources) return [];
        switch (entryType) {
            case 'Vendor':
                return sources.filter(s => s.source_type === 'Vendor');
            case 'Internal':
                return sources.filter(s => s.source_type === 'Internal_Bore' || s.source_type === 'Internal_Well');
            case 'Pipeline':
                return sources.filter(s => s.source_type === 'Pipeline');
            default:
                return [];
        }
    };

    const filteredSources = getFilteredSources();
    const loadingLocations = (locations || []).filter(l =>
        l.location_type === 'Loading' || l.location_type === 'Both'
    );
    const unloadingLocations = (locations || []).filter(l =>
        l.location_type === 'Unloading' || l.location_type === 'Both'
    );

    // Auto-select internal source if Entry Type is Internal
    useEffect(() => {
        if (entryType === 'Internal' && sources.length > 0) {
            const internalSources = sources.filter(s => s.source_type === 'Internal_Bore' || s.source_type === 'Internal_Well');
            if (internalSources.length > 0) {
                // If current source is not valid or empty, select the first one
                const currentSource = sources.find(s => s.id === parseInt(formData.source));
                const isCurrentValid = currentSource && (currentSource.source_type === 'Internal_Bore' || currentSource.source_type === 'Internal_Well');

                if (!isCurrentValid) {
                    setFormData(prev => ({ ...prev, source: internalSources[0].id }));
                }
            }
        }
    }, [entryType, sources, formData.source]); // Dependent on entryType switching


    // Fetch general rates on tab switch
    useEffect(() => {
        const fetchGeneralRates = async () => {
            if (mainTab === 'GeneralRates') {
                try {
                    const response = await api.get('general-water-rates/');
                    setGeneralRates(response.data.results || response.data);
                } catch (err) {
                    console.error('Failed to fetch general rates', err);
                }
            }
        };
        fetchGeneralRates();
    }, [mainTab]);

    // Auto-fetch last yield reading
    useEffect(() => {
        const fetchLastYield = async () => {
            if (mainTab === 'Yield' && yieldFormData.location && !isEditMode) {
                try {
                    const response = await api.get(`last-yield-reading?location_id=${yieldFormData.location}&date=${yieldFormData.date}`);
                    setYieldFormData(prev => ({
                        ...prev,
                        previous_reading: response.data.previous_reading
                    }));
                } catch (err) {
                    console.error('Failed to fetch last yield reading:', err);
                }
            }
        };
        fetchLastYield();
    }, [mainTab, yieldFormData.location, yieldFormData.date, isEditMode]);

    // Auto-fetch last consumption reading
    useEffect(() => {
        const fetchLastConsumption = async () => {
            if (mainTab === 'Consumption' && consumptionFormData.location && !isEditMode) {
                try {
                    const response = await api.get(`last-consumption-reading?location_id=${consumptionFormData.location}&date=${consumptionFormData.date}`);
                    setConsumptionFormData(prev => ({
                        ...prev,
                        previous_reading: response.data.previous_reading
                    }));
                } catch (err) {
                    console.error('Failed to fetch last consumption reading:', err);
                }
            }
        };
        fetchLastConsumption();
    }, [mainTab, consumptionFormData.location, consumptionFormData.date, isEditMode]);

    // Auto-fetch last pipeline reading
    useEffect(() => {
        const fetchLastPipeline = async () => {
            if (mainTab === 'Purchase' && entryType === 'Pipeline' && formData.source && !isEditMode) {
                try {
                    const response = await api.get(`last-pipeline-reading?source_id=${formData.source}&entry_date=${formData.entry_date}`);
                    setFormData(prev => ({
                        ...prev,
                        meter_reading_previous: response.data.previous_reading || 0
                    }));
                } catch (err) {
                    console.error('Failed to fetch last pipeline reading:', err);
                }
            }
        };
        fetchLastPipeline();
    }, [mainTab, entryType, formData.source, formData.entry_date, isEditMode]);

    // Fetch dropdown data
    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const [dropdownRes, yieldRes, consumptionRes, categoriesRes] = await Promise.all([
                    api.get('dropdown-data'),
                    api.get('yield-locations/'),
                    api.get('consumption-locations/'),
                    api.get('consumption-categories/')
                ]);
                setLocations(dropdownRes.data.locations || []);
                setSources(dropdownRes.data.sources || []);
                setVehicles(dropdownRes.data.vehicles || []);
                setYieldLocations(yieldRes.data.results || yieldRes.data || []);
                setConsumptionLocations(consumptionRes.data.results || consumptionRes.data || []);
                setCategories(categoriesRes.data.results || categoriesRes.data || []);
                setDataLoading(false);
            } catch {
                console.error('Failed to fetch dropdown data');
                setDataLoading(false);
            }
        };
        fetchDropdownData();
    }, []);

    // Fetch Entry Data if in Edit Mode
    useEffect(() => {
        if (isEditMode) {
            const fetchEntry = async () => {
                try {
                    if (isYieldEdit) {
                        const response = await api.get(`yield-entries/${id}/`);
                        const entry = response.data;
                        setMainTab('Yield');
                        setYieldFormData({
                            date: entry.date,
                            location: entry.location || '',
                            current_reading: entry.current_reading || '',
                            previous_reading: entry.previous_reading || 0,
                            yield_liters: entry.yield_liters || '',
                            comments: entry.comments || ''
                        });
                        if (entry.comments) setShowComments(true);
                    } else if (isConsumptionEdit) {
                        const response = await api.get(`consumption-entries/${id}/`);
                        const entry = response.data;
                        setMainTab('Consumption');
                        setConsumptionFormData({
                            date: entry.date,
                            location: entry.location || '',
                            current_reading: entry.current_reading || '',
                            previous_reading: entry.previous_reading || 0,
                            comments: entry.comments || ''
                        });

                        // [AUTO-CATEGORY] Set category in edit mode
                        if (entry.location && consumptionLocations.length > 0) {
                            const loc = consumptionLocations.find(l => l.id === entry.location);
                            if (loc && loc.category) {
                                setSelectedCategory(loc.category.toString());
                            }
                        }

                        if (entry.comments) setShowComments(true);
                    } else {
                        const response = await api.get(`entries/${id}/`);
                        // ... rest of purchase logic
                        const entry = response.data;

                        // Determine entry type from fetched data to set UI state
                        let type = 'Vendor';
                        const source = (sources || []).find(s => s.id === entry.source);
                        if (source) {
                            if (source.source_type === 'Vendor') type = 'Vendor';
                            else if (source.source_type === 'Pipeline') type = 'Pipeline';
                            else type = 'Internal';
                        } else if (entry.meter_reading_current) {
                            type = 'Pipeline'; // Fallback deduction
                        }

                        setEntryType(type);

                        setFormData({
                            entry_date: entry.entry_date,
                            source: entry.source || '',
                            loading_location: entry.loading_location || '',
                            unloading_location: entry.unloading_location || '',
                            shift: entry.shift || 'Morning',
                            water_type: entry.water_type || 'Drinking Water',
                            vehicle: entry.vehicle || '',
                            load_count: entry.load_count || 1,
                            meter_reading_current: entry.meter_reading_current || '',
                            meter_reading_previous: entry.meter_reading_previous || '',
                            manual_capacity_liters: entry.manual_capacity_liters || '',
                            total_quantity_liters: entry.total_quantity_liters,
                            total_cost: entry.total_cost,
                            comments: entry.comments || ''
                        });

                        if (entry.manual_capacity_liters) setIsManualOverride(true);
                        if (entry.comments) setShowComments(true);
                        setCalculatedCost(parseFloat(entry.total_cost));
                    }
                } catch (err) {
                    console.error("Failed to fetch entry details", err);
                    setToast({ message: "Failed to load entry details", type: "error" });
                }
            };
            // Only fetch if sources/yieldLocations are loaded
            if (sources.length > 0 || yieldLocations.length > 0 || consumptionLocations.length > 0) {
                fetchEntry();
            }
        }
    }, [id, isEditMode, isYieldEdit, isConsumptionEdit, sources, yieldLocations, consumptionLocations]);

    // Auto-calculate cost when relevant fields change
    useEffect(() => {
        // Skip auto-calc on initial load of edit mode to prevent overwriting
        if (isEditMode && dataLoading) return;

        const autoCalculate = async () => {
            // Only auto-calculate if we have source and quantity
            if (!formData.source || !formData.total_quantity_liters || formData.total_quantity_liters <= 0) {
                return;
            }

            try {
                // Determine source type map for backend
                let apiSourceType = 'vendor';
                if (entryType === 'Internal') apiSourceType = 'internal';
                else if (entryType === 'Pipeline') apiSourceType = 'pipeline';

                const response = await api.post('calculate-cost', {
                    source_type: apiSourceType,
                    source_id: formData.source ? parseInt(formData.source) : null,
                    vehicle_id: formData.vehicle ? parseInt(formData.vehicle) : null,
                    loading_location_id: formData.loading_location ? parseInt(formData.loading_location) : null, // [NEW]
                    quantity_liters: parseFloat(formData.total_quantity_liters),
                    load_count: parseInt(formData.load_count || 1),
                    entry_date: formData.entry_date,
                    water_type: formData.water_type,
                    is_manual_override: isManualOverride
                });

                // Only update if cost is different to avoid unnecessary renders/updates
                if (parseFloat(response.data.total_cost) !== parseFloat(formData.total_cost)) {
                    setCalculatedCost(response.data.total_cost);
                    setFormData(prev => ({
                        ...prev,
                        total_cost: response.data.total_cost
                    }));
                }
            } catch (err) {
                console.error('Auto-calculation failed:', err);
            }
        };

        const timeoutId = setTimeout(autoCalculate, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.source, formData.vehicle, formData.loading_location, formData.total_quantity_liters, formData.entry_date, sources, isEditMode, dataLoading, formData.load_count, formData.total_cost, formData.water_type, entryType, isManualOverride]);

    // Auto-calculate quantity based on vehicle capacity/manual override and load count
    useEffect(() => {
        if (!formData.load_count) return;

        let quantityPerLoad = 0;

        if (isManualOverride) {
            quantityPerLoad = parseFloat(formData.manual_capacity_liters || 0);
        } else if (formData.vehicle) {
            const selectedVehicle = (vehicles || []).find(v => v.id === parseInt(formData.vehicle));
            if (selectedVehicle) {
                quantityPerLoad = selectedVehicle.capacity_liters;
            }
        }

        if (quantityPerLoad > 0) {
            const calculatedQuantity = quantityPerLoad * parseInt(formData.load_count);

            // Update only if different
            if (parseFloat(formData.total_quantity_liters) !== calculatedQuantity) {
                setFormData(prev => ({
                    ...prev,
                    total_quantity_liters: calculatedQuantity
                }));
            }
        }
    }, [formData.vehicle, formData.load_count, vehicles, formData.total_quantity_liters, isManualOverride, formData.manual_capacity_liters]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'meter_reading_current' || name === 'meter_reading_previous') {
            const current = name === 'meter_reading_current' ? parseInt(value) : parseInt(formData.meter_reading_current);
            const previous = name === 'meter_reading_previous' ? parseInt(value) : parseInt(formData.meter_reading_previous);

            if (current && previous && current > previous) {
                setFormData(prev => ({
                    ...prev,
                    total_quantity_liters: current - previous
                }));
            }
        }
    };

    const handleCalculateCost = async () => {
        try {
            if (entryType !== 'Internal' && !formData.source) {
                setToast({ message: 'Please select a source', type: 'error' });
                return;
            }
            if (entryType === 'Internal' && !formData.vehicle) {
                setToast({ message: 'Please select a vehicle', type: 'error' });
                return;
            }

            let apiSourceType = 'vendor';
            if (entryType === 'Internal') apiSourceType = 'internal';
            else if (entryType === 'Pipeline') apiSourceType = 'pipeline';

            const response = await api.post('calculate-cost', {
                source_type: apiSourceType,
                source_id: formData.source ? parseInt(formData.source) : null,
                vehicle_id: formData.vehicle ? parseInt(formData.vehicle) : null,
                loading_location_id: formData.loading_location ? parseInt(formData.loading_location) : null, // [NEW]
                quantity_liters: parseFloat(formData.total_quantity_liters || 0),
                load_count: parseInt(formData.load_count || 1),
                entry_date: formData.entry_date,
                water_type: formData.water_type,
                is_manual_override: isManualOverride
            });

            setCalculatedCost(response.data.total_cost);
            setFormData(prev => ({
                ...prev,
                total_cost: response.data.total_cost
            }));
        } catch {
            setToast({ message: 'Failed to calculate cost', type: 'error' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (entryType !== 'Internal' && !formData.source) {
            setToast({ message: 'Please select a source', type: 'error' });
            return;
        }
        if (entryType === 'Internal' && !formData.vehicle) {
            setToast({ message: 'Please select a vehicle', type: 'error' });
            return;
        }

        setLoading(true);

        try {
            const payload = {
                ...formData,
                source: formData.source || null,
                loading_location: formData.loading_location || null,
                unloading_location: formData.unloading_location || null,
                vehicle: formData.vehicle || null,
                meter_reading_current: formData.meter_reading_current || null,
                meter_reading_previous: formData.meter_reading_previous || null,
                manual_capacity_liters: formData.manual_capacity_liters || null,
            };

            if (isEditMode) {
                await api.put(`entries/${id}/`, payload);
                setToast({ message: 'Entry updated successfully!', type: 'success' });
            } else {
                await api.post('entries/', payload);
                setToast({ message: 'Entry added successfully!', type: 'success' });
            }

            setTimeout(() => {
                navigate('/entries');
            }, 1500);
        } catch (err) {
            setToast({
                message: err.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'add'} entry`,
                type: 'error'
            });
            setLoading(false);
        }
    };

    const handleYieldSubmit = async (e) => {
        e.preventDefault();
        if (!yieldFormData.location || !yieldFormData.current_reading) {
            setToast({ message: 'Please fill all required fields', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            if (isEditMode && isYieldEdit) {
                await api.put(`yield-entries/${id}/`, yieldFormData);
                setToast({ message: 'Yield entry updated successfully!', type: 'success' });
            } else {
                await api.post('yield-entries/', yieldFormData);
                setToast({ message: 'Yield entry added successfully!', type: 'success' });
            }
            setTimeout(() => navigate('/yield-entries'), 1500);
        } catch (err) {
            setToast({
                message: err.response?.data?.error || 'Failed to save yield entry',
                type: 'error'
            });
            setLoading(false);
        }
    };

    const handleConsumptionSubmit = async (e) => {
        e.preventDefault();
        if (!consumptionFormData.location || !consumptionFormData.current_reading) {
            setToast({ message: 'Please fill all required fields', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            if (isEditMode && isConsumptionEdit) {
                await api.put(`consumption-entries/${id}/`, consumptionFormData);
                setToast({ message: 'Consumption entry updated successfully!', type: 'success' });
            } else {
                await api.post('consumption-entries/', consumptionFormData);
                setToast({ message: 'Consumption entry added successfully!', type: 'success' });
            }
            setTimeout(() => navigate('/consumption-entries'), 1500);
        } catch (err) {
            setToast({
                message: err.response?.data?.error || 'Failed to save consumption entry',
                type: 'error'
            });
            setLoading(false);
        }
    };

    const handleGeneralRatesSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditMode) {
                // Not implemented yet
            } else {
                await api.post('general-water-rates/', generalRatesFormData);
                setToast({ message: 'General rates added successfully!', type: 'success' });
                setGeneralRatesFormData({
                    date: new Date().toISOString().split('T')[0],
                    normal_water_rate: '',
                    drinking_water_rate: '',
                    effective_date: new Date().toISOString().split('T')[0]
                });
                // Refresh list
                const response = await api.get('general-water-rates/');
                setGeneralRates(response.data.results || response.data);
            }
            setLoading(false);
        } catch (err) {
            setToast({
                message: err.response?.data?.error || 'Failed to save general rates',
                type: 'error'
            });
            setLoading(false);
        }
    };

    if (dataLoading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="text-center mt-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading form data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {mainTab === 'Purchase' ? (isEditMode ? 'Edit Water Purchase' : 'Add Water Purchase') :
                        (mainTab === 'Yield' ? (isEditMode ? 'Edit Yield Entry' : 'Add Yield Entry') :
                            (mainTab === 'GeneralRates' ? 'General Water Rates' :
                                (isEditMode ? 'Edit Consumption' : 'Add Consumption')))}
                </h1>
                <p className="text-gray-600 dark:text-slate-400 mt-1">
                    {mainTab === 'Purchase' ? (isEditMode ? 'Update water purchase entry' : 'Create a new water purchase entry') :
                        (mainTab === 'Yield' ? 'Record daily yield/meter reading for Borewell/Well' :
                            (mainTab === 'GeneralRates' ? 'Set daily and effective rates for Normal and Drinking water' :
                                'Record daily consumption reading for Locations'))}
                </p>
            </div>

            {/* Main Tabs */}
            {!isEditMode && (
                <div className="flex bg-gray-100 dark:bg-slate-900/50 p-1 rounded-lg mb-6 w-fit border border-gray-200 dark:border-slate-700">
                    <button
                        onClick={() => setMainTab('Purchase')}
                        className={`px-6 py-2 rounded-md transition-all font-medium text-sm ${mainTab === 'Purchase'
                            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-slate-400'
                            }`}
                    >
                        Water Purchase
                    </button>
                    <button
                        onClick={() => setMainTab('Yield')}
                        className={`px-6 py-2 rounded-md transition-all font-medium text-sm ${mainTab === 'Yield'
                            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-slate-400'
                            }`}
                    >
                        Yield Entry
                    </button>
                    <button
                        onClick={() => setMainTab('Consumption')}
                        className={`px-6 py-2 rounded-md transition-all font-medium text-sm ${mainTab === 'Consumption'
                            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-slate-400'
                            }`}
                    >
                        Consumption
                    </button>
                    <button
                        onClick={() => setMainTab('GeneralRates')}
                        className={`px-6 py-2 rounded-md transition-all font-medium text-sm ${mainTab === 'GeneralRates'
                            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-slate-400'
                            }`}
                    >
                        General Rates
                    </button>
                </div>
            )}

            {mainTab === 'Purchase' && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6 space-y-6">


                    {/* Entry Type Toggle */}
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                            Entry Type
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="entryType"
                                    value="Vendor"
                                    checked={entryType === 'Vendor'}
                                    onChange={(e) => {
                                        setEntryType(e.target.value);
                                        setFormData(prev => ({ ...prev, source: '', vehicle: '' })); // Reset source on change
                                    }}
                                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-600 focus:ring-blue-500 bg-white dark:bg-slate-800"
                                />
                                <span className="ml-2 text-gray-900 dark:text-slate-200">Vendor Vehicle</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="entryType"
                                    value="Internal"
                                    checked={entryType === 'Internal'}
                                    onChange={(e) => {
                                        setEntryType(e.target.value);
                                        setFormData(prev => ({ ...prev, source: '', vehicle: '' }));
                                    }}
                                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-600 focus:ring-blue-500 bg-white dark:bg-slate-800"
                                />
                                <span className="ml-2 text-gray-900 dark:text-slate-200">Rathinam Vehicle</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="entryType"
                                    value="Pipeline"
                                    checked={entryType === 'Pipeline'}
                                    onChange={(e) => {
                                        setEntryType(e.target.value);
                                        setFormData(prev => ({ ...prev, source: '', vehicle: '', water_type: 'Drinking Water' }));
                                    }}
                                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-600 focus:ring-blue-500 bg-white dark:bg-slate-800"
                                />
                                <span className="ml-2 text-gray-900 dark:text-slate-200">Corporation</span>
                            </label>
                        </div>
                    </div>

                    {/* Date and Source */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Entry Date *
                            </label>
                            <input
                                type="date"
                                name="entry_date"
                                value={formData.entry_date}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {entryType !== 'Internal' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    {entryType} Source *
                                </label>
                                <select
                                    name="source"
                                    value={formData.source}
                                    onChange={handleChange}
                                    required={entryType !== 'Internal'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select {entryType} Source</option>
                                    {filteredSources.map(source => (
                                        <option key={source.id} value={source.id}>
                                            {source.source_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Locations - Hidden for Pipeline */}
                    {entryType !== 'Pipeline' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    Loading Location
                                </label>
                                <select
                                    name="loading_location"
                                    value={formData.loading_location}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Location</option>
                                    {loadingLocations.map(loc => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.location_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    Unloading Location
                                </label>
                                <select
                                    name="unloading_location"
                                    value={formData.unloading_location}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Location</option>
                                    {unloadingLocations.map(loc => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.location_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Shift and Water Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Shift - Hidden for Pipeline */}
                        {entryType !== 'Pipeline' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    Shift
                                </label>
                                <select
                                    name="shift"
                                    value={formData.shift}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Morning">Morning</option>
                                    <option value="Evening">Evening</option>
                                    <option value="Night">Night</option>
                                </select>
                            </div>
                        )}

                        {entryType !== 'Pipeline' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    Water Type
                                </label>
                                <select
                                    name="water_type"
                                    value={formData.water_type}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Drinking Water">Drinking Water</option>
                                    <option value="Normal Water (Salt)">Normal Water (Salt)</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Vehicle and Load Count */}
                    {/* Vehicle is always shown for Internal (Required) and Vendor (Optional) */}
                    {entryType !== 'Pipeline' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    Vehicle {entryType === 'Internal' && '*'}
                                </label>
                                <select
                                    name="vehicle"
                                    value={formData.vehicle}
                                    onChange={handleChange}
                                    required={entryType === 'Internal'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Vehicle</option>
                                    {vehicles.map(veh => (
                                        <option key={veh.id} value={veh.id}>
                                            {veh.vehicle_name} ({veh.capacity_liters}L)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    Load Count
                                </label>
                                <input
                                    type="number"
                                    name="load_count"
                                    value={formData.load_count}
                                    onChange={handleChange}
                                    min="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}


                    {/* Meter Readings - Only show for Pipeline sources */}
                    {entryType === 'Pipeline' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t dark:border-slate-700 pt-4">
                            <div className="md:col-span-2">
                                <p className="text-sm text-blue-600 mb-2">
                                    📊 Pipeline Meter Readings
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    Previous Meter Reading
                                </label>
                                <input
                                    type="number"
                                    name="meter_reading_previous"
                                    value={formData.meter_reading_previous}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    Current Meter Reading
                                </label>
                                <input
                                    type="number"
                                    name="meter_reading_current"
                                    value={formData.meter_reading_current}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                        </div>
                    )}

                    {/* Quantity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                {entryType === 'Pipeline' ? 'Total Quantity (KL) *' : 'Total Quantity (Liters) *'}
                            </label>
                            <input
                                type="number"
                                name="total_quantity_liters"
                                value={formData.total_quantity_liters}
                                onChange={handleChange}
                                required
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                                    Manual Capacity Override (Liters)
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isManualOverride}
                                        onChange={(e) => {
                                            setIsManualOverride(e.target.checked);
                                            if (!e.target.checked) {
                                                setFormData(prev => ({ ...prev, manual_capacity_liters: '' }));
                                            }
                                        }}
                                        className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500 bg-white dark:bg-slate-800"
                                    />
                                    <span className="ml-2 text-xs text-gray-500 dark:text-slate-400">Enable</span>
                                </label>
                            </div>
                            <input
                                type="number"
                                name="manual_capacity_liters"
                                value={formData.manual_capacity_liters}
                                onChange={handleChange}
                                disabled={!isManualOverride}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isManualOverride ? 'bg-gray-100 dark:bg-slate-900/50 text-gray-400 dark:text-slate-600' : ''}`}
                            />
                        </div>
                    </div>

                    {/* Cost Calculation */}
                    <div className="border-t dark:border-slate-700 pt-4">
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={handleCalculateCost}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                            >
                                Calculate Cost
                            </button>

                            {calculatedCost !== null && (
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Total: ₹{calculatedCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="border-t dark:border-slate-700 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showComments}
                                        onChange={(e) => {
                                            setShowComments(e.target.checked);
                                            if (!e.target.checked) {
                                                setFormData(prev => ({ ...prev, comments: '' }));
                                            }
                                        }}
                                        className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500 bg-white dark:bg-slate-800"
                                    />
                                    <span className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                                        Add Comments/Special Note
                                    </span>
                                </label>
                                <span className="text-xs text-gray-400 dark:text-slate-500">(Max 300 characters)</span>
                            </div>
                        </div>

                        {showComments && (
                            <div className="animate-fadeIn">
                                <textarea
                                    name="comments"
                                    value={formData.comments}
                                    onChange={handleChange}
                                    placeholder="Enter any notes or reasons for the admin..."
                                    maxLength="300"
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                                ></textarea>
                                <div className="flex justify-end mt-1">
                                    <span className={`text-[10px] ${formData.comments.length >= 300 ? 'text-red-500' : 'text-gray-400'}`}>
                                        {formData.comments.length}/300
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4 border-t dark:border-slate-700">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Saving...' : (isEditMode ? 'Update Entry' : 'Save Entry')}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/entries')}
                            className="px-6 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-md hover:bg-gray-300 dark:hover:bg-slate-600"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {mainTab === 'Yield' && (
                <form onSubmit={handleYieldSubmit} className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6 space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Date *
                            </label>
                            <input
                                type="date"
                                value={yieldFormData.date}
                                onChange={(e) => setYieldFormData({ ...yieldFormData, date: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Location (Borewell/Well) *
                            </label>
                            <select
                                value={yieldFormData.location}
                                onChange={(e) => setYieldFormData({ ...yieldFormData, location: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                            >
                                <option value="">Select Location</option>
                                {yieldLocations.map(loc => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.location_name} ({loc.yield_type})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Previous Meter Reading
                            </label>
                            <input
                                type="number"
                                value={yieldFormData.previous_reading}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-900/50 text-gray-500"
                            />
                            <p className="mt-1 text-[10px] text-gray-400">Automatically fetched from last entry</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Current Meter Reading *
                            </label>
                            <input
                                type="number"
                                value={yieldFormData.current_reading}
                                onChange={(e) => setYieldFormData({ ...yieldFormData, current_reading: e.target.value })}
                                required
                                placeholder="Enter daily meter reading"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Manual Yield Input */}
                    {yieldLocations.find(l => l.id === parseInt(yieldFormData.location))?.is_manual_yield && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Yield (Litre) *
                            </label>
                            <input
                                type="number"
                                value={yieldFormData.yield_liters}
                                onChange={(e) => setYieldFormData({ ...yieldFormData, yield_liters: e.target.value })}
                                required
                                placeholder="Enter actual liters manually"
                                className="w-full px-3 py-2 border border-blue-300 dark:border-blue-900/50 rounded-md focus:ring-2 focus:ring-blue-500 bg-blue-50/30 dark:bg-blue-900/10 dark:text-white"
                            />
                            <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">Manual entry mode enabled for this location</p>
                        </div>
                    )}

                    {yieldFormData.current_reading > yieldFormData.previous_reading && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 mb-4">
                            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                <span>💧 {yieldLocations.find(l => l.id === parseInt(yieldFormData.location))?.is_manual_yield ? 'Meter Reading Difference:' : 'Calculated Yield:'}</span>
                                <span className={`font-bold text-lg ${yieldLocations.find(l => l.id === parseInt(yieldFormData.location))?.is_manual_yield ? 'text-gray-500' : ''}`}>
                                    {((yieldFormData.current_reading - yieldFormData.previous_reading) * 1000).toLocaleString()} Liters
                                </span>
                            </p>
                        </div>
                    )}

                    {/* Comments Toggle */}
                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={() => setShowComments(!showComments)}
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 underline focus:outline-none"
                        >
                            {showComments ? '- Remove Comments' : '+ Add Comments'}
                        </button>
                    </div>

                    {showComments && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Comments (Optional)</label>
                            <textarea
                                value={yieldFormData.comments}
                                onChange={(e) => setYieldFormData({ ...yieldFormData, comments: e.target.value })}
                                className="w-full px-4 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                rows="3"
                                placeholder="Add any additional notes here..."
                            />
                        </div>
                    )}

                    <div className="flex gap-4 pt-4 border-t dark:border-slate-700">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                        >
                            {loading ? 'Saving...' : (isEditMode && isYieldEdit) ? 'Update Yield Entry' : 'Save Yield Entry'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/yield-entries')}
                            className="px-8 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-md hover:bg-gray-300 dark:hover:bg-slate-600 font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {mainTab === 'Consumption' && (
                <form onSubmit={handleConsumptionSubmit} className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Date *
                            </label>
                            <input
                                type="date"
                                value={consumptionFormData.date}
                                onChange={(e) => setConsumptionFormData({ ...consumptionFormData, date: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Consumption Type *
                            </label>
                            <select
                                value={consumptionType}
                                onChange={(e) => {
                                    setConsumptionType(e.target.value);
                                    setConsumptionFormData(prev => ({ ...prev, location: '' }));
                                }}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                            >
                                <option value="Normal">Normal Water Consumption</option>
                                <option value="Drinking">Drinking Water Consumption</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Category Filter
                            </label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                            >
                                <option value="">All Categories</option>
                                {categories.filter(c => c.is_active).map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Location *
                            </label>
                            <select
                                value={consumptionFormData.location}
                                onChange={(e) => {
                                    const locId = e.target.value;
                                    setConsumptionFormData({ ...consumptionFormData, location: locId });

                                    // [AUTO-CATEGORY] Update category filter based on selected location
                                    if (locId) {
                                        const selectedLoc = consumptionLocations.find(l => l.id === parseInt(locId));
                                        if (selectedLoc && selectedLoc.category) {
                                            setSelectedCategory(selectedLoc.category.toString());
                                        }
                                    } else {
                                        setSelectedCategory(''); // Reset to all categories if location cleared
                                    }
                                }}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                            >
                                <option value="">Select Location</option>
                                {consumptionLocations
                                    .filter(loc =>
                                        (!selectedCategory || loc.category === parseInt(selectedCategory)) &&
                                        (loc.consumption_type === consumptionType)
                                    )
                                    .map(loc => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.location_name} ({loc.consumption_type})
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Previous Reading (KL)
                            </label>
                            <input
                                type="number"
                                value={consumptionFormData.previous_reading}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-slate-400"
                            />
                            <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">Read-only (auto-calculated)</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Current Reading (KL) *
                            </label>
                            <input
                                type="number"
                                value={consumptionFormData.current_reading}
                                onChange={(e) => setConsumptionFormData({ ...consumptionFormData, current_reading: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                    </div>

                    {consumptionFormData.current_reading && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-700 dark:text-slate-300">Calculated Consumption:</span>
                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {(Math.max(0, consumptionFormData.current_reading - consumptionFormData.previous_reading) * 1000).toLocaleString()} Liters
                                </span>
                            </div>
                        </div>
                    )}

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                                Comments
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowComments(!showComments)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                {showComments ? 'Hide' : 'Add Comments'}
                            </button>
                        </div>
                        {showComments && (
                            <textarea
                                value={consumptionFormData.comments}
                                onChange={(e) => setConsumptionFormData({ ...consumptionFormData, comments: e.target.value })}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                                placeholder="Any additional notes..."
                            ></textarea>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/consumption-entries')}
                            className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 px-6 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 transition mr-3"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-8 py-2 rounded-md hover:bg-blue-700 transition shadow-md disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : (isEditMode ? 'Update Entry' : 'Save Entry')}
                        </button>
                    </div>
                </form>
            )}

            {mainTab === 'GeneralRates' && (
                <>
                    <form onSubmit={handleGeneralRatesSubmit} className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    Entry Date *
                                </label>
                                <input
                                    type="date"
                                    value={generalRatesFormData.date}
                                    onChange={(e) => setGeneralRatesFormData({ ...generalRatesFormData, date: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    Effective Date *
                                </label>
                                <input
                                    type="date"
                                    value={generalRatesFormData.effective_date}
                                    onChange={(e) => setGeneralRatesFormData({ ...generalRatesFormData, effective_date: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Date from which these rates will apply</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    Normal Water Rate *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={generalRatesFormData.normal_water_rate}
                                        onChange={(e) => setGeneralRatesFormData({ ...generalRatesFormData, normal_water_rate: e.target.value })}
                                        required
                                        placeholder="0.0000"
                                        className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    Drinking Water Rate *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={generalRatesFormData.drinking_water_rate}
                                        onChange={(e) => setGeneralRatesFormData({ ...generalRatesFormData, drinking_water_rate: e.target.value })}
                                        required
                                        placeholder="0.0000"
                                        className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 border-t dark:border-slate-700">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                            >
                                {loading ? 'Saving...' : 'Save General Rates'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-10 bg-white dark:bg-slate-800 shadow-md rounded-lg p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Rate History</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-slate-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-900/50 dark:text-slate-300">
                                    <tr>
                                        <th className="px-4 py-3 border-b dark:border-slate-700">Effective Date</th>
                                        <th className="px-4 py-3 border-b dark:border-slate-700">Normal Rate</th>
                                        <th className="px-4 py-3 border-b dark:border-slate-700">Drinking Rate</th>
                                        <th className="px-4 py-3 border-b dark:border-slate-700">Entered Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-slate-700">
                                    {generalRates.length > 0 ? (
                                        generalRates.map((rate) => (
                                            <tr key={rate.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/30">
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                    {new Date(rate.effective_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3">₹{parseFloat(rate.normal_water_rate).toFixed(4)}</td>
                                                <td className="px-4 py-3">₹{parseFloat(rate.drinking_water_rate).toFixed(4)}</td>
                                                <td className="px-4 py-3">{new Date(rate.date).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                                                No rate history found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
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

export default AddEntry;
