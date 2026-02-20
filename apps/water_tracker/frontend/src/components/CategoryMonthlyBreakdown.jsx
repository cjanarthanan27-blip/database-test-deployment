import { useState, useEffect, useCallback, Fragment } from 'react';
import api from '../services/api';
import Toast from './Toast';
import { exportReportToPDF, formatDateRange } from '../utils/pdfExport';
import { exportToExcel } from '../utils/excelExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Text } from 'recharts';

const CustomXAxisTick = ({ x, y, payload }) => {
    return (
        <Text
            x={x}
            y={y}
            width={100}
            textAnchor="middle"
            verticalAnchor="start"
            fontSize={11}
            fontWeight={500}
            className="fill-gray-600 dark:fill-slate-400"
        >
            {payload.value}
        </Text>
    );
};

const CategoryMonthlyBreakdown = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Default to last 3 months
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 2);

    const [startDate, setStartDate] = useState(threeMonthsAgo.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('reports/category-monthly-breakdown', {
                params: { start_date: startDate, end_date: endDate }
            });
            setData(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading report:', error);
            setToast({ message: 'Failed to load report', type: 'error' });
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleExportPDF = async () => {
        const dateRange = formatDateRange(startDate, endDate);
        const result = await exportReportToPDF(
            'Category Monthly Breakdown',
            dateRange,
            null, // No charts
            'category-breakdown-tables',
            'category_monthly_breakdown',
            null
        );
        if (!result.success) {
            setToast({ message: 'Failed to export PDF', type: 'error' });
        }
    };

    const handleExportExcel = () => {
        if (!data || data.length === 0) return;

        const excelData = [];
        data.forEach(month => {
            month.categories.forEach(cat => {
                excelData.push({
                    'Month': month.month_name,
                    'Category': cat.name,
                    'Normal Qty (KL)': cat.normal_qty_kl,
                    'Drinking Qty (KL)': cat.drinking_qty_kl,
                    'Total Cost (₹)': cat.total_cost,
                    'Student Count': cat.student_count,
                    'L/S/D': cat.lsd,
                    'C/S/D': cat.csd
                });
            });
        });

        const periodText = `From ${startDate} To ${endDate}`;
        const result = exportToExcel(
            excelData,
            'category_monthly_breakdown',
            'Category Breakdown',
            'Monthly Water Consumption Breakdown by Category',
            periodText
        );

        if (!result.success) {
            setToast({ message: 'Failed to export Excel', type: 'error' });
        }
    };

    if (loading) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="space-y-6">
            {/* Filters Section */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow flex flex-wrap justify-between items-center gap-4 border border-gray-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex-grow min-w-[300px]">Category Monthly Breakdown</h2>
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Start Date:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">End Date:</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        />
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleExportPDF}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                    >
                        Export PDF
                    </button>
                    <button
                        onClick={handleExportExcel}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                    >
                        Export Excel
                    </button>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Monthly Tables */}
            <div id="category-breakdown-tables" className="space-y-12">
                {[
                    { title: 'Categories with Student/Staff Count', filter: true },
                    { title: 'Categories without Student/Staff Count', filter: false }
                ].map((section) => {
                    const sectionCategories = data && data.length > 0
                        ? data[0].categories.filter(cat => (cat.has_student_count !== false) === section.filter)
                        : [];

                    if (sectionCategories.length === 0) return null;

                    return (
                        <div key={section.title} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700 overflow-x-auto">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-4">{section.title}</h3>
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm border-collapse">
                                <thead className="bg-gray-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th rowSpan="2" className="px-4 py-3 text-left font-bold text-gray-700 dark:text-slate-300 uppercase border dark:border-slate-700 min-w-[200px]">Category</th>
                                        <th rowSpan="2" className="px-4 py-3 text-left font-bold text-gray-700 dark:text-slate-300 uppercase border dark:border-slate-700">Metrics</th>
                                        {data && data.map(month => (
                                            <th key={month.month_key} colSpan="2" className="px-4 py-3 text-center font-bold text-gray-700 dark:text-slate-300 uppercase border dark:border-slate-700 bg-gray-100/50 dark:bg-slate-800/50">
                                                {month.month_name}
                                            </th>
                                        ))}
                                    </tr>
                                    <tr>
                                        {data && data.map(month => (
                                            <Fragment key={`${month.month_key}-sub`}>
                                                <th className="px-2 py-2 text-center font-medium text-blue-600 dark:text-blue-400 text-xs border dark:border-slate-700 bg-blue-50/30 dark:bg-blue-900/10">Normal</th>
                                                <th className="px-2 py-2 text-center font-medium text-green-600 dark:text-green-400 text-xs border dark:border-slate-700 bg-green-50/30 dark:bg-green-900/10">Drinking</th>
                                            </Fragment>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800">
                                    {sectionCategories.map((catTemplate) => {
                                        const catName = catTemplate.name;
                                        const hasCount = catTemplate.has_student_count !== false;
                                        const metricsToShow = hasCount
                                            ? ['Quantity', 'Cost', 'No of Students', 'L/S/D', 'C/S/D']
                                            : ['Quantity', 'Cost'];

                                        return (
                                            <Fragment key={catName}>
                                                {/* Sub-Rows for each Metric */}
                                                {metricsToShow.map((metric, mIdx) => (
                                                    <tr key={`${catName}-${metric}`} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                                        {mIdx === 0 && (
                                                            <td rowSpan={metricsToShow.length} className="px-4 py-3 whitespace-nowrap font-bold text-gray-900 dark:text-slate-100 border dark:border-slate-700 bg-gray-50/30 dark:bg-slate-900/20 uppercase align-middle">
                                                                {catName}
                                                            </td>
                                                        )}
                                                        <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-600 dark:text-slate-400 border dark:border-slate-700 bg-gray-50/10 dark:bg-slate-900/10">
                                                            {metric}
                                                        </td>
                                                        {data.map(month => {
                                                            const cat = month.categories.find(c => c.name === catName);
                                                            if (metric === 'No of Students') {
                                                                return (
                                                                    <Fragment key={`${month.month_key}-${metric}-vals`}>
                                                                        <td className="px-4 py-2 text-right text-gray-900 dark:text-slate-100 border dark:border-slate-700 font-semibold">
                                                                            {cat?.normal_student_count || 0}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-right text-gray-900 dark:text-slate-100 border dark:border-slate-700 font-semibold">
                                                                            {cat?.drinking_student_count || 0}
                                                                        </td>
                                                                    </Fragment>
                                                                );
                                                            }

                                                            let normalVal = 0;
                                                            let drinkingVal = 0;
                                                            let prefix = "";
                                                            let suffix = "";

                                                            if (metric === 'Quantity') {
                                                                normalVal = cat?.normal_qty_kl || 0;
                                                                drinkingVal = cat?.drinking_qty_kl || 0;
                                                                suffix = " KL";
                                                            } else if (metric === 'Cost') {
                                                                normalVal = cat?.normal_cost || 0;
                                                                drinkingVal = cat?.drinking_cost || 0;
                                                                prefix = "₹";
                                                            } else if (metric === 'L/S/D') {
                                                                normalVal = cat?.normal_lsd || 0;
                                                                drinkingVal = cat?.drinking_lsd || 0;
                                                            } else if (metric === 'C/S/D') {
                                                                normalVal = cat?.normal_csd || 0;
                                                                drinkingVal = cat?.drinking_csd || 0;
                                                                prefix = "₹";
                                                            }

                                                            return (
                                                                <Fragment key={`${month.month_key}-${metric}-vals`}>
                                                                    <td className="px-4 py-2 text-right text-gray-700 dark:text-slate-300 border dark:border-slate-700">
                                                                        {prefix}{normalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right text-gray-700 dark:text-slate-300 border dark:border-slate-700">
                                                                        {prefix}{drinkingVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}
                                                                    </td>
                                                                </Fragment>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                                {/* Thick border between categories */}
                                                <tr className="h-1 bg-gray-200 dark:bg-slate-700"><td colSpan={2 + (data.length * 2)}></td></tr>
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>

            {/* Water Summary Chart Section */}
            {data && data.length > 0 && (
                <div id="category-summary-section" className="space-y-8 mt-12 pt-12 border-t-4 border-gray-100 dark:border-slate-700">
                    <h2 className="text-3xl font-black text-center text-gray-900 dark:text-slate-100 uppercase tracking-tight break-words max-w-4xl mx-auto">WATER</h2>
                    <h3 className="text-xl font-bold text-center text-gray-600 dark:text-slate-400 -mt-4 break-words max-w-4xl mx-auto">Water Purchase KL</h3>

                    {/* Grouped Bar Chart */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                                data={[
                                    { name: 'Normal water Purchase (Including Companies)', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.summary_chart.normal_purchase_kl }), {}) },
                                    { name: 'Normal Water Yield (including companies)', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.summary_chart.normal_yield_kl }), {}) },
                                    { name: 'Normal Water consumed (including companies)', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.summary_chart.normal_consumed_kl }), {}) },
                                    { name: 'Drinking water Purchase', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.summary_chart.drinking_purchase_kl }), {}) },
                                    { name: 'Drinking Water consumed', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.summary_chart.drinking_consumed_kl }), {}) },
                                ]}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="name"
                                    interval={0}
                                    height={120}
                                    tick={<CustomXAxisTick />}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '40px' }} />
                                {data.map((month, index) => (
                                    <Bar
                                        key={month.month_key}
                                        dataKey={month.month_name}
                                        fill={['#3b82f6', '#ec4899', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4'][index % 6]}
                                        radius={[4, 4, 0, 0]}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Summary Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <table className="min-w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-900/50">
                                    <th className="px-4 py-3 border dark:border-slate-700 text-left font-bold text-gray-500 uppercase">Period</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Normal water Purchase</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Normal Water Yield</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Normal Water consumed</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Drinking water Purchase</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Drinking Water consumed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {data.map((month, index) => {
                                    const dotColor = ['bg-blue-500', 'bg-pink-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-cyan-500'][index % 6];
                                    return (
                                        <tr key={month.month_key} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-4 py-3 border dark:border-slate-700 font-medium text-gray-900 dark:text-slate-100 whitespace-nowrap">
                                                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${dotColor}`}></span>
                                                {month.month_name}
                                            </td>
                                            <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.summary_chart.normal_purchase_kl.toLocaleString(undefined, { minimumFractionDigits: 0 })}</td>
                                            <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.summary_chart.normal_yield_kl.toLocaleString(undefined, { minimumFractionDigits: 0 })}</td>
                                            <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.summary_chart.normal_consumed_kl.toLocaleString(undefined, { minimumFractionDigits: 0 })}</td>
                                            <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.summary_chart.drinking_purchase_kl.toLocaleString(undefined, { minimumFractionDigits: 0 })}</td>
                                            <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.summary_chart.drinking_consumed_kl.toLocaleString(undefined, { minimumFractionDigits: 0 })}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-gray-50 dark:bg-slate-900 font-black text-gray-900 dark:text-slate-100">
                                <tr>
                                    <td className="px-4 py-3 border dark:border-slate-700 uppercase">TOTAL</td>
                                    <td className="px-4 py-3 border dark:border-slate-700 text-right">{data.reduce((sum, m) => sum + m.summary_chart.normal_purchase_kl, 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}</td>
                                    <td className="px-4 py-3 border dark:border-slate-700 text-right">{data.reduce((sum, m) => sum + m.summary_chart.normal_yield_kl, 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}</td>
                                    <td className="px-4 py-3 border dark:border-slate-700 text-right">{data.reduce((sum, m) => sum + m.summary_chart.normal_consumed_kl, 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}</td>
                                    <td className="px-4 py-3 border dark:border-slate-700 text-right">{data.reduce((sum, m) => sum + m.summary_chart.drinking_purchase_kl, 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}</td>
                                    <td className="px-4 py-3 border dark:border-slate-700 text-right">{data.reduce((sum, m) => sum + m.summary_chart.drinking_consumed_kl, 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* Water Purchase Amount Section */}
            {data && data.length > 0 && (
                <div id="category-amount-summary-section" className="space-y-8 mt-12 pt-12 border-t-4 border-gray-100 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-center text-gray-600 dark:text-slate-400 break-words max-w-4xl mx-auto">Water Purchase Amount</h3>

                    {/* Grouped Bar Chart (Amount) */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                                data={[
                                    { name: 'Normal water Purchase (Including Companies)', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.summary_chart.normal_purchase_amt }), {}) },
                                    { name: 'Normal Water Yield (including companies)', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.summary_chart.normal_yield_amt }), {}) },
                                    { name: 'Normal Water consumed (including companies)', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.summary_chart.normal_consumed_amt }), {}) },
                                    { name: 'Drinking water Purchase', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.summary_chart.drinking_purchase_amt }), {}) },
                                    { name: 'Drinking Water consumed', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.summary_chart.drinking_consumed_amt }), {}) },
                                ]}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="name"
                                    interval={0}
                                    height={120}
                                    tick={<CustomXAxisTick />}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    formatter={(value) => `₹ ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '40px' }} />
                                {data.map((month, index) => (
                                    <Bar
                                        key={month.month_key}
                                        dataKey={month.month_name}
                                        fill={['#3b82f6', '#ec4899', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4'][index % 6]}
                                        radius={[4, 4, 0, 0]}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Summary Table (Amount) */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <table className="min-w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-900/50">
                                    <th className="px-4 py-3 border dark:border-slate-700 text-left font-bold text-gray-500 uppercase">Period</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Normal water Purchase</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Normal Water Yield</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Normal Water consumed</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Drinking water Purchase</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Drinking Water consumed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {data.map((month, index) => {
                                    const dotColor = ['bg-blue-500', 'bg-pink-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-cyan-500'][index % 6];
                                    return (
                                        <tr key={month.month_key} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-4 py-3 border dark:border-slate-700 font-medium text-gray-900 dark:text-slate-100 whitespace-nowrap">
                                                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${dotColor}`}></span>
                                                {month.month_name}
                                            </td>
                                            <td className="px-4 py-3 border dark:border-slate-700 text-right">₹{month.summary_chart.normal_purchase_amt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                            <td className="px-4 py-3 border dark:border-slate-700 text-right">₹{month.summary_chart.normal_yield_amt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                            <td className="px-4 py-3 border dark:border-slate-700 text-right">₹{month.summary_chart.normal_consumed_amt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                            <td className="px-4 py-3 border dark:border-slate-700 text-right">₹{month.summary_chart.drinking_purchase_amt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                            <td className="px-4 py-3 border dark:border-slate-700 text-right">₹{month.summary_chart.drinking_consumed_amt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-gray-50 dark:bg-slate-900 font-black text-gray-900 dark:text-slate-100">
                                <tr>
                                    <td className="px-4 py-3 border dark:border-slate-700 uppercase">TOTAL</td>
                                    <td className="px-4 py-3 border dark:border-slate-700 text-right">₹{data.reduce((sum, m) => sum + m.summary_chart.normal_purchase_amt, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                    <td className="px-4 py-3 border dark:border-slate-700 text-right">₹{data.reduce((sum, m) => sum + m.summary_chart.normal_yield_amt, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                    <td className="px-4 py-3 border dark:border-slate-700 text-right">₹{data.reduce((sum, m) => sum + m.summary_chart.normal_consumed_amt, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                    <td className="px-4 py-3 border dark:border-slate-700 text-right">₹{data.reduce((sum, m) => sum + m.summary_chart.drinking_purchase_amt, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                    <td className="px-4 py-3 border dark:border-slate-700 text-right">₹{data.reduce((sum, m) => sum + m.summary_chart.drinking_consumed_amt, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* Consumption Summary (Institute) */}
            {data && data.length > 0 && data.some(m => m.institute_summary) && (
                <div className="space-y-8 mt-12 pt-12 border-t-4 border-gray-100 dark:border-slate-700">
                    <h2 className="text-4xl font-black text-center text-gray-900 dark:text-white uppercase tracking-tighter break-words max-w-4xl mx-auto">Normal Water Consumption</h2>
                    <h3 className="text-xl font-bold text-center text-gray-600 dark:text-slate-400 break-words max-w-4xl mx-auto">Normal Water Consumption Institute</h3>

                    {/* Chart (Institute) */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                                data={[
                                    { name: 'Normal Water Consumption Ltr Institute', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.institute_summary?.consumption_ltrs || 0 }), {}) },
                                    { name: 'Normal Water Consumption Cost Institute', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.institute_summary?.consumption_cost || 0 }), {}) },
                                    { name: 'No of Students in Institute', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.institute_summary?.student_count || 0 }), {}) },
                                    { name: 'Normal water - Ltr per student per day - Institute', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.institute_summary?.ltrs_per_student || 0 }), {}) },
                                    { name: 'Normal Water cost Per student per day Institute', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.institute_summary?.cost_per_student || 0 }), {}) },
                                ]}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" interval={0} height={120} tick={<CustomXAxisTick />} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} formatter={(value) => value.toLocaleString()} />
                                <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '40px' }} />
                                {data.map((month, index) => (
                                    <Bar key={month.month_key} dataKey={month.month_name} fill={['#3b82f6', '#ec4899', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4'][index % 6]} radius={[4, 4, 0, 0]} />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Table (Institute) */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <table className="min-w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-900/50">
                                    <th className="px-4 py-3 border dark:border-slate-700 text-left font-bold text-gray-500 uppercase">Period</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Normal Water Consumption Ltr Institute</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Normal Water Consumption Cost Institute</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">No of Students in Institute</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Normal water - Ltr per student per day - Institute</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Normal Water cost Per student per day Institute</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {data.map((month) => (
                                    <tr key={month.month_key} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 border dark:border-slate-700 font-medium whitespace-nowrap">{month.month_name}</td>
                                        <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.institute_summary?.consumption_ltrs.toLocaleString() || 0}</td>
                                        <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.institute_summary?.consumption_cost.toLocaleString() || 0}</td>
                                        <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.institute_summary?.student_count.toLocaleString() || 0}</td>
                                        <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.institute_summary?.ltrs_per_student.toLocaleString() || 0}</td>
                                        <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.institute_summary?.cost_per_student.toLocaleString() || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Consumption Summary (Schools) */}
            {data && data.length > 0 && data.some(m => m.schools_summary) && (
                <div className="space-y-8 mt-12 pt-12 border-t-4 border-gray-100 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-center text-gray-600 dark:text-slate-400 break-words max-w-4xl mx-auto">Normal Water Consumption Schools</h3>

                    {/* Chart (Schools) */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                                data={[
                                    { name: 'Normal Water Consumption Ltr Schools', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.schools_summary?.consumption_ltrs || 0 }), {}) },
                                    { name: 'Normal Water Consumption Cost Schools', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.schools_summary?.consumption_cost || 0 }), {}) },
                                    { name: 'No of Students in Schools', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.schools_summary?.student_count || 0 }), {}) },
                                    { name: 'Normal water - Ltr per student per day - Schools', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.schools_summary?.ltrs_per_student || 0 }), {}) },
                                    { name: 'Normal Water cost Per student per day Schools', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.schools_summary?.cost_per_student || 0 }), {}) },
                                ]}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" interval={0} height={120} tick={<CustomXAxisTick />} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} formatter={(value) => value.toLocaleString()} />
                                <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '40px' }} />
                                {data.map((month, index) => (
                                    <Bar key={month.month_key} dataKey={month.month_name} fill={['#3b82f6', '#ec4899', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4'][index % 6]} radius={[4, 4, 0, 0]} />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Table (Schools) */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <table className="min-w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-900/50">
                                    <th className="px-4 py-3 border dark:border-slate-700 text-left font-bold text-gray-500 uppercase">Period</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Normal Water Consumption Ltr Schools</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Normal Water Consumption Cost Schools</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">No of Students in Schools</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Normal water - Ltr per student per day - Schools</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Normal Water cost Per student per day Schools</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {data.map((month) => (
                                    <tr key={month.month_key} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 border dark:border-slate-700 font-medium whitespace-nowrap">{month.month_name}</td>
                                        <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.schools_summary?.consumption_ltrs.toLocaleString() || 0}</td>
                                        <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.schools_summary?.consumption_cost.toLocaleString() || 0}</td>
                                        <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.schools_summary?.student_count.toLocaleString() || 0}</td>
                                        <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.schools_summary?.ltrs_per_student.toLocaleString() || 0}</td>
                                        <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.schools_summary?.cost_per_student.toLocaleString() || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Consumption Summary (Hostels) */}
            {data && data.length > 0 && data.some(m => m.hostels_summary) && (
                <div className="space-y-8 mt-12 pt-12 border-t-4 border-gray-100 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-center text-gray-600 dark:text-slate-400 break-words max-w-4xl mx-auto">Normal Water Consumption Hostels</h3>

                    {/* Chart (Hostels) */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                                data={[
                                    { name: 'Normal Water Consumption Ltr Hostels', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.hostels_summary?.consumption_ltrs || 0 }), {}) },
                                    { name: 'Normal Water Consumption Cost Hostels', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.hostels_summary?.consumption_cost || 0 }), {}) },
                                    { name: 'No of Students in Hostels', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.hostels_summary?.student_count || 0 }), {}) },
                                    { name: 'Normal water - Ltr per student per day - Hostels', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.hostels_summary?.ltrs_per_student || 0 }), {}) },
                                    { name: 'Normal Water cost Per student per day Hostels', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.hostels_summary?.cost_per_student || 0 }), {}) },
                                ]}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" interval={0} height={120} tick={<CustomXAxisTick />} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} formatter={(value) => value.toLocaleString()} />
                                <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '40px' }} />
                                {data.map((month, index) => (
                                    <Bar key={month.month_key} dataKey={month.month_name} fill={['#3b82f6', '#ec4899', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4'][index % 6]} radius={[4, 4, 0, 0]} />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Table (Hostels) */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <table className="min-w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-900/50">
                                    <th className="px-4 py-3 border dark:border-slate-700 text-left font-bold text-gray-500 uppercase">Period</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Normal Water Consumption Ltr Hostels</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Normal Water Consumption Cost Hostels</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">No of Students in Hostels</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Normal water - Ltr per student per day - Hostels</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Normal Water cost Per student per day Hostels</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {data.map((month) => (
                                    <tr key={month.month_key} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 border dark:border-slate-700 font-medium whitespace-nowrap">{month.month_name}</td>
                                        <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.hostels_summary?.consumption_ltrs.toLocaleString() || 0}</td>
                                        <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.hostels_summary?.consumption_cost.toLocaleString() || 0}</td>
                                        <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.hostels_summary?.student_count.toLocaleString() || 0}</td>
                                        <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.hostels_summary?.ltrs_per_student.toLocaleString() || 0}</td>
                                        <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.hostels_summary?.cost_per_student.toLocaleString() || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Consumption Summary (Kitchen) */}
            {data && data.length > 0 && data.some(m => m.kitchen_summary) && (
                <div className="space-y-8 mt-12 pt-12 border-t-4 border-gray-100 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-center text-gray-600 dark:text-slate-400 break-words max-w-4xl mx-auto">Normal Water Consumption Kitchen</h3>

                    {/* Chart (Kitchen) */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                                data={[
                                    { name: 'Normal Water Consumption Ltr Kitchen', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.kitchen_summary?.consumption_ltrs || 0 }), {}) },
                                    { name: 'Normal Water Consumption Cost Kitchen', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.kitchen_summary?.consumption_cost || 0 }), {}) },
                                    { name: 'No of Students in Hostels', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.kitchen_summary?.student_count || 0 }), {}) },
                                    { name: 'Ltr per student per day - Food', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.kitchen_summary?.ltrs_per_student || 0 }), {}) },
                                    { name: 'Normal Water cost Per student per day Food', ...data.reduce((acc, m) => ({ ...acc, [m.month_name]: m.kitchen_summary?.cost_per_student || 0 }), {}) },
                                ]}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" interval={0} height={120} tick={<CustomXAxisTick />} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} formatter={(value) => value.toLocaleString()} />
                                <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '40px' }} />
                                {data.map((month, index) => (
                                    <Bar key={month.month_key} dataKey={month.month_name} fill={['#3b82f6', '#ec4899', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4'][index % 6]} radius={[4, 4, 0, 0]} />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Table (Kitchen) */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <table className="min-w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-900/50">
                                    <th className="px-4 py-3 border dark:border-slate-700 text-left font-bold text-gray-500 uppercase">Period</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Normal Water Consumption Ltr Kitchen</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Normal Water Consumption Cost Kitchen</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">No of Students in Hostels</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Ltr per student per day - Food</th>
                                    <th className="px-4 py-3 border dark:border-slate-700 text-center font-bold text-gray-500 uppercase">Normal Water cost Per student per day Food</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {data.map((month) => (
                                    <tr key={month.month_key} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 border dark:border-slate-700 font-medium whitespace-nowrap">{month.month_name}</td>
                                        <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.kitchen_summary?.consumption_ltrs.toLocaleString() || 0}</td>
                                        <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.kitchen_summary?.consumption_cost.toLocaleString() || 0}</td>
                                        <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.kitchen_summary?.student_count.toLocaleString() || 0}</td>
                                        <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.kitchen_summary?.ltrs_per_student.toLocaleString() || 0}</td>
                                        <td className="px-4 py-3 border dark:border-slate-700 text-right">{month.kitchen_summary?.cost_per_student.toLocaleString() || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default CategoryMonthlyBreakdown;
