import { useState } from 'react';
import InternalVehicleRates from './InternalVehicleRates';
import VendorRates from './VendorRates';
import PipelineRates from './PipelineRates';

const Rates = () => {
    const [activeTab, setActiveTab] = useState('internal');

    const tabs = [
        { id: 'internal', label: 'Internal Vehicles', component: InternalVehicleRates },
        { id: 'vendor', label: 'Vendors', component: VendorRates },
        { id: 'pipeline', label: 'Pipelines', component: PipelineRates }
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            {/* Tab Header */}
            <div className="bg-white dark:bg-slate-800 shadow border-b border-gray-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex space-x-8">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    px-4 py-4 text-sm font-medium border-b-2 transition-colors
                                    ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-200'
                                    }
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto">
                {ActiveComponent && <ActiveComponent />}
            </div>
        </div>
    );
};

export default Rates;
