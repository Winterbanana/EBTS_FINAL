import { useState } from 'react';
import { X, CreditCard, Smartphone, Wallet, Download, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import { BorrowRequest } from '../types';

interface PaymentModalProps {
  request: BorrowRequest;
  onClose: () => void;
  onPaymentComplete: (requestId: string, paymentMethod: string) => void;
}

export function PaymentModal({ request, onClose, onPaymentComplete }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'gcash' | 'maya' | 'cash' | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePayment = () => {
    if (!selectedMethod) return;

    if (selectedMethod === 'cash') {
      // Generate and download PDF form
      generatePenaltyPDF(request);
      setShowSuccess(true);
      setTimeout(() => {
        onPaymentComplete(request.id, 'Cash Payment Form Downloaded');
        onClose();
      }, 2000);
    } else {
      // For digital payments (GCash/Maya)
      setShowSuccess(true);
      setTimeout(() => {
        onPaymentComplete(request.id, selectedMethod === 'gcash' ? 'GCash' : 'Maya');
        onClose();
      }, 2000);
    }
  };

  const generatePenaltyPDF = (req: BorrowRequest) => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('Equipment Borrowing and Tracking Return System', 105, 15, { align: 'center' });

    doc.setFontSize(12);
    doc.text('WCC - Penalty Payment Form', 105, 23, { align: 'center' });

    doc.setFontSize(9);
    doc.text(`Document No: ${req.id}-PENALTY-${new Date().getTime()}`, 105, 30, { align: 'center' });

    // Reset color
    doc.setTextColor(0, 0, 0);
    let yPos = 50;

    // Student Information Section
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(15, yPos, 180, 35, 3, 3, 'F');

    doc.setFontSize(12);
    doc.setTextColor(30, 64, 175);
    doc.text('Student Information', 20, yPos + 7);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Student Name: ${req.studentName}`, 20, yPos + 15);
    doc.text(`Student ID: ${req.studentId}`, 20, yPos + 22);
    doc.text(`Course & Section: ${req.course} - ${req.section}`, 20, yPos + 29);

    yPos += 45;

    // Equipment Details Section
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(15, yPos, 180, req.overdueHours ? 50 : 42, 3, 3, 'F');

    doc.setFontSize(12);
    doc.setTextColor(30, 64, 175);
    doc.text('Borrowed Equipment Details', 20, yPos + 7);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Equipment Name: ${req.equipmentName}`, 20, yPos + 15);
    doc.text(`Equipment ID: ${req.equipmentId}`, 20, yPos + 22);
    doc.text(`Borrow Date: ${req.borrowDate}`, 20, yPos + 29);
    doc.text(`Due Date: ${req.dueDate}`, 20, yPos + 36);

    if (req.overdueHours) {
      doc.text(`Overdue Hours: ${req.overdueHours} hour(s)`, 20, yPos + 43);
      yPos += 60;
    } else {
      yPos += 52;
    }

    // Penalty Box
    doc.setFillColor(254, 226, 226);
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(1);
    doc.roundedRect(15, yPos, 180, 30, 3, 3, 'FD');

    doc.setFontSize(10);
    doc.setTextColor(153, 27, 27);
    doc.text('TOTAL PENALTY AMOUNT', 105, yPos + 8, { align: 'center' });

    doc.setFontSize(24);
    doc.setTextColor(239, 68, 68);
    doc.text(`₱${req.penalty || 0}.00`, 105, yPos + 18, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(153, 27, 27);
    const penaltyNote = req.overdueHours ? `₱20.00 per hour × ${req.overdueHours} hour(s)` : 'Late return penalty';
    doc.text(penaltyNote, 105, yPos + 25, { align: 'center' });

    yPos += 38;

    // Instructions Box
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.5);
    doc.rect(15, yPos, 180, 55, 'FD');

    doc.setFontSize(11);
    doc.setTextColor(30, 64, 175);
    doc.text('Payment Instructions:', 20, yPos + 7);

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const instructions = [
      '1. Print this form and bring it to the WCC Cashier\'s Office',
      '2. Present your Student ID along with this form',
      '3. Pay the exact penalty amount in cash',
      '4. Request an official receipt from the cashier',
      '5. Submit the official receipt to the Equipment Office',
      '6. Your penalty will be marked as paid and you can return the equipment'
    ];

    instructions.forEach((instruction, index) => {
      doc.text(instruction, 20, yPos + 14 + (index * 5));
    });

    doc.setTextColor(153, 27, 27);
    doc.setFontSize(8);
    doc.text('⚠ Important: You cannot return the equipment until all penalties are paid and settled.', 20, yPos + 49);

    yPos += 63;

    // Signature Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.line(25, yPos + 15, 80, yPos + 15);
    doc.text('Student Signature', 52, yPos + 20, { align: 'center' });
    doc.setFontSize(8);
    doc.text('Date: _______________', 52, yPos + 25, { align: 'center' });

    doc.setFontSize(10);
    doc.line(130, yPos + 15, 185, yPos + 15);
    doc.text('Cashier Signature', 157, yPos + 20, { align: 'center' });
    doc.setFontSize(8);
    doc.text('Date: _______________', 157, yPos + 25, { align: 'center' });

    // Footer
    yPos += 35;
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, 195, yPos);

    doc.setFontSize(8);
    doc.setTextColor(102, 102, 102);
    doc.text('Equipment Borrowing and Tracking Return System - WCC', 105, yPos + 5, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 105, yPos + 10, { align: 'center' });
    doc.text('For inquiries, please contact the Equipment Office', 105, yPos + 15, { align: 'center' });
    doc.text('Version 2.2.0 - Stock Management System', 105, yPos + 20, { align: 'center' });

    // Save PDF
    doc.save(`WCC-Penalty-Payment-${req.studentId}-${req.id}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-black text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl">Pay Penalty</h3>
              <p className="text-sm text-blue-200 mt-1">Select your payment method</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!showSuccess ? (
          <>
            {/* Penalty Details */}
            <div className="p-6 bg-red-50 border-b border-red-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Penalty Amount</p>
                <p className="text-4xl text-red-600 mb-2">₱{request.penalty || 0}</p>
                <p className="text-xs text-gray-600">
                  {request.overdueHours
                    ? `${request.overdueHours} hour(s) overdue × ₱20/hour`
                    : 'Late return penalty'}
                </p>
              </div>
              <div className="mt-4 text-sm text-gray-700 bg-white rounded-lg p-3">
                <p><strong>Equipment:</strong> {request.equipmentName}</p>
                <p><strong>Due Date:</strong> {request.dueDate} {request.dueTime && `at ${request.dueTime}`}</p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="p-6">
              <h4 className="text-sm text-gray-700 mb-4">Choose Payment Method:</h4>
              <div className="space-y-3">
                {/* GCash */}
                <button
                  onClick={() => setSelectedMethod('gcash')}
                  className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                    selectedMethod === 'gcash'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    selectedMethod === 'gcash' ? 'bg-blue-600' : 'bg-blue-100'
                  }`}>
                    <Smartphone className={`w-6 h-6 ${
                      selectedMethod === 'gcash' ? 'text-white' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-gray-900">GCash</p>
                    <p className="text-xs text-gray-600">Pay via GCash mobile app</p>
                  </div>
                  {selectedMethod === 'gcash' && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </button>

                {/* Maya */}
                <button
                  onClick={() => setSelectedMethod('maya')}
                  className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                    selectedMethod === 'maya'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    selectedMethod === 'maya' ? 'bg-green-600' : 'bg-green-100'
                  }`}>
                    <CreditCard className={`w-6 h-6 ${
                      selectedMethod === 'maya' ? 'text-white' : 'text-green-600'
                    }`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-gray-900">Maya</p>
                    <p className="text-xs text-gray-600">Pay via Maya mobile app</p>
                  </div>
                  {selectedMethod === 'maya' && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </button>

                {/* Cash */}
                <button
                  onClick={() => setSelectedMethod('cash')}
                  className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                    selectedMethod === 'cash'
                      ? 'border-orange-600 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    selectedMethod === 'cash' ? 'bg-orange-600' : 'bg-orange-100'
                  }`}>
                    <Wallet className={`w-6 h-6 ${
                      selectedMethod === 'cash' ? 'text-white' : 'text-orange-600'
                    }`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-gray-900">Cash Payment</p>
                    <p className="text-xs text-gray-600">Download PDF form for cashier</p>
                  </div>
                  {selectedMethod === 'cash' && (
                    <CheckCircle className="w-5 h-5 text-orange-600" />
                  )}
                </button>
              </div>

              {selectedMethod === 'cash' && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex gap-2 text-sm text-orange-800">
                    <Download className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Cash Payment Instructions:</p>
                      <ol className="mt-2 space-y-1 text-xs ml-2">
                        <li>1. Download the payment form</li>
                        <li>2. Print and bring it to the cashier</li>
                        <li>3. Pay the penalty amount</li>
                        <li>4. Get official receipt</li>
                        <li>5. Submit receipt to Equipment Office</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod && selectedMethod !== 'cash' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> After clicking "Proceed to Payment", you will be redirected to complete the payment.
                    Once payment is confirmed, your penalty will be marked as paid.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={!selectedMethod}
                className={`flex-1 py-3 rounded-lg transition-colors ${
                  selectedMethod
                    ? 'bg-gradient-to-r from-blue-800 to-black text-white hover:from-blue-900 hover:to-gray-900'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {selectedMethod === 'cash' ? 'Download Form' : 'Proceed to Payment'}
              </button>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl text-gray-900 mb-2">
              {selectedMethod === 'cash' ? 'Form Downloaded!' : 'Payment Initiated!'}
            </h3>
            <p className="text-sm text-gray-600">
              {selectedMethod === 'cash'
                ? 'Please check your downloads folder for the payment form.'
                : 'Redirecting to payment gateway...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
