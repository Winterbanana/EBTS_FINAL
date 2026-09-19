import { QRCodeSVG } from 'qrcode.react';
import { Download, X, Clock, User, Package, Calendar, Phone } from 'lucide-react';
import { BorrowRequest } from '../types';

interface BorrowingSlipProps {
  request: BorrowRequest;
  onClose: () => void;
}

export function BorrowingSlip({ request, onClose }: BorrowingSlipProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a simple download of the slip data
    const slipData = `
EQUIPMENT BORROWING SLIP
========================

Borrower Information:
--------------------
Name: ${request.studentName}
ID: ${request.studentId}
Course/Section: ${request.studentCourse}
Contact: ${request.studentContact}

Equipment Information:
--------------------
Item Name: ${request.equipmentName}
Equipment ID: ${request.equipmentId}
QR Code: ${request.equipmentQRCode}
Condition: ${request.conditionBefore || 'N/A'}

Borrowing Details:
-----------------
Request Date: ${request.requestDate}
Borrow Time: ${request.borrowTime || 'N/A'}
Due Time: ${request.dueTime || 'N/A'}
Status: ${request.status}
${request.approvedBy ? `Approved By: ${request.approvedBy}` : ''}
${request.approvedDate ? `Approved Date: ${request.approvedDate}` : ''}

Note: Equipment must be returned on time.
Late returns incur a penalty of ₱20 per hour.

Generated: ${new Date().toLocaleString()}
========================
    `;

    const blob = new Blob([slipData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `borrowing-slip-${request.id}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gray-900 text-white p-6 rounded-t-xl flex items-center justify-between print:bg-white print:text-black">
          <h2 className="text-xl">Equipment Borrowing Slip</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-gray-800 p-2 rounded-lg transition-colors print:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6" id="slip-content">
          {/* Header Info */}
          <div className="text-center border-b border-gray-200 pb-4">
            <h1 className="text-2xl text-gray-900 mb-1">Equipment Borrowing and Tracking Return System</h1>
            <p className="text-sm text-gray-600">WCC - Official Borrowing Receipt</p>
            <p className="text-xs text-gray-500 mt-2">Slip ID: {request.id}</p>
          </div>

          {/* QR Code Section */}
          <div className="flex justify-center bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="text-center">
              <QRCodeSVG
                value={request.equipmentQRCode}
                size={150}
                level="H"
                includeMargin={true}
                fgColor="#1F2937"
              />
              <p className="text-xs text-gray-600 mt-2">Equipment QR Code</p>
              <p className="text-xs text-gray-500">{request.equipmentQRCode}</p>
            </div>
          </div>

          {/* Borrower Information */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-sm text-blue-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Borrower Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-blue-700">Name:</p>
                <p className="text-blue-900">{request.studentName}</p>
              </div>
              <div>
                <p className="text-blue-700">Student ID:</p>
                <p className="text-blue-900">{request.studentId}</p>
              </div>
              <div>
                <p className="text-blue-700">Course/Section:</p>
                <p className="text-blue-900">{request.studentCourse}</p>
              </div>
              <div>
                <p className="text-blue-700 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  Contact:
                </p>
                <p className="text-blue-900">{request.studentContact}</p>
              </div>
            </div>
          </div>

          {/* Equipment Information */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="text-sm text-green-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Equipment Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-green-700">Item Name:</p>
                <p className="text-green-900">{request.equipmentName}</p>
              </div>
              <div>
                <p className="text-green-700">Equipment ID:</p>
                <p className="text-green-900">{request.equipmentId}</p>
              </div>
              <div>
                <p className="text-green-700">Condition:</p>
                <p className="text-green-900">{request.conditionBefore || 'Good'}</p>
              </div>
              <div>
                <p className="text-green-700">Status:</p>
                <span className={`inline-block px-2 py-1 rounded text-xs ${
                  request.status === 'Approved' ? 'bg-green-200 text-green-800' :
                  request.status === 'Pending' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-gray-200 text-gray-800'
                }`}>
                  {request.status}
                </span>
              </div>
            </div>
          </div>

          {/* Borrowing Details */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="text-sm text-purple-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Borrowing Schedule
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-purple-700 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Request Date:
                </p>
                <p className="text-purple-900">{request.requestDate}</p>
              </div>
              <div>
                <p className="text-purple-700">Borrow Time:</p>
                <p className="text-purple-900 text-lg">{request.borrowTime || 'N/A'}</p>
              </div>
              <div>
                <p className="text-purple-700">Due Date:</p>
                <p className="text-purple-900">{request.dueDate}</p>
              </div>
              <div>
                <p className="text-purple-700">Due Time:</p>
                <p className="text-purple-900 text-lg">{request.dueTime || 'N/A'}</p>
              </div>
            </div>
            {request.borrowTime && request.dueTime && (
              <div className="mt-3 pt-3 border-t border-purple-200">
                <p className="text-xs text-purple-700">
                  Duration: 8 hours (school time only)
                </p>
              </div>
            )}
          </div>

          {/* Approval Information */}
          {request.approvedBy && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm text-gray-900 mb-2">Approval Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Approved By:</p>
                  <p className="text-gray-900">{request.approvedBy}</p>
                </div>
                <div>
                  <p className="text-gray-600">Approval Date:</p>
                  <p className="text-gray-900">{request.approvedDate}</p>
                </div>
              </div>
            </div>
          )}

          {/* Important Notice */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="text-sm text-orange-900 mb-2">⚠️ Important Reminders:</h4>
            <ul className="text-xs text-orange-800 space-y-1">
              <li>• Equipment must be returned within 8 hours from borrow time</li>
              <li>• Late returns incur a penalty of ₱20 per hour</li>
              <li>• Report any damages or issues immediately</li>
              <li>• Missing items are charged ₱200 per item</li>
              <li>• Present this slip when returning the equipment</li>
            </ul>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2 mt-12">
                <p className="text-sm text-gray-900">Borrower's Signature</p>
                <p className="text-xs text-gray-600">{request.studentName}</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2 mt-12">
                <p className="text-sm text-gray-900">Staff/Admin Signature</p>
                <p className="text-xs text-gray-600">Equipment Manager</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Generated: {new Date().toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              © 2026 Equipment Borrowing and Tracking Return System - WCC
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end print:hidden">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Print Slip
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #slip-content, #slip-content * {
            visibility: visible;
          }
          #slip-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
