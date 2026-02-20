import { useSearchParams } from 'react-router-dom';
import MonthlySummary from './MonthlySummary';
import DailyMovement from './DailyMovement';
import DailyYieldReport from './DailyYieldReport';
import YearlyTrend from './YearlyTrend';
import WaterTypeConsumption from './WaterTypeConsumption';
import VendorUsage from './VendorUsage';
import VehicleUtilization from './VehicleUtilization';
import CostComparison from './CostComparison';
import SiteConsumption from './SiteConsumption';
import CapacityUtilization from './CapacityUtilization';
import RateDetails from './RateDetails';
import DailyNormalConsumptionReport from './DailyNormalConsumptionReport';
import CategoryMonthlyBreakdown from './CategoryMonthlyBreakdown';

const Reports = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'daily';

    const tabs = [
        { id: 'daily', label: '📅 Daily Water Purchase', component: DailyMovement },
        { id: 'daily-yield', label: '📈 Daily Yield Report', component: DailyYieldReport },
        { id: 'monthly', label: '📆 Monthly Water Purchase', component: MonthlySummary },
        { id: 'yearly', label: '📊 Yearly Water Purchase', component: YearlyTrend },
        { id: 'watertype', label: '💧 Water Type Purchase', component: WaterTypeConsumption },
        { id: 'vendor', label: '🧾 Vendor Usage', component: VendorUsage },
        { id: 'vehicle', label: '🚛 Vehicle Utilization', component: VehicleUtilization },
        { id: 'comparison', label: '📉 Cost Comparison', component: CostComparison },
        { id: 'site', label: '📍 Site Wise Purchase', component: SiteConsumption },
        { id: 'capacity', label: '⚖️ Capacity Utilization', component: CapacityUtilization },
        { id: 'daily-normal-consumption', label: '💧 Daily Normal Consumption', component: DailyNormalConsumptionReport },
        { id: 'category-breakdown', label: '🏢 Category Monthly Breakdown', component: CategoryMonthlyBreakdown },
        { id: 'rates', label: '🏷️ Rate Details', component: RateDetails }
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || DailyMovement;

    return (
        <div className="min-h-screen">
            {/* Tab Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <ActiveComponent />
            </div>
        </div>
    );
};

export default Reports;
