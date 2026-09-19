import { useState } from 'react';
import { Download, CheckCircle, Calendar, AlertTriangle, FileText, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BorrowRequest } from '../types';
import { BorrowingSlip } from './BorrowingSlip';

interface ApprovedRequestsProps {
  requests: BorrowRequest[];
}

export function ApprovedRequests({ requests }: ApprovedRequestsProps) {
  const [selectedSlip, setSelectedSlip] = useState<BorrowRequest | null>(null);
  const calculatePenalty = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return diffDays * 20; // 20 pesos per day
    }
    return 0;
  };

  const isOverdue = (dueDate: string): boolean => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return today > due;
  };

  const getDaysOverdue = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const generatePDF = (request: BorrowRequest) => {
    const doc = new jsPDF();
    const penalty = calculatePenalty(request.dueDate);
    const overdue = isOverdue(request.dueDate);

    // Header
    doc.setFontSize(22);
    doc.setTextColor(55, 65, 81);
    doc.text('Equipment Borrowing Receipt', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text('Equipment Borrowing & Return Tracking System', 105, 28, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 34, { align: 'center' });

    // Student Information
    doc.setFontSize(14);
    doc.setTextColor(55, 65, 81);
    doc.text('Student Information', 20, 50);
    
    const studentInfo = [
      ['Student ID:', request.studentId],
      ['Student Name:', request.studentName],
      ['Course/Section:', request.studentCourse],
      ['Contact Number:', request.studentContact],
    ];

    autoTable(doc, {
      startY: 55,
      head: [],
      body: studentInfo,
      theme: 'plain',
      styles: { fontSize: 10, textColor: [55, 65, 81] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45, textColor: [107, 114, 128] },
        1: { cellWidth: 'auto' },
      },
    });

    // Equipment Information
    doc.setFontSize(14);
    doc.setTextColor(55, 65, 81);
    doc.text('Equipment Information', 20, (doc as any).lastAutoTable.finalY + 15);
    
    const equipmentInfo = [
      ['Equipment Name:', request.equipmentName],
      ['QR Code:', request.equipmentQRCode],
      ['Status:', request.status],
      ['Approved By:', request.approvedBy || 'N/A'],
      ['Approved Date:', request.approvedDate || 'N/A'],
    ];

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [],
      body: equipmentInfo,
      theme: 'plain',
      styles: { fontSize: 10, textColor: [55, 65, 81] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45, textColor: [107, 114, 128] },
        1: { cellWidth: 'auto' },
      },
    });

    // Dates & Penalty
    doc.setFontSize(14);
    doc.setTextColor(55, 65, 81);
    doc.text('Borrowing Details', 20, (doc as any).lastAutoTable.finalY + 15);
    
    const dateInfo = [
      ['Request Date:', request.requestDate],
      ['Due Date:', request.dueDate],
      ['Days Overdue:', overdue ? `${getDaysOverdue(request.dueDate)} days` : 'None'],
      ['Penalty (₱20/day):', overdue ? `₱${penalty}.00` : '₱0.00'],
    ];

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [],
      body: dateInfo,
      theme: 'plain',
      styles: { 
        fontSize: 10,
        textColor: [55, 65, 81]
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45, textColor: [107, 114, 128] },
        1: { 
          cellWidth: 'auto',
          textColor: overdue && (dateInfo[2][0] === 'Days Overdue:' || dateInfo[3][0] === 'Penalty (₱20/day):') 
            ? [239, 68, 68] 
            : [55, 65, 81]
        },
      },
    });

    // Warning if overdue
    if (overdue) {
      doc.setFontSize(10);
      doc.setTextColor(239, 68, 68);
      const yPos = (doc as any).lastAutoTable.finalY + 10;
      doc.text('⚠️ OVERDUE: Please return immediately to avoid additional penalties.', 20, yPos);
    }

    // Terms and Conditions
    doc.setFontSize(12);
    doc.setTextColor(55, 65, 81);
    doc.text('Terms and Conditions', 20, (doc as any).lastAutoTable.finalY + 25);
    
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    const terms = [
      '1. The borrower is responsible for the equipment and must return it in good condition.',
      '2. Equipment must be returned on or before the due date.',
      '3. Late returns incur a penalty of ₱20.00 per day.',
      '4. Any damage or loss must be reported immediately to the admin.',
      '5. The borrower may be liable for repair or replacement costs.',
      '6. Penalties must be settled before borrowing new equipment.',
    ];

    let yPosition = (doc as any).lastAutoTable.finalY + 32;
    terms.forEach(term => {
      doc.text(term, 20, yPosition);
      yPosition += 5;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('This is a computer-generated document from the Equipment Borrowing System.', 105, 280, { align: 'center' });
    doc.text('For inquiries, please contact the admin office.', 105, 285, { align: 'center' });

    // Save
    doc.save(`borrowing-receipt-${request.id}.pdf`);
  };

  const generateAllPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(55, 65, 81);
    doc.text('All Approved Requests', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });
    doc.text(`Total Records: ${requests.length}`, 105, 34, { align: 'center' });

    // Table data
    const tableData = requests.map(req => {
      const penalty = calculatePenalty(req.dueDate);
      return [
        req.requestDate,
        req.equipmentName,
        req.equipmentQRCode,
        req.dueDate,
        penalty > 0 ? `₱${penalty}` : '-',
        req.status,
      ];
    });

    autoTable(doc, {
      startY: 45,
      head: [['Request Date', 'Equipment', 'QR Code', 'Due Date', 'Penalty', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [75, 85, 99], textColor: [255, 255, 255] },
      styles: { fontSize: 9, textColor: [55, 65, 81] },
    });

    // Summary
    const totalPenalties = requests.reduce((sum, req) => sum + calculatePenalty(req.dueDate), 0);
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    const yPos = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total Penalties: ₱${totalPenalties}.00`, 20, yPos);

    doc.save('all-approved-requests.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl text-gray-800">Approved Requests</h2>
        {requests.length > 0 && (
          <button
            onClick={generateAllPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
          >
            <Download className="w-4 h-4" />
            Download All (PDF)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {requests.map(request => {
          const penalty = calculatePenalty(request.dueDate);
          const overdue = isOverdue(request.dueDate);

          return (
            <div key={request.id} className={`bg-white rounded-lg shadow-sm p-6 border-2 ${
              overdue ? 'border-red-300' : 'border-gray-200'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    overdue ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {overdue ? (
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg text-gray-900 mb-1">{request.equipmentName}</h3>
                    <p className="text-sm text-gray-600">Request ID: {request.id}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 text-sm rounded-full ${
                  overdue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {overdue ? 'Overdue' : 'Active'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Request Date:</span>
                    <span className="text-gray-900">{request.requestDate}</span>
                  </div>
                  {request.borrowTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Borrow Time:</span>
                      <span className="text-blue-600 font-medium">{request.borrowTime}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Due Date:</span>
                    <span className={overdue ? 'text-red-600' : 'text-gray-900'}>
                      {request.dueDate}
                    </span>
                  </div>
                  {request.dueTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Due Time:</span>
                      <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-900 font-medium'}>
                        {request.dueTime}
                      </span>
                    </div>
                  )}
                  {request.approvedDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Approved:</span>
                      <span className="text-gray-900">{request.approvedDate}</span>
                    </div>
                  )}
                  {penalty > 0 && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 mb-1">
                        Overdue by {getDaysOverdue(request.dueDate)} day(s)
                      </p>
                      <p className="text-lg text-red-700">
                        Penalty: ₱{penalty}.00
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg flex justify-center items-center border border-gray-200">
                  <QRCodeSVG 
                    value={request.equipmentQRCode} 
                    size={120} 
                    level="H"
                    includeMargin={true}
                    fgColor="#1F2937"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedSlip(request)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  <FileText className="w-4 h-4" />
                  View Borrowing Slip
                </button>
                <button
                  onClick={() => generatePDF(request)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Download Receipt (PDF)
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {requests.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No approved requests yet</p>
          <p className="text-sm text-gray-500 mt-1">Submit a request to borrow equipment</p>
        </div>
      )}

      {/* Borrowing Slip Modal */}
      {selectedSlip && (
        <BorrowingSlip
          request={selectedSlip}
          onClose={() => setSelectedSlip(null)}
        />
      )}
    </div>
  );
}
