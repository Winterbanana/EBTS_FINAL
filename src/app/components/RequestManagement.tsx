import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Calendar, User, FileText, AlertTriangle, History } from 'lucide-react';
import Barcode from 'react-barcode';
import { BorrowRequest, Equipment } from '../types';
import { BorrowingSlip } from './BorrowingSlip';
import { MAX_ACTIVE_BORROW_LIMIT, getBorrowingLimitMessage, getStudentActiveBorrowCount } from '../borrowing';
import { calculateOverduePenalty } from '../penalties';

interface RequestManagementProps {
  requests: BorrowRequest[];
  equipment: Equipment[];
  onUpdateRequests: (requests: BorrowRequest[]) => void;
  onUpdateEquipment: (equipment: Equipment[]) => void;
  onConfirmPenaltyPayment: (requestId: string) => void;
}

export function RequestManagement({ requests, equipment, onUpdateRequests, onUpdateEquipment, onConfirmPenaltyPayment }: RequestManagementProps) {
  const [filter, setFilter] = useState<'Active' | 'Pending' | 'Approved' | 'Payments' | 'History'>('Active');
  const [selectedSlip, setSelectedSlip] = useState<BorrowRequest | null>(null);

  const activeRequests = requests.filter(r => r.status === 'Pending' || r.status === 'Approved');
  const paymentRequests = requests.filter(r => r.penaltyPaymentStatus === 'Pending');
  const historyRequests = requests.filter(r =>
    r.status === 'Rejected' || r.status === 'Returned' || r.status === 'Missing'
  );
  const filteredRequests = filter === 'Active'
    ? activeRequests
    : filter === 'History'
      ? historyRequests
      : filter === 'Payments'
        ? paymentRequests
        : requests.filter(r => r.status === filter);

  const hasUnpaidPenalty = (request: BorrowRequest): boolean => {
    const penalty = request.penalty ?? calculateOverduePenalty(request.dueDate);
    return request.penaltyPaymentStatus === 'Pending'
      || (penalty > 0 && !request.penaltyPaid && request.penaltyPaymentStatus !== 'Paid');
  };

  const handleApprove = (request: BorrowRequest) => {
    const item = equipment.find(e => e.id === request.equipmentId);
    if (!item || item.availableStock < 1) {
      alert('This equipment is currently unavailable.');
      return;
    }

    const approvedBorrowCount = getStudentActiveBorrowCount(request.studentId, requests);
    if (approvedBorrowCount >= MAX_ACTIVE_BORROW_LIMIT) {
      alert(getBorrowingLimitMessage());
      return;
    }

    // Update request status
    const updatedRequests = requests.map(r => 
      r.id === request.id 
        ? { 
            ...r, 
            status: 'Approved' as const,
            approvedBy: 'ADM001',
            approvedDate: new Date().toISOString().split('T')[0]
          }
        : r
    );
    onUpdateRequests(updatedRequests);

    // Update equipment status
    const updatedEquipment = equipment.map(e =>
      e.id === request.equipmentId
        ? {
            ...e,
            availableStock: Math.max(0, e.availableStock - 1),
            borrowedStock: e.borrowedStock + 1,
            status: (e.availableStock - 1 > 0 ? 'Available' : 'Borrowed') as const,
            borrowedBy: request.studentId,
            borrowDate: new Date().toISOString().split('T')[0],
            dueDate: request.dueDate,
          }
        : e
    );
    onUpdateEquipment(updatedEquipment);
  };

  const handleReject = (request: BorrowRequest) => {
    const rejectedDate = new Date().toISOString().split('T')[0];
    const updatedRequests = requests.map(r =>
      r.id === request.id
        ? { ...r, status: 'Rejected' as const, rejectedBy: 'ADM001', rejectedDate }
        : r
    );
    onUpdateRequests(updatedRequests);
  };

  const handleReturn = (request: BorrowRequest) => {
    if (hasUnpaidPenalty(request)) {
      alert('This request has an unpaid penalty. Verify the payment before marking the item as returned.');
      return;
    }

    const now = new Date();
    // Update request status
    const updatedRequests = requests.map(r =>
      r.id === request.id
        ? {
            ...r,
            status: 'Returned' as const,
            returnDate: now.toISOString().split('T')[0],
            returnTime: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          }
        : r
    );
    onUpdateRequests(updatedRequests);

    // Update equipment status
    const updatedEquipment = equipment.map(e =>
      e.id === request.equipmentId
        ? {
            ...e,
          availableStock: Math.min(e.totalStock, e.availableStock + 1),
          borrowedStock: Math.max(0, e.borrowedStock - 1),
            status: 'Available' as const,
            borrowedBy: undefined,
            borrowDate: undefined,
            dueDate: undefined,
          }
        : e
    );
    onUpdateEquipment(updatedEquipment);
  };

  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const historyCount = historyRequests.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">Request Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('Active')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'Active' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Active ({activeRequests.length})
          </button>
          <button
            onClick={() => setFilter('Pending')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'Pending' ? 'bg-yellow-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('Approved')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'Approved' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setFilter('Payments')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'Payments' ? 'bg-amber-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Payments ({paymentRequests.length})
          </button>
          <button
            onClick={() => setFilter('History')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'History' ? 'bg-purple-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <History className="w-4 h-4" />
              History ({historyCount})
            </span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredRequests.map(request => (
          <div key={request.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  request.status === 'Pending' ? 'bg-yellow-100' :
                  request.status === 'Approved' ? 'bg-green-100' :
                  request.status === 'Returned' ? 'bg-blue-100' :
                  request.status === 'Missing' ? 'bg-orange-100' : 'bg-red-100'
                }`}>
                  {request.status === 'Pending' ? (
                    <Clock className="w-6 h-6 text-yellow-600" />
                  ) : request.status === 'Approved' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : request.status === 'Returned' ? (
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  ) : request.status === 'Missing' ? (
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Request ID: {request.id}</p>
                  <h3 className="text-lg">{request.equipmentName}</h3>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                request.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                request.status === 'Approved' ? 'bg-green-100 text-green-700' :
                request.status === 'Returned' ? 'bg-blue-100 text-blue-700' :
                request.status === 'Missing' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
              }`}>
                {request.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Student:</span>
                  <span>{request.studentName} ({request.studentId})</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Request Date:</span>
                  <span>{request.requestDate}</span>
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
                  <span className="text-red-600">{request.dueDate}</span>
                </div>
                {request.dueTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Due Time:</span>
                    <span className="text-red-600 font-medium">{request.dueTime}</span>
                  </div>
                )}
                {request.approvedDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Approved:</span>
                    <span>{request.approvedDate}</span>
                  </div>
                )}
                {request.returnDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{request.status === 'Missing' ? 'Marked missing:' : 'Finalized:'}</span>
                    <span>{request.returnDate}</span>
                  </div>
                )}
                {request.status === 'Rejected' && request.rejectedDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <XCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Rejected:</span>
                    <span>{request.rejectedDate}</span>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg flex justify-center items-center">
                <Barcode value={request.equipmentQRCode || 'N/A'} height={60} width={1.5} fontSize={12} />
              </div>
            </div>

            {request.penaltyPaymentStatus === 'Pending' && (
              <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>
                    Payment awaiting verification: {request.penaltyPaymentMethod || 'Method not recorded'}
                    {request.penaltyPaymentSubmittedDate ? ` · submitted ${request.penaltyPaymentSubmittedDate}` : ''}
                  </span>
                  <button
                    onClick={() => onConfirmPenaltyPayment(request.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-white transition-colors hover:bg-green-800"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirm Payment Received
                  </button>
                </div>
              </div>
            )}
            {request.penaltyPaymentStatus === 'Paid' && (
              <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900">
                Penalty payment verified
                {request.penaltyPaymentDate ? ` on ${request.penaltyPaymentDate}` : ''}
                {request.penaltyVerifiedBy ? ` by ${request.penaltyVerifiedBy}` : ''}.
              </div>
            )}

            {request.status === 'Pending' && (
              <div className="flex gap-3 mt-4 pt-4 border-t">
                <button
                  onClick={() => handleApprove(request)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Request
                </button>
                <button
                  onClick={() => handleReject(request)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Request
                </button>
              </div>
            )}

            {request.status === 'Approved' && (
              <div className="mt-4 pt-4 border-t flex gap-3">
                <button
                  onClick={() => setSelectedSlip(request)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  View Borrowing Slip
                </button>
                <button
                  onClick={() => handleReturn(request)}
                  disabled={hasUnpaidPenalty(request)}
                  title={hasUnpaidPenalty(request) ? 'Verify the penalty payment before marking this item as returned.' : undefined}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 disabled:hover:bg-gray-300"
                >
                  <CheckCircle className="w-4 h-4" />
                  {hasUnpaidPenalty(request) ? 'Verify Penalty First' : 'Mark as Returned'}
                </button>
              </div>
            )}
          </div>
        ))}

        {filteredRequests.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            {filter === 'History'
              ? <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              : <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />}
            <p className="text-gray-600">
              {filter === 'History'
                ? 'No completed or rejected requests in history'
                : filter === 'Payments'
                  ? 'No payments are waiting for verification'
                  : `No ${filter === 'Active' ? 'active' : filter.toLowerCase()} requests found`}
            </p>
          </div>
        )}
      </div>

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