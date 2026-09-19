import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Send, Camera, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { Equipment, BorrowRequest, User } from '../types';
import { QRScanner } from './QRScanner';

interface RequestPageProps {
  equipment: Equipment[];
  onSubmitRequest: (request: BorrowRequest) => void;
  user: User;
  requests: BorrowRequest[]; // Add requests to check for missing items
}

export function RequestPage({ equipment, onSubmitRequest, user, requests }: RequestPageProps) {
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [borrowTime, setBorrowTime] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const availableEquipment = equipment.filter(e => e.status === 'Available');

  // Check if student has unreturned/unpaid missing items
  const studentMissingRequests = requests.filter(
    r => r.studentId === user.id && 
         r.status === 'Missing' && 
         !r.missingItemReturned && 
         !r.missingItemPaid
  );
  
  const hasUnresolvedMissingItems = studentMissingRequests.length > 0;
  const totalDebt = studentMissingRequests.length * 200; // ₱200 per missing item

  const handleQRScan = (result: string) => {
    const foundEquipment = availableEquipment.find(e => e.qrcode === result);
    if (foundEquipment) {
      setSelectedEquipment(foundEquipment.id);
    }
  };

  // Calculate due time (8 hours after borrow time)
  const calculateDueTime = (startTime: string): string => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const dueHours = (hours + 8) % 24;
    return `${dueHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const equipmentItem = availableEquipment.find(e => e.id === selectedEquipment);
    if (!equipmentItem) return;

    const dueTime = calculateDueTime(borrowTime);
    const today = new Date().toISOString().split('T')[0];

    const request: BorrowRequest = {
      id: `REQ${Date.now()}`,
      studentId: user.id,
      studentName: user.name,
      studentCourse: `${user.course} ${user.section}`,
      studentContact: user.contact || '',
      equipmentId: equipmentItem.id,
      equipmentName: equipmentItem.name,
      equipmentQRCode: equipmentItem.qrcode,
      requestDate: today,
      dueDate: today, // Same day return (8 hours)
      borrowTime: borrowTime,
      dueTime: dueTime,
      status: 'Pending',
      conditionBefore: equipmentItem.qualityCondition,
    };

    onSubmitRequest(request);
    setShowSuccess(true);
    setSelectedEquipment('');
    setBorrowTime('');
    
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const selectedEq = availableEquipment.find(e => e.id === selectedEquipment);

  // Get current time
  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  // Helper function to get quality condition color
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Excellent': return 'bg-green-100 text-green-700 border-green-300';
      case 'Good': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Fair': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Poor': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Damaged': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl text-gray-800">Request Equipment</h2>
        <button
          onClick={() => setShowScanner(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
        >
          <Camera className="w-4 h-4" />
          Scan QR Code
        </button>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-green-800 mb-1">Request Submitted Successfully!</h4>
            <p className="text-sm text-green-700">
              Your request is now pending admin approval. You'll be notified once it's processed.
            </p>
          </div>
          <button
            onClick={() => setShowSuccess(false)}
            className="text-green-600 hover:text-green-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Warning for Missing Items */}
      {hasUnresolvedMissingItems && (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="text-red-800 text-lg mb-2">⚠️ BORROWING PRIVILEGE SUSPENDED</h4>
              <p className="text-red-700 mb-3">
                You cannot borrow equipment because you have <strong>{studentMissingRequests.length}</strong> unreturned/unpaid missing item(s).
              </p>
              <div className="bg-white rounded-lg p-4 mb-3 border border-red-200">
                <h5 className="text-red-800 font-medium mb-2">Missing Items:</h5>
                <ul className="space-y-2">
                  {studentMissingRequests.map(req => (
                    <li key={req.id} className="text-sm text-red-700 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span><strong>{req.equipmentName}</strong> - Reported: {req.returnDate}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-100 rounded-lg p-3 mb-3">
                <p className="text-red-800 font-medium">Total Debt: <span className="text-xl">₱{totalDebt}</span></p>
                <p className="text-sm text-red-700 mt-1">(₱200 per missing item)</p>
              </div>
              <div className="text-red-700">
                <p className="font-medium mb-2">To restore borrowing privileges:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Return all missing items to the admin office, OR</li>
                  <li>Pay ₱200 for each missing item</li>
                  <li>Contact the administrator to update your account status</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Form */}
        <div className={`bg-white rounded-lg shadow-sm p-6 border border-gray-200 ${
          hasUnresolvedMissingItems ? 'opacity-50 pointer-events-none' : ''
        }`}>
          <h3 className="text-lg text-gray-800 mb-4">Equipment Request Form</h3>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Student Info (Read-only) */}
            <div>
              <label className="block mb-2 text-sm text-gray-700">Student Name</label>
              <input
                type="text"
                value={user.name}
                readOnly
                className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm text-gray-700">Student ID</label>
                <input
                  type="text"
                  value={user.id}
                  readOnly
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm text-gray-700">Course/Section</label>
                <input
                  type="text"
                  value={`${user.course} ${user.section}`}
                  readOnly
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                />
              </div>
            </div>

            {/* Equipment Selection */}
            <div>
              <label htmlFor="equipment" className="block mb-2 text-sm text-gray-700">
                Select Equipment *
              </label>
              <select
                id="equipment"
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-gray-50"
                required
              >
                <option value="">-- Select Equipment --</option>
                {availableEquipment.map(eq => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} ({eq.category}) - {eq.qrcode}
                  </option>
                ))}
              </select>
            </div>

            {/* Borrow Time */}
            <div>
              <label htmlFor="borrowTime" className="block mb-2 text-sm text-gray-700">
                Borrow Time *
              </label>
              <input
                id="borrowTime"
                type="time"
                value={borrowTime}
                onChange={(e) => setBorrowTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-gray-50"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Equipment must be returned within 8 hours (school time only)
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Late returns are charged ₱20 per hour overdue
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedEquipment || !borrowTime}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              Submit Request
            </button>
          </form>
        </div>

        {/* Equipment Preview */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg text-gray-800 mb-4">Equipment Preview</h3>
          
          {selectedEq ? (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="bg-gray-50 p-6 rounded-lg flex justify-center border border-gray-200">
                <QRCodeSVG 
                  value={selectedEq.qrcode} 
                  size={180} 
                  level="H"
                  includeMargin={true}
                  fgColor="#1F2937"
                />
              </div>

              {/* Equipment Details */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Equipment Name:</span>
                  <span className="text-gray-900">{selectedEq.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="px-2 py-1 bg-gray-200 text-gray-800 text-sm rounded">
                    {selectedEq.category}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Equipment ID:</span>
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-800">
                    {selectedEq.id}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">QR Code:</span>
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-800">
                    {selectedEq.qrcode}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                    {selectedEq.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Condition:</span>
                  <span className={`px-2 py-1 ${getConditionColor(selectedEq.qualityCondition)} text-sm rounded-full`}>
                    {selectedEq.qualityCondition}
                  </span>
                </div>
              </div>

              {/* Request Summary */}
              {borrowTime && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm text-blue-800 mb-2">Request Summary</h4>
                  <div className="space-y-1 text-sm text-blue-700">
                    <div className="flex justify-between">
                      <span>Request Date:</span>
                      <span>{new Date().toISOString().split('T')[0]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Borrow Time:</span>
                      <span>{borrowTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Due Time:</span>
                      <span>{calculateDueTime(borrowTime)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-1">No equipment selected</p>
              <p className="text-sm text-gray-500">
                Select equipment or scan QR code
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Available Equipment Count */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-gray-700">
            <span className="text-2xl text-gray-900">{availableEquipment.length}</span> equipment available for borrowing
          </p>
          <div className="flex gap-2 text-sm">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded">
              Arnis: {availableEquipment.filter(e => e.category === 'Arnis').length}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded">
              Basketball: {availableEquipment.filter(e => e.category === 'Basketball').length}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded">
              Laptop: {availableEquipment.filter(e => e.category === 'Laptop').length}
            </span>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}