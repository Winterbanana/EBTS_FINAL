import { AlertTriangle, CheckCircle, DollarSign, Package } from 'lucide-react';
import { BorrowRequest, Equipment } from '../types';

interface MissingItemManagementProps {
  requests: BorrowRequest[];
  equipment: Equipment[];
  onUpdateRequests: (requests: BorrowRequest[]) => void;
  onUpdateEquipment: (equipment: Equipment[]) => void;
}

export function MissingItemManagement({ requests, equipment, onUpdateRequests, onUpdateEquipment }: MissingItemManagementProps) {
  const missingRequests = requests.filter(r => r.status === 'Missing' || r.reportedMissing || r.missingItemReturned || r.missingItemPaid);
  
  const unresolvedMissing = missingRequests.filter(r => !r.missingItemReturned && !r.missingItemPaid);
  const returnedMissing = missingRequests.filter(r => r.missingItemReturned);
  const paidMissing = missingRequests.filter(r => r.missingItemPaid);

  const handleMarkAsReturned = (requestId: string) => {
    if (!confirm('Confirm that the student has returned this missing item?')) return;

    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    // Update request status
    const updatedRequests = requests.map(r =>
      r.id === requestId
        ? {
            ...r,
            status: 'Returned' as const,
            missingItemReturned: true,
            missingItemReturnDate: new Date().toISOString().split('T')[0],
            missingItemResolvedBy: 'Admin',
            returnDate: new Date().toISOString().split('T')[0],
          }
        : r
    );
    onUpdateRequests(updatedRequests);

    // Update equipment status to Available since the item was physically returned
    const updatedEquipment = equipment.map(e =>
      e.id === request.equipmentId
        ? {
            ...e,
            availableStock: Math.min(e.totalStock, e.availableStock + 1),
            borrowedStock: Math.max(0, e.borrowedStock),
            status: 'Available' as const,
            markedMissingDate: undefined,
            markedMissingBy: undefined,
            lastBorrowedBy: undefined,
          }
        : e
    );
    onUpdateEquipment(updatedEquipment);
  };

  const handleMarkAsPaid = (requestId: string) => {
    if (!confirm('Confirm that the student has paid ₱200 for this missing item?')) return;

    const updatedRequests = requests.map(r =>
      r.id === requestId
        ? {
            ...r,
            missingItemPaid: true,
            missingItemPaymentDate: new Date().toISOString().split('T')[0],
            missingItemResolvedBy: 'Admin',
          }
        : r
    );
    onUpdateRequests(updatedRequests);

    const updatedEquipment = equipment.map(e =>
      e.id === requests.find(r => r.id === requestId)?.equipmentId
        ? {
            ...e,
            totalStock: Math.max(0, e.totalStock - 1),
            status: e.availableStock > 0 ? 'Available' as const : 'Missing' as const,
          }
        : e
    );
    onUpdateEquipment(updatedEquipment);
  };

  // Group by student
  const studentMissingMap = new Map<string, { studentName: string; requests: BorrowRequest[] }>();
  
  unresolvedMissing.forEach(req => {
    const existing = studentMissingMap.get(req.studentId);
    if (existing) {
      existing.requests.push(req);
    } else {
      studentMissingMap.set(req.studentId, {
        studentName: req.studentName,
        requests: [req],
      });
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-gray-800">Missing Item Management</h2>
        <p className="text-gray-600 mt-1">Track and manage missing items, returns, and payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Missing</p>
              <p className="text-3xl text-gray-800">{missingRequests.length}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-gray-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-5 border border-red-200 bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 mb-1">Unresolved</p>
              <p className="text-3xl text-red-600">{unresolvedMissing.length}</p>
            </div>
            <Package className="w-10 h-10 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-5 border border-green-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 mb-1">Returned</p>
              <p className="text-3xl text-green-600">{returnedMissing.length}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-5 border border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 mb-1">Paid</p>
              <p className="text-3xl text-blue-600">{paidMissing.length}</p>
            </div>
            <DollarSign className="w-10 h-10 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Unresolved Missing Items by Student */}
      {unresolvedMissing.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg text-gray-800 mb-4">⚠️ Unresolved Missing Items (Borrowing Blocked)</h3>
          <div className="space-y-4">
            {Array.from(studentMissingMap.entries()).map(([studentId, data]) => {
              const totalDebt = data.requests.length * 200;
              return (
                <div key={studentId} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-red-900 font-medium">{data.studentName}</h4>
                      <p className="text-sm text-red-700">ID: {studentId}</p>
                      <p className="text-sm text-red-700 mt-1">
                        <strong>Total Debt: ₱{totalDebt}</strong> ({data.requests.length} item{data.requests.length > 1 ? 's' : ''} × ₱200)
                      </p>
                      <p className="text-xs text-red-600 mt-1">⛔ Student cannot borrow until items are returned or paid</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {data.requests.map(req => (
                      <div key={req.id} className="bg-white rounded-lg p-3 border border-red-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-gray-900 font-medium">{req.equipmentName}</p>
                            <p className="text-sm text-gray-600">QR: {req.equipmentQRCode}</p>
                            <p className="text-sm text-gray-600">Reported Missing: {req.returnDate}</p>
                            {req.missingNotes && (
                              <p className="text-sm text-gray-600 mt-1 italic">Notes: {req.missingNotes}</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <button
                              onClick={() => handleMarkAsReturned(req.id)}
                              className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 whitespace-nowrap"
                            >
                              ✓ Mark Returned
                            </button>
                            <button
                              onClick={() => handleMarkAsPaid(req.id)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 whitespace-nowrap"
                            >
                              ₱ Mark Paid ₱200
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {unresolvedMissing.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-green-800 font-medium">No unresolved missing items!</p>
          <p className="text-sm text-green-700 mt-1">All missing items have been returned or paid for.</p>
        </div>
      )}

      {/* Resolved Missing Items */}
      {(returnedMissing.length > 0 || paidMissing.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg text-gray-800 mb-4">✅ Resolved Missing Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Student</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Equipment</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Reported</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Resolution</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Date Resolved</th>
                </tr>
              </thead>
              <tbody>
                {[...returnedMissing, ...paidMissing]
                  .sort((a, b) => {
                    const dateA = a.missingItemReturnDate || a.missingItemPaymentDate || '';
                    const dateB = b.missingItemReturnDate || b.missingItemPaymentDate || '';
                    return dateB.localeCompare(dateA);
                  })
                  .map(req => (
                    <tr key={req.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="text-gray-900">{req.studentName}</p>
                        <p className="text-xs text-gray-600">{req.studentId}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-gray-900">{req.equipmentName}</p>
                        <p className="text-xs text-gray-600">{req.equipmentQRCode}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{req.returnDate}</td>
                      <td className="py-3 px-4">
                        {req.missingItemReturned && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            ✓ Returned
                          </span>
                        )}
                        {req.missingItemPaid && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            ₱ Paid ₱200
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {req.missingItemReturnDate || req.missingItemPaymentDate}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}