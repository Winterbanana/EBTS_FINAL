import { useState } from 'react';
import { RotateCcw, CheckCircle, AlertTriangle, Smartphone, Upload, Camera, DollarSign, XCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BorrowRequest } from '../types';
import { PaymentModal } from './PaymentModal';

interface ReturnItemPageProps {
  userId: string;
  requests: BorrowRequest[];
  onReturnItem: (requestId: string, returnData: {
    conditionAfter: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged';
    conditionNotes?: string;
    returnPhotoUrl?: string;
    reportedMissing: boolean;
    missingNotes?: string;
  }) => void;
  onPaymentComplete: (requestId: string, paymentMethod: string) => void;
}

export function ReturnItemPage({ userId, requests, onReturnItem, onPaymentComplete }: ReturnItemPageProps) {
  const [selectedRequest, setSelectedRequest] = useState('');
  const [conditionAfter, setConditionAfter] = useState<'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged'>('Good');
  const [conditionNotes, setConditionNotes] = useState('');
  const [reportedMissing, setReportedMissing] = useState(false);
  const [missingNotes, setMissingNotes] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<BorrowRequest | null>(null);

  // Show both approved items and missing items
  const activeRequests = requests.filter(
    r => r.studentId === userId && (r.status === 'Approved' || r.status === 'Missing')
  );

  const calculatePenalty = (request: BorrowRequest): number => {
    // Use existing penalty if already calculated
    if (request.penalty) return request.penalty;

    // Calculate based on hours if available
    if (request.borrowTime && request.dueTime) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const [dueHours, dueMinutes] = request.dueTime.split(':').map(Number);
      const [currentHours, currentMinutes] = currentTime.split(':').map(Number);

      const dueTimeInMinutes = dueHours * 60 + dueMinutes;
      const currentTimeInMinutes = currentHours * 60 + currentMinutes;

      if (currentTimeInMinutes > dueTimeInMinutes) {
        const overdueHours = Math.ceil((currentTimeInMinutes - dueTimeInMinutes) / 60);
        return overdueHours * 20;
      }
    }

    // Fallback to day-based calculation
    const due = new Date(request.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return diffDays * 20;
    }
    return 0;
  };

  const isOverdue = (request: BorrowRequest): boolean => {
    if (request.status === 'Missing') return true;

    const penalty = calculatePenalty(request);
    return penalty > 0;
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

  const handleReturn = () => {
    if (!selectedRequest) return;

    const selected = activeRequests.find(r => r.id === selectedRequest);
    if (!selected) return;

    // Check if item has penalty and if it's paid
    const penalty = calculatePenalty(selected);
    if (penalty > 0 && !selected.penaltyPaid) {
      alert('Please pay the penalty before returning this item.');
      return;
    }

    // Check if item is missing and if the missing item fee is paid
    if (selected.status === 'Missing' && !selected.missingItemPaid && !selected.missingItemReturned) {
      alert('Please resolve the missing item issue (pay ₱200 or return the item) before proceeding.');
      return;
    }

    if (confirm('Are you sure you want to return this equipment?')) {
      onReturnItem(selectedRequest, {
        conditionAfter,
        conditionNotes,
        returnPhotoUrl: photoPreview,
        reportedMissing,
        missingNotes
      });
      setSelectedRequest('');
      setConditionAfter('Good');
      setConditionNotes('');
      setReportedMissing(false);
      setMissingNotes('');
      setPhotoFile(null);
      setPhotoPreview('');
    }
  };

  const handlePayPenalty = (request: BorrowRequest) => {
    setPaymentRequest(request);
    setShowPaymentModal(true);
  };

  const handlePaymentCompleted = (requestId: string, paymentMethod: string) => {
    onPaymentComplete(requestId, paymentMethod);
    setShowPaymentModal(false);
    setPaymentRequest(null);
  };

  const selected = activeRequests.find(r => r.id === selectedRequest);
  const penalty = selected ? calculatePenalty(selected) : 0;
  const overdue = selected ? isOverdue(selected) : false;
  const canReturn = selected ? (penalty === 0 || selected.penaltyPaid) && (selected.status !== 'Missing' || selected.missingItemPaid || selected.missingItemReturned) : false;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl text-gray-800">Return Equipment</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Return Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg text-gray-800 mb-4">Select Item to Return</h3>

          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm text-gray-700">
                Borrowed Equipment
              </label>
              <select
                value={selectedRequest}
                onChange={(e) => setSelectedRequest(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-gray-50"
              >
                <option value="">-- Select Equipment --</option>
                {activeRequests.map(req => {
                  const reqPenalty = calculatePenalty(req);
                  return (
                    <option key={req.id} value={req.id}>
                      {req.equipmentName} - Due: {req.dueDate}
                      {req.status === 'Missing' ? ' (MISSING)' : reqPenalty > 0 ? ' (OVERDUE)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {activeRequests.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-700">
                  You have no borrowed equipment to return.
                </p>
              </div>
            )}

            {selected && !canReturn && (penalty > 0 && !selected.penaltyPaid) && (
              <button
                onClick={() => handlePayPenalty(selected)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-colors shadow-md"
              >
                <DollarSign className="w-4 h-4" />
                Pay Penalty (₱{penalty})
              </button>
            )}

            {selected && canReturn && (
              <button
                onClick={handleReturn}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                Return Equipment
              </button>
            )}
          </div>
        </div>

        {/* Item Details & QR Code */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg text-gray-800 mb-4">Item Details</h3>

          {selected ? (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="bg-gray-50 p-6 rounded-lg flex justify-center border border-gray-200">
                <QRCodeSVG
                  value={selected.equipmentQRCode}
                  size={180}
                  level="H"
                  includeMargin={true}
                  fgColor="#1F2937"
                />
              </div>

              {/* Details */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Equipment:</span>
                  <span className="text-gray-900">{selected.equipmentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">QR Code:</span>
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-800">
                    {selected.equipmentQRCode}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={selected.status === 'Missing' ? 'text-red-600 font-medium' : 'text-gray-900'}>
                    {selected.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Borrowed Date:</span>
                  <span className="text-gray-900">{selected.requestDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Date:</span>
                  <span className={overdue ? 'text-red-600' : 'text-gray-900'}>
                    {selected.dueDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Return Date:</span>
                  <span className="text-gray-900">{new Date().toISOString().split('T')[0]}</span>
                </div>
              </div>

              {/* Missing Item Warning */}
              {selected.status === 'Missing' && (
                <div className="p-4 bg-red-50 border-2 border-red-400 rounded-lg">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm text-red-900 mb-2">Missing Item</h4>
                      <p className="text-sm text-red-800 mb-2">
                        This item was reported as missing. You must either return it or pay ₱200 replacement fee.
                      </p>
                      {selected.missingItemPaid && (
                        <div className="mt-2 p-2 bg-green-100 rounded text-xs text-green-800">
                          ✓ Replacement fee paid on {selected.missingItemPaymentDate}
                        </div>
                      )}
                      {selected.missingItemReturned && (
                        <div className="mt-2 p-2 bg-green-100 rounded text-xs text-green-800">
                          ✓ Item returned on {selected.missingItemReturnDate}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Penalty Warning/Status */}
              {penalty > 0 ? (
                <div className={`p-4 border-2 rounded-lg ${
                  selected.penaltyPaid
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                }`}>
                  <div className="flex items-start gap-3">
                    {selected.penaltyPaid ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className={`text-sm mb-2 ${selected.penaltyPaid ? 'text-green-800' : 'text-red-800'}`}>
                        {selected.penaltyPaid ? 'Penalty Paid' : 'Overdue Penalty'}
                      </h4>
                      <div className={`space-y-1 text-sm ${selected.penaltyPaid ? 'text-green-700' : 'text-red-700'}`}>
                        {selected.overdueHours && (
                          <p>Hours Overdue: {selected.overdueHours} hour(s)</p>
                        )}
                        {!selected.overdueHours && (
                          <p>Days Overdue: {getDaysOverdue(selected.dueDate)} day(s)</p>
                        )}
                        <p>Penalty Rate: ₱20.00 per {selected.overdueHours ? 'hour' : 'day'}</p>
                        <p className="text-lg font-medium">Total Penalty: ₱{penalty}.00</p>
                      </div>
                      {selected.penaltyPaid ? (
                        <div className="mt-2 text-xs text-green-600">
                          ✓ Paid via {selected.penaltyPaymentMethod} on {selected.penaltyPaymentDate}
                        </div>
                      ) : (
                        <p className="text-xs text-red-600 mt-2 font-medium">
                          ⚠️ You must pay the penalty before you can return this item.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : selected.status !== 'Missing' && (
                <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="text-sm text-green-800">On Time Return</h4>
                      <p className="text-xs text-green-700">No penalty charges</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Condition After Return */}
              {selected.status !== 'Missing' && (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm text-gray-700">Condition After Return</label>
                    <select
                      value={conditionAfter}
                      onChange={(e) => setConditionAfter(e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-gray-50"
                    >
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                      <option value="Damaged">Damaged</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm text-gray-700">
                      Condition Notes (Optional)
                    </label>
                    <textarea
                      value={conditionNotes}
                      onChange={(e) => setConditionNotes(e.target.value)}
                      rows={3}
                      placeholder="Any notes about the equipment condition..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-gray-50 resize-none"
                    />
                  </div>

                  {/* Photo Upload */}
                  <div className="space-y-2">
                    <label className="block text-sm text-gray-700">
                      Return Photo (Optional)
                    </label>
                    <div className="flex gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                        <Upload className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {photoPreview && (
                      <div className="mt-2">
                        <img
                          src={photoPreview}
                          alt="Return preview"
                          className="w-full h-48 object-cover rounded-lg border border-gray-300"
                        />
                      </div>
                    )}
                  </div>

                  {/* Report Missing Checkbox */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportedMissing}
                        onChange={(e) => setReportedMissing(e.target.checked)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <span className="text-sm text-orange-800">Report this item as missing</span>
                        <p className="text-xs text-orange-600 mt-1">
                          Check this if you lost the equipment. A ₱200 replacement fee will apply.
                        </p>
                      </div>
                    </label>
                    {reportedMissing && (
                      <textarea
                        value={missingNotes}
                        onChange={(e) => setMissingNotes(e.target.value)}
                        rows={2}
                        placeholder="Please explain what happened to the item..."
                        className="w-full mt-3 px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-sm resize-none"
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <Smartphone className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">Select an item to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && paymentRequest && (
        <PaymentModal
          request={paymentRequest}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentRequest(null);
          }}
          onPaymentComplete={handlePaymentCompleted}
        />
      )}
    </div>
  );
}
