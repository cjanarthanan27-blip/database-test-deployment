import * as XLSX from 'xlsx';

/**
 * Export data to Excel file
 * @param {Array} data - Array of objects representing table rows
 * @param {string} filename - Base filename (without extension)
 * @param {string} sheetName - Name of the Excel sheet
 * @param {string} title - Report title (optional)
 * @param {string} dateRange - Date range text (optional)
 * @param {Array} summaryData - Array of arrays for summary section (optional)
 */
export const exportToExcel = (data, filename, sheetName = 'Sheet1', title = '', dateRange = '', summaryData = []) => {
    try {
        // Create a new workbook
        const wb = XLSX.utils.book_new();

        // Prepare data with title, date range, and summary if provided
        let wsData = [];

        if (title) {
            wsData.push([title]);
            wsData.push([]); // Empty row
        }

        if (dateRange) {
            wsData.push([dateRange]);
            wsData.push([]); // Empty row
        }

        if (summaryData && summaryData.length > 0) {
            wsData = wsData.concat(summaryData);
            wsData.push([]); // Empty row after summary
        }

        // Convert data to worksheet format
        const dataWs = XLSX.utils.json_to_sheet(data);

        // If we have title/date range/summary, we need to merge them with the data
        let ws;
        if (wsData.length > 0) {
            // Convert existing data to array format
            const dataArray = XLSX.utils.sheet_to_json(dataWs, { header: 1 });
            wsData = wsData.concat(dataArray);

            // Create worksheet from combined data
            ws = XLSX.utils.aoa_to_sheet(wsData);
        } else {
            ws = dataWs;
        }

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        // Generate filename with current date
        const dateStr = new Date().toISOString().split('T')[0];
        const fullFilename = `${filename}_${dateStr}.xlsx`;

        // Write file
        XLSX.writeFile(wb, fullFilename);

        return { success: true };
    } catch (error) {
        console.error('Excel Export Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Format date to DD-MM-YYYY
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} - Formatted date
 */
export const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
        const [year, month, day] = dateStr.split('-');
        return `${day}-${month}-${year}`;
    } catch {
        return dateStr;
    }
};

/**
 * Format date range text for display
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {string} - Formatted date range
 */
export const formatDateRange = (startDate, endDate) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return `Period: ${start} to ${end}`;
};

/**
 * Format month/year range text for display
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {string} - Formatted month/year
 */
export const formatMonthYear = (year, month) => {
    const date = new Date(year, month - 1, 1);
    return `Period: ${date.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
};
