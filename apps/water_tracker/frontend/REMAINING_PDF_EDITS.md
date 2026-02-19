# Remaining PDF Export UI Elements

## Reports Needing UI Completion

### Cost Comparison
```javascript
// Line ~50 - Add export button header
<div className="flex justify-between items-center">
    <h2 className="text-2xl font-bold text-gray-900">Cost Comparison</h2>
    <button onClick={handleExportPDF} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export PDF
    </button>
</div>

// Chart container: id="cost-comparison-chart"
// Table container: id="cost-comparison-table"
```

### Daily Movement  
```javascript
// Line ~50 - Add export button header
<div className="flex justify-between items-center">
    <h2 className="text-2xl font-bold text-gray-900">Daily Movement</h2>
    <button onClick={handleExport PDF} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export PDF
    </button>
</div>

// Chart container: id="daily-movement-chart"
// Table container: id="daily-movement-table"
```

### Yearly Trend
```javascript
// Line ~45 - Add export button header
<div className="flex justify-between items-center">
    <h2 className="text-2xl font-bold text-gray-900">Yearly Trend</h2>
    <button onClick={handleExportPDF} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export PDF
    </button>
</div>

// Chart container: id="yearly-trend-chart"
// Table container: id="yearly-trend-table"
```

### Water Type Consumption
```javascript
// Line ~50 - Add export button header
<div className="flex justify-between items-center">
    <h2 className="text-2xl font-bold text-gray-900">Water Type Consumption</h2>
    <button onClick={handleExportPDF} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export PDF
    </button>
</div>

// Chart container: id="water-type-chart"
// Table container: id="water-type-table"
```
