import { Clock, XCircle, Download, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BorrowRequest } from '../types';

interface PendingRequestsPageProps {
  requests: BorrowRequest[];
}

export function PendingRequestsPage({ requests }: PendingRequestsPageProps) {
  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const rejectedRequests = requests.filter(r => r.status === 'Rejected');

  const generatePDF = (request: BorrowRequest) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(249, 115, 22);
    doc.text('Pending/Rejected Request Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text('Equipment Borrowing & Return Tracking System', 105, 28, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 34, { align: 'center' });

    if (request.isMobileApp) {
      doc.setTextColor(59, 130, 246);
      doc.text('📱 SCANNED AND BORROWED VIA MOBILE APP', 105, 40, { align: 'center' });
    }

    // Student Information
    doc.setFontSize(14);
    doc.setTextColor(55, 65, 81);
    doc.text('Student Information', 20, request.isMobileApp ? 55 : 50);
    
    const studentInfo = [
      ['Student ID:', request.studentId],
      ['Student Name:', request.studentName],
      ['Course/Section:', request.studentCourse],
      ['Contact Number:', request.studentContact],
    ];

    autoTable(doc, {
      startY: request.isMobileApp ? 60 : 55,
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
      ['Request Date:', request.requestDate],
      ['Requested Due Date:', request.dueDate],
      request.isMobileApp ? ['Access Method:', 'Mobile App (QR Scan)'] : null,
    ].filter(Boolean) as string[][];

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

    // Status
    doc.setFontSize(12);
    doc.setTextColor(249, 115, 22);
    doc.text(`Request Status: ${request.status}`, 20, (doc as any).lastAutoTable.finalY + 15);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('This is a computer-generated document from the Equipment Borrowing System.', 105, 280, { align: 'center' });

    doc.save(`${request.status.toLowerCase()}-request-${request.id}.pdf`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl text-gray-800">Pending & Rejected Requests</h2>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg text-orange-700 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Approval ({pendingRequests.length})
          </h3>
          {pendingRequests.map(request => (
            <div key={request.id} className="bg-white rounded-lg shadow-sm p-6 border-2 border-orange-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-lg text-gray-900 mb-1">{request.equipmentName}</h4>
                    <p className="text-sm text-gray-600">Request ID: {request.id}</p>
                    {request.isMobileApp && (
                      <div className="flex items-center gap-1 mt-1">
                        <Smartphone className="w-3 h-3 text-blue-600" />
                        <span className="text-xs text-blue-600">Mobile App Request</span>
                      </div>
                    )}
                  </div>
                </div>
                <span className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-full">
                  Pending
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Request Date:</span>
                    <span className="text-gray-900">{request.requestDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="text-gray-900">{request.dueDate}</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg flex justify-center border border-gray-200">
                  <QRCodeSVG 
                    value={request.equipmentQRCode} 
                    size={100} 
                    level="H"
                    includeMargin={true}
                    fgColor="#1F2937"
                  />
                </div>
              </div>

              <button
                onClick={() => generatePDF(request)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
              >
                <Download className="w-4 h-4" />
                Download Report (PDF)
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Rejected Requests */}
      {rejectedRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg text-red-700 flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            Rejected ({rejectedRequests.length})
          </h3>
          {rejectedRequests.map(request => (
            <div key={request.id} className="bg-white rounded-lg shadow-sm p-6 border-2 border-red-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-lg text-gray-900 mb-1">{request.equipmentName}</h4>
                    <p className="text-sm text-gray-600">Request ID: {request.id}</p>
                    {request.isMobileApp && (
                      <div className="flex items-center gap-1 mt-1">
                        <Smartphone className="w-3 h-3 text-blue-600" />
                        <span className="text-xs text-blue-600">Mobile App Request</span>
                      </div>
                    )}
                  </div>
                </div>
                <span className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full">
                  Rejected
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Request Date:</span>
                    <span className="text-gray-900">{request.requestDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="text-gray-900">{request.dueDate}</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg flex justify-center border border-gray-200">
                  <QRCodeSVG 
                    value={request.equipmentQRCode} 
                    size={100} 
                    level="H"
                    includeMargin={true}
                    fgColor="#1F2937"
                  />
                </div>
              </div>

              <button
                onClick={() => generatePDF(request)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
              >
                <Download className="w-4 h-4" />
                Download Report (PDF)
              </button>
            </div>
          ))}
        </div>
      )}

      {pendingRequests.length === 0 && rejectedRequests.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No pending or rejected requests</p>
        </div>
      )}
    </div>
  );
}
