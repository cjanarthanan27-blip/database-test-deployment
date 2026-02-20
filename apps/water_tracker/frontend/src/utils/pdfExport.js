import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Export a report to PDF including summary, chart and table
 * @param {string} reportTitle - The title of the report
 * @param {string} dateRange - Date range string for the report
 * @param {string} chartId - DOM element ID of the chart container
 * @param {string} tableId - DOM element ID of the table container
 * @param {string} filename - Base filename for the PDF (without .pdf extension)
 * @param {string} summaryId - DOM element ID of the summary container (optional)
 */
export const exportReportToPDF = async (reportTitle, dateRange, chartId, tableId, filename, summaryId = null) => {
    try {
        // Create new PDF document (A4 size)
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        let yPosition = margin;

        // Add report header
        pdf.setFontSize(18);
        pdf.setFont(undefined, 'bold');
        pdf.text(reportTitle, margin, yPosition);
        yPosition += 10;

        // Add date range
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(100);
        pdf.text(dateRange, margin, yPosition);
        yPosition += 10;

        // Reset text color
        pdf.setTextColor(0);

        // Capture summary if ID provided
        if (summaryId) {
            const summaryElement = document.getElementById(summaryId);
            if (summaryElement) {
                const summaryCanvas = await html2canvas(summaryElement, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    logging: false
                });

                const summaryImgData = summaryCanvas.toDataURL('image/png');
                const summaryWidth = pageWidth - (2 * margin);
                const summaryHeight = (summaryCanvas.height * summaryWidth) / summaryCanvas.width;

                // Add summary to PDF
                pdf.addImage(summaryImgData, 'PNG', margin, yPosition, summaryWidth, summaryHeight);
                yPosition += summaryHeight + 10;
            }
        }

        // Capture chart as image
        const chartElement = document.getElementById(chartId);
        if (chartElement) {
            // Check if we need a new page for the chart
            if (yPosition > pageHeight - 80) { // Approximate height check
                pdf.addPage();
                yPosition = margin;
            }

            const chartCanvas = await html2canvas(chartElement, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false
            });

            const chartImgData = chartCanvas.toDataURL('image/png');
            const chartWidth = pageWidth - (2 * margin);
            const chartHeight = (chartCanvas.height * chartWidth) / chartCanvas.width;

            // Add chart to PDF
            pdf.addImage(chartImgData, 'PNG', margin, yPosition, chartWidth, chartHeight);
            yPosition += chartHeight + 10;

            // Check if we need a new page for the table
            if (yPosition > pageHeight - 50) {
                pdf.addPage();
                yPosition = margin;
            }
        }

        // Capture table as image
        const tableElement = document.getElementById(tableId);
        if (tableElement) {
            const tableCanvas = await html2canvas(tableElement, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false
            });

            const tableImgData = tableCanvas.toDataURL('image/png');
            const tableWidth = pageWidth - (2 * margin);
            const tableHeight = (tableCanvas.height * tableWidth) / tableCanvas.width;

            // Check if table fits on current page
            if (yPosition + tableHeight > pageHeight - margin) {
                pdf.addPage();
                yPosition = margin;
            }

            // Add table to PDF
            pdf.addImage(tableImgData, 'PNG', margin, yPosition, tableWidth, tableHeight);
        }

        // Add footer with timestamp
        const timestamp = new Date().toLocaleString('en-GB');
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(`Generated on: ${timestamp}`, margin, pageHeight - 10);

        // Save the PDF
        const pdfFilename = `${filename}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(pdfFilename);

        return { success: true };
    } catch (error) {
        console.error('PDF Export Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Generate a formatted date range string
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate) => {
    const format = (dateStr) => {
        const d = new Date(dateStr);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    if (startDate && endDate) {
        return `Date Range: ${format(startDate)} to ${format(endDate)}`;
    } else if (startDate) {
        return `From: ${format(startDate)}`;
    } else if (endDate) {
        return `Until: ${format(endDate)}`;
    }
    return 'All Time';
};

/**
 * Generate date range for month/year based reports
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {string} Formatted date range
 */
export const formatMonthYearRange = (year, month) => {
    if (year && month) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return `Period: ${monthNames[month - 1]} ${year}`;
    } else if (year) {
        return `Period: Year ${year}`;
    }
    return 'Period: All Time';
};
