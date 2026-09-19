import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Package, FileText, CheckCircle, LogOut, Home, RotateCcw, Download, Clock, User, BarChart3, AlertTriangle, History, Receipt, Settings, Camera } from 'lucide-react';
import { ProfileSettingsModal } from './ProfileSettingsModal';
import { EquipmentList } from './EquipmentList';
import { RequestPage } from './RequestPage';
import { ApprovedRequests } from './ApprovedRequests';
import { ReturnItemPage } from './ReturnItemPage';
import { PDFReportPage } from './PDFReportPage';
import { PendingRequestsPage } from './PendingRequestsPage';
import { StudentAnalytics } from './StudentAnalytics';
import { Equipment, BorrowRequest, User as UserType } from '../types';
import wccLogo from '../../imports/image.png';

interface StudentDashboardProps {
  user: UserType;
  equipment: Equipment[];
  requests: BorrowRequest[];
  onAddRequest: (request: BorrowRequest) => void;
  onReturnItem: (requestId: string, returnData: {
    conditionAfter: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged';
    conditionNotes?: string;
    returnPhotoUrl?: string;
    reportedMissing: boolean;
    missingNotes?: string;
  }) => void;
  onPaymentComplete: (requestId: string, paymentMethod: string) => void;
  onLogout: () => void;
  onUpdateUser: (updated: import('../types').User) => void;
}

export function StudentDashboard({ user, equipment, requests, onAddRequest, onReturnItem, onPaymentComplete, onLogout, onUpdateUser }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'equipment' | 'request' | 'pending' | 'approved' | 'return' | 'reports' | 'analytics' | 'borrowing-history' | 'penalty-history'>('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const userRequests = requests.filter(r => r.studentId === user.id);
  const approvedRequests = userRequests.filter(r => r.status === 'Approved');
  const pendingRequests = userRequests.filter(r => r.status === 'Pending');

  // Check for unresolved missing items
  const unresolvedMissingItems = userRequests.filter(
    r => r.status === 'Missing' && !r.missingItemReturned && !r.missingItemPaid
  );
  const totalMissingDebt = unresolvedMissingItems.length * 200;
  const canBorrow = unresolvedMissingItems.length === 0;

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const handlePhotoUpload = (file: File | null | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => onUpdateUser({ ...user, photoUrl: e.target?.result as string });
    reader.readAsDataURL(file);
  };

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

  const totalPenalty = approvedRequests.reduce((sum, req) => sum + calculatePenalty(req.dueDate), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-black text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center p-1">
                <img src={wccLogo} alt="WCC Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl text-white">Equipment Borrowing and Tracking Return System</h1>
                <p className="text-sm text-blue-200">WCC Student Portal - Version 2.2.0</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors"
                title="Account Settings"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Student Profile Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Clickable profile avatar */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => photoInputRef.current?.click()}
                className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden group relative border-2 border-transparent hover:border-blue-400 transition-all"
                title="Click to upload profile photo"
              >
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-7 h-7 text-gray-600" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e.target.files?.[0])} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg text-gray-900">{user.name}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="font-medium">ID:</span> {user.id}
                </span>
                {user.course && user.section && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Course:</span> {user.course} {user.section}
                  </span>
                )}
                {user.contact && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Contact:</span> {user.contact}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'border-gray-800 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Home className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('equipment')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'equipment'
                  ? 'border-gray-800 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Package className="w-4 h-4" />
              Equipment List
            </button>
            <button
              onClick={() => setActiveTab('request')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'request'
                  ? 'border-gray-800 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              Request Equipment
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'border-gray-800 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-4 h-4" />
              Pending/Rejected
              {pendingRequests.length > 0 && (
                <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'approved'
                  ? 'border-gray-800 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Approved
              {approvedRequests.length > 0 && (
                <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                  {approvedRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('return')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'return'
                  ? 'border-gray-800 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              Return Item
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'border-gray-800 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Download className="w-4 h-4" />
              Reports
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'border-gray-800 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('borrowing-history')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'borrowing-history'
                  ? 'border-blue-700 text-blue-900 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <History className="w-4 h-4" />
              Borrowing History
            </button>
            <button
              onClick={() => setActiveTab('penalty-history')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'penalty-history'
                  ? 'border-red-600 text-red-900 bg-red-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Receipt className="w-4 h-4" />
              Penalty History
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Warning Banner for Unresolved Missing Items */}
        {unresolvedMissingItems.length > 0 && (
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-5 mb-6 animate-pulse">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-red-900 text-lg font-bold mb-2">⚠️ BORROWING PRIVILEGE SUSPENDED</h3>
                <p className="text-red-800 mb-3">
                  You have <strong>{unresolvedMissingItems.length}</strong> unreturned/unpaid missing item(s). 
                  You cannot borrow any equipment until this is resolved.
                </p>
                <div className="bg-white rounded-lg p-4 mb-3 border border-red-200">
                  <h4 className="text-red-800 font-medium mb-2">Missing Items:</h4>
                  <ul className="space-y-2">
                    {unresolvedMissingItems.map(req => (
                      <li key={req.id} className="text-sm text-red-700 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <span><strong>{req.equipmentName}</strong> - Reported: {req.returnDate}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-100 rounded-lg p-3 mb-3">
                  <p className="text-red-900 font-bold">Total Debt: <span className="text-2xl">₱{totalMissingDebt}</span></p>
                  <p className="text-sm text-red-800 mt-1">(₱200 per missing item)</p>
                </div>
                <div className="text-red-800">
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

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl text-gray-800">Welcome, {user.name.split(',')[0]}</h2>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Total Requests</p>
                <p className="text-3xl text-gray-800">{userRequests.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Approved</p>
                <p className="text-3xl text-green-600">{approvedRequests.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl text-orange-600">{pendingRequests.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Total Penalties</p>
                <p className="text-3xl text-red-600">₱{totalPenalty}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Unresolved Missing Items</p>
                <p className="text-3xl text-red-600">{unresolvedMissingItems.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Total Missing Debt</p>
                <p className="text-3xl text-red-600">₱{totalMissingDebt}</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg text-gray-800 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {userRequests.slice(0, 5).map(req => (
                  <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-gray-800">{req.equipmentName}</p>
                      <p className="text-sm text-gray-600">{req.requestDate}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      req.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                      req.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
                {userRequests.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No activity yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'equipment' && <EquipmentList equipment={equipment} />}
        {activeTab === 'request' && <RequestPage equipment={equipment} onSubmitRequest={onAddRequest} user={user} requests={requests} />}
        {activeTab === 'pending' && <PendingRequestsPage requests={userRequests} />}
        {activeTab === 'approved' && <ApprovedRequests requests={approvedRequests} />}
        {activeTab === 'return' && <ReturnItemPage userId={user.id} requests={userRequests} onReturnItem={onReturnItem} onPaymentComplete={onPaymentComplete} />}
        {activeTab === 'reports' && <PDFReportPage requests={userRequests} userId={user.id} />}
        {activeTab === 'analytics' && <StudentAnalytics requests={requests} userId={user.id} />}



        {activeTab === 'borrowing-history' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <History className="w-6 h-6 text-blue-700" />
              <h2 className="text-2xl text-gray-800">Borrowing History</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Complete record of all equipment you have borrowed.</p>
            {userRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No borrowing history yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-900 to-black text-white">
                      <th className="px-4 py-3 text-left font-medium">Equipment</th>
                      <th className="px-4 py-3 text-left font-medium">Date Borrowed</th>
                      <th className="px-4 py-3 text-left font-medium">Time Borrowed</th>
                      <th className="px-4 py-3 text-left font-medium">Due Date</th>
                      <th className="px-4 py-3 text-left font-medium">Due Time</th>
                      <th className="px-4 py-3 text-left font-medium">Return Date</th>
                      <th className="px-4 py-3 text-left font-medium">Return Time</th>
                      <th className="px-4 py-3 text-left font-medium">Condition</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userRequests.slice().reverse().map((req, idx) => (
                      <tr key={req.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                        <td className="px-4 py-3 font-medium text-gray-900">{req.equipmentName}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {req.requestDate
                            ? new Date(req.requestDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{req.borrowTime || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {req.dueDate
                            ? new Date(req.dueDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{req.dueTime || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {req.returnDate
                            ? new Date(req.returnDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{req.returnTime || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{req.conditionAfter || req.conditionBefore || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            req.status === 'Returned' ? 'bg-green-100 text-green-700' :
                            req.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                            req.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                            req.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                            req.status === 'Missing' ? 'bg-red-200 text-red-900' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-gray-400 text-right">Total records: {userRequests.length}</p>
          </div>
        )}

        {activeTab === 'penalty-history' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Receipt className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl text-gray-800">Penalty History</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Complete record of all penalties incurred and payments issued.</p>
            {(() => {
              const penaltyRecords = userRequests.filter(r => (r.penalty && r.penalty > 0) || r.status === 'Missing');
              return penaltyRecords.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
                  <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No penalty records found. Great job!</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <p className="text-xs text-red-600 mb-1">Total Penalties</p>
                      <p className="text-2xl text-red-700 font-bold">₱{penaltyRecords.reduce((s, r) => s + (r.penalty || 0), 0)}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <p className="text-xs text-orange-600 mb-1">Paid</p>
                      <p className="text-2xl text-orange-700 font-bold">₱{penaltyRecords.filter(r => r.penaltyPaid).reduce((s, r) => s + (r.penalty || 0), 0)}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <p className="text-xs text-yellow-600 mb-1">Outstanding</p>
                      <p className="text-2xl text-yellow-700 font-bold">₱{penaltyRecords.filter(r => !r.penaltyPaid).reduce((s, r) => s + (r.penalty || 0), 0)}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-red-800 to-black text-white">
                          <th className="px-4 py-3 text-left font-medium">Equipment</th>
                          <th className="px-4 py-3 text-left font-medium">Type of Penalty</th>
                          <th className="px-4 py-3 text-left font-medium">Penalty Amount</th>
                          <th className="px-4 py-3 text-left font-medium">Date Incurred</th>
                          <th className="px-4 py-3 text-left font-medium">Time Incurred</th>
                          <th className="px-4 py-3 text-left font-medium">Overdue Hours</th>
                          <th className="px-4 py-3 text-left font-medium">Payment Method</th>
                          <th className="px-4 py-3 text-left font-medium">Payment Date</th>
                          <th className="px-4 py-3 text-left font-medium">Payment Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {penaltyRecords.slice().reverse().map((req, idx) => {
                          const penaltyType = req.status === 'Missing'
                            ? 'Missing Item (₱200 replacement fee)'
                            : req.overdueHours
                            ? `Overdue Return (₱20 × ${req.overdueHours}h)`
                            : 'Late Return Penalty';
                          return (
                            <tr key={req.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-red-50'}>
                              <td className="px-4 py-3 font-medium text-gray-900">{req.equipmentName}</td>
                              <td className="px-4 py-3 text-gray-700">{penaltyType}</td>
                              <td className="px-4 py-3 font-bold text-red-700">
                                ₱{req.status === 'Missing' ? 200 : (req.penalty || 0)}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {req.returnDate
                                  ? new Date(req.returnDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
                                  : req.requestDate
                                  ? new Date(req.requestDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
                                  : '—'}
                              </td>
                              <td className="px-4 py-3 text-gray-700">{req.returnTime || '—'}</td>
                              <td className="px-4 py-3 text-gray-700">
                                {req.overdueHours ? `${req.overdueHours}h` : '—'}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {req.penaltyPaymentMethod || (req.missingItemPaid ? 'Paid' : '—')}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {req.penaltyPaymentDate
                                  ? new Date(req.penaltyPaymentDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
                                  : '—'}
                              </td>
                              <td className="px-4 py-3">
                                {req.penaltyPaid || req.missingItemPaid ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Paid</span>
                                ) : (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Unpaid</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-400 text-right">Total penalty records: {penaltyRecords.length}</p>
                </>
              );
            })()}
          </div>
        )}
      </main>

      {showSettings && (
        <ProfileSettingsModal
          user={user}
          onClose={() => setShowSettings(false)}
          onUpdateUser={onUpdateUser}
        />
      )}
    </div>
  );
}