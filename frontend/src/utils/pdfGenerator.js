import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePDF = (title, data, columns, filename, type) => {
    try {
        // Create PDF document
        const doc = new jsPDF();

        // Add header
        doc.setFontSize(24);
        doc.setTextColor(37, 99, 235); // Blue color for medical theme
        doc.text('MedCare', 105, 20, { align: 'center' });

        // Add title
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(title, 105, 30, { align: 'center' });

        // Add date
        doc.setFontSize(12);
        doc.setTextColor(107, 114, 128); // Gray color
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 40, { align: 'center' });

        // Prepare data for the table
        const tableData = data.map(item => columns.map(col => col.accessor(item)));

        // Configure column styles based on management type
        let columnStyles = {};
        const pageWidth = 210; // A4 width in mm
        const margin = 20; // Total margin (left + right)
        const availableWidth = pageWidth - margin;

        switch (type) {
            case 'users':
                columnStyles = {
                    0: { cellWidth: '15%' }, // User ID
                    1: { cellWidth: '25%' }, // Name
                    2: { cellWidth: '30%' }, // Email
                    3: { cellWidth: '10%' }, // Role
                    4: { cellWidth: '20%' }  // Joined Date
                };
                break;
            case 'appointments':
                columnStyles = {
                    0: { cellWidth: '15%' }, // Appointment ID
                    1: { cellWidth: '25%' }, // Customer
                    2: { cellWidth: '20%' }, // Service
                    3: { cellWidth: '25%' }, // Date & Time
                    4: { cellWidth: '15%' }  // Status
                };
                break;
            case 'orders':
                columnStyles = {
                    0: { cellWidth: '15%' }, // Order ID
                    1: { cellWidth: '25%' }, // Customer
                    2: { cellWidth: '20%' }, // Total Amount
                    3: { cellWidth: '15%' }, // Status
                    4: { cellWidth: '25%' }  // Order Date
                };
                break;
            case 'services':
                columnStyles = {
                    0: { cellWidth: '15%' }, // Service ID
                    1: { cellWidth: '25%' }, // Customer
                    2: { cellWidth: '20%' }, // Service Type
                    3: { cellWidth: '25%' }, // Date & Time
                    4: { cellWidth: '15%' }  // Status
                };
                break;
            case 'products':
                columnStyles = {
                    0: { cellWidth: '25%' }, // Product Name
                    1: { cellWidth: '15%' }, // Category
                    2: { cellWidth: '10%' }, // Price
                    3: { cellWidth: '15%' }, // Supplier
                    4: { cellWidth: '15%' }, // Brand
                    5: { cellWidth: '10%' }, // Expiry
                    6: { cellWidth: '10%' }  // Status
                };
                break;
            default:
                // Default column widths
                columnStyles = {
                    0: { cellWidth: '20%' },
                    1: { cellWidth: '20%' },
                    2: { cellWidth: '20%' },
                    3: { cellWidth: '20%' },
                    4: { cellWidth: '20%' }
                };
        }

        // Add table using autoTable
        autoTable(doc, {
            startY: 50,
            head: [columns.map(col => col.header)],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [37, 99, 235], // Blue color for medical theme
                textColor: 255,
                fontSize: 12,
                fontStyle: 'bold',
                halign: 'center',
                valign: 'middle',
                cellPadding: 5
            },
            styles: {
                fontSize: 10,
                cellPadding: 5,
                overflow: 'linebreak',
                halign: 'left',
                valign: 'middle',
                lineColor: [200, 200, 200],
                lineWidth: 0.1
            },
            alternateRowStyles: {
                fillColor: [240, 249, 255] // Light blue alternate rows
            },
            columnStyles: columnStyles,
            margin: { top: 50, right: 10, bottom: 10, left: 10 },
            tableWidth: '100%',
            showFoot: 'lastPage',
            footStyles: {
                fillColor: [240, 249, 255],
                textColor: [0, 0, 0],
                fontSize: 10,
                fontStyle: 'bold',
                halign: 'center'
            },
            foot: [['Total Records: ' + data.length]]
        });

        // Add footer
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text('© 2024 MedCare. All rights reserved.', 105, doc.internal.pageSize.height - 10, { align: 'center' });

        // Save the PDF
        doc.save(filename);

        return true;
    } catch (error) {
        console.error('Error generating PDF:', error);
        return false;
    }
}; 