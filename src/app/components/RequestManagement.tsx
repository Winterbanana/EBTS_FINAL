import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Calendar, User, FileText } from 'lucide-react';
import Barcode from 'react-barcode';
import { BorrowRequest, Equipment } from '../types';
import { BorrowingSlip } from './BorrowingSlip';

interface RequestManagementProps {
  requests: BorrowRequest[];
  equipment: Equipment[];
  onUpdateRequests: (requests: BorrowRequest[]) => void;
  onUpdateEquipment: (equipment: Equipment[]) => void;
}

export function RequestManagement({ requests, equipment, onUpdateRequests, onUpdateEquipment }: RequestManagementProps) {
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [selectedSlip, setSelectedSlip] = useState<BorrowRequest | null>(null);

  const filteredRequests = filter === 'All' 
    ? requests 
    : requests.filter(r => r.status === filter);

  const handleApprove = (request: BorrowRequest) => {
    const item = equipment.find(e => e.id === request.equipmentId);
    if (!item || item.availableStock < 1) {
      alert('This equipment is currently unavailable.');
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
    const updatedRequests = requests.map(r =>
      r.id === request.id
        ? { ...r, status: 'Rejected' as const }
        : r
    );
    onUpdateRequests(updatedRequests);
  };

  const handleReturn = (request: BorrowRequest) => {
    // Update request status
    const updatedRequests = requests.map(r =>
      r.id === request.id
        ? { ...r, status: 'Returned' as const }
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
  const rejectedCount = requests.filter(r => r.status === 'Rejected').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">Request Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('All')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'All' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All ({requests.length})
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
            onClick={() => setFilter('Rejected')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'Rejected' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Rejected ({rejectedCount})
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
                  request.status === 'Approved' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {request.status === 'Pending' ? (
                    <Clock className="w-6 h-6 text-yellow-600" />
                  ) : request.status === 'Approved' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
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
                request.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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
              </div>

              <div className="bg-gray-50 p-4 rounded-lg flex justify-center items-center">
                <Barcode value={request.equipmentQRCode || 'N/A'} height={60} width={1.5} fontSize={12} />
              </div>
            </div>

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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Returned
                </button>
              </div>
            )}
          </div>
        ))}

        {filteredRequests.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No {filter !== 'All' ? filter.toLowerCase() : ''} requests found</p>
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