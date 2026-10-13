import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Shield, Package, BarChart3, LogOut, Home, FileText, Database, QrCode, TrendingUp, AlertTriangle, UserCog, Settings, Camera, User as UserIcon } from 'lucide-react';
import { ProfileSettingsModal } from './ProfileSettingsModal';
import { AdminOverview } from './AdminOverview';
import { StockChecker } from './StockChecker';
import { QRCodeAssignment } from './QRCodeAssignment';
import { RequestManagement } from './RequestManagement';
import { DatabasePage } from './DatabasePage';
import { AdminReports } from './AdminReports';
import { AdminAnalytics } from './AdminAnalytics';
import { MissingItemManagement } from './MissingItemManagement';
import { AccountManagement } from './AccountManagement';
import { Equipment, BorrowRequest, EquipmentAuditLog, User } from '../types';
import wccLogo from '../../imports/image.png';

interface AdminDashboardProps {
  user: User;
  equipment: Equipment[];
  requests: BorrowRequest[];
  users: User[];
  equipmentAuditLogs: EquipmentAuditLog[];
  onUpdateEquipment: (equipment: Equipment[]) => void;
  onUpdateRequests: (requests: BorrowRequest[]) => void;
  onUpdateUsers: (users: User[]) => void;
  onLogout: () => void;
  onUpdateUser: (updated: User) => void;
  onConfirmPenaltyPayment: (requestId: string) => void;
  onRemoveEquipment: (equipmentId: string) => void;
}

export function AdminDashboard({
  user,
  equipment,
  requests,
  users,
  equipmentAuditLogs,
  onUpdateEquipment,
  onUpdateRequests,
  onUpdateUsers,
  onLogout,
  onUpdateUser,
  onConfirmPenaltyPayment,
  onRemoveEquipment
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'stocks' | 'qrcodes' | 'requests' | 'missing' | 'database' | 'reports' | 'analytics' | 'accounts'>('overview');
  const [showSettings, setShowSettings] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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
                <p className="text-sm text-blue-200">WCC Administrator Panel - Version 2.2.0</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Clickable avatar */}
              <div className="relative">
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/40 hover:border-white transition-all bg-blue-700 flex items-center justify-center group"
                  title="Upload profile photo"
                >
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-white" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                    <Camera className="w-3 h-3 text-white" />
                  </div>
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e.target.files?.[0])} />
              </div>
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
                className="flex items-center gap-2 px-4 py-2 bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-blue-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-blue-900 text-blue-900 bg-blue-50'
                  : 'border-transparent text-blue-600 hover:text-blue-900 hover:bg-blue-50'
              }`}
            >
              <Home className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('stocks')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'stocks'
                  ? 'border-gray-900 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Package className="w-4 h-4" />
              Stock Checker
            </button>
            <button
              onClick={() => setActiveTab('qrcodes')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'qrcodes'
                  ? 'border-gray-900 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <QrCode className="w-4 h-4" />
              QR Codes
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'requests'
                  ? 'border-gray-900 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              Requests
              {requests.filter(r => r.status === 'Pending').length > 0 && (
                <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                  {requests.filter(r => r.status === 'Pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('missing')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'missing'
                  ? 'border-gray-900 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Missing Items
              {requests.filter(r => r.status === 'Missing' && !r.missingItemReturned && !r.missingItemPaid).length > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {requests.filter(r => r.status === 'Missing' && !r.missingItemReturned && !r.missingItemPaid).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'database'
                  ? 'border-gray-900 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Database className="w-4 h-4" />
              Database
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'border-gray-900 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Reports
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'accounts'
                  ? 'border-gray-900 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <UserCog className="w-4 h-4" />
              Accounts
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'border-gray-900 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Analytics
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'overview' && <AdminOverview equipment={equipment} requests={requests} />}
        {activeTab === 'stocks' && <StockChecker equipment={equipment} requests={requests} onUpdateEquipment={onUpdateEquipment} canRemoveEquipment onRemoveEquipment={onRemoveEquipment} />}
        {activeTab === 'qrcodes' && <QRCodeAssignment equipment={equipment} onUpdateEquipment={onUpdateEquipment} />}
        {activeTab === 'requests' && (
          <RequestManagement 
            requests={requests} 
            equipment={equipment}
            onUpdateRequests={onUpdateRequests} 
            onUpdateEquipment={onUpdateEquipment}
            onConfirmPenaltyPayment={onConfirmPenaltyPayment}
          />
        )}
        {activeTab === 'missing' && (
          <MissingItemManagement 
            requests={requests} 
            equipment={equipment}
            onUpdateRequests={onUpdateRequests}
            onUpdateEquipment={onUpdateEquipment}
          />
        )}
        {activeTab === 'database' && (
          <DatabasePage
            equipment={equipment}
            requests={requests}
            users={users}
            equipmentAuditLogs={equipmentAuditLogs}
            onUpdateEquipment={onUpdateEquipment}
            onUpdateRequests={onUpdateRequests}
            onUpdateUsers={onUpdateUsers}
          />
        )}
        {activeTab === 'reports' && <AdminReports requests={requests} equipment={equipment} />}
        {activeTab === 'accounts' && <AccountManagement users={users} requests={requests} onUpdateUsers={onUpdateUsers} />}
        {activeTab === 'analytics' && <AdminAnalytics requests={requests} equipment={equipment} />}
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