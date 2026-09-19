import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Package, LogOut, Home, FileText, TrendingUp, Wrench, Settings, Camera, User as UserIcon } from 'lucide-react';
import { StockChecker } from './StockChecker';
import { RequestManagement } from './RequestManagement';
import { AdminReports } from './AdminReports';
import { AdminAnalytics } from './AdminAnalytics';
import { ProfileSettingsModal } from './ProfileSettingsModal';
import { Equipment, BorrowRequest, User } from '../types';
import wccLogo from '../../imports/image.png';

interface StaffDashboardProps {
  user: User;
  equipment: Equipment[];
  requests: BorrowRequest[];
  onUpdateEquipment: (equipment: Equipment[]) => void;
  onUpdateRequests: (requests: BorrowRequest[]) => void;
  onLogout: () => void;
  onUpdateUser: (updated: User) => void;
  staffName: string;
}

export function StaffDashboard({
  user,
  equipment,
  requests,
  onUpdateEquipment,
  onUpdateRequests,
  onLogout,
  onUpdateUser,
  staffName
}: StaffDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'stocks' | 'requests' | 'reports' | 'analytics'>('overview');
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

  const totalEquipment = equipment.length;
  const availableEquipment = equipment.filter(e => e.status === 'Available').length;
  const borrowedEquipment = equipment.filter(e => e.status === 'Borrowed').length;
  const missingEquipment = equipment.filter(e => e.status === 'Missing').length;
  const pendingRequests = requests.filter(r => r.status === 'Pending').length;
  const approvedRequests = requests.filter(r => r.status === 'Approved').length;

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
                <p className="text-sm text-blue-200">WCC Staff Panel - Version 2.2.0 - {staffName}</p>
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
            {[
              { id: 'overview', label: 'Overview', icon: Home },
              { id: 'stocks', label: 'Equipment Manager', icon: Package },
              { id: 'requests', label: 'Request Management', icon: Wrench },
              { id: 'reports', label: 'Reports', icon: FileText },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? 'border-blue-900 text-blue-900 bg-blue-50'
                    : 'border-transparent text-blue-600 hover:text-blue-900 hover:bg-blue-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl text-gray-900 mb-4">Staff Dashboard Overview</h2>
              <p className="text-gray-600 mb-6">Manage equipment, assist students with borrowing requests, and generate reports.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Total Equipment', value: totalEquipment, color: 'text-gray-900', bg: 'bg-blue-100', icon: Package, iconColor: 'text-blue-600' },
                { label: 'Available', value: availableEquipment, color: 'text-green-600', bg: 'bg-green-100', icon: Package, iconColor: 'text-green-600' },
                { label: 'Borrowed', value: borrowedEquipment, color: 'text-orange-600', bg: 'bg-orange-100', icon: Package, iconColor: 'text-orange-600' },
                { label: 'Missing Items', value: missingEquipment, color: 'text-red-600', bg: 'bg-red-100', icon: Package, iconColor: 'text-red-600' },
                { label: 'Pending Requests', value: pendingRequests, color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Wrench, iconColor: 'text-yellow-600' },
                { label: 'Approved Requests', value: approvedRequests, color: 'text-blue-600', bg: 'bg-blue-100', icon: Wrench, iconColor: 'text-blue-600' },
              ].map(({ label, value, color, bg, icon: Icon, iconColor }) => (
                <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{label}</p>
                      <p className={`text-3xl ${color}`}>{value}</p>
                    </div>
                    <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Manage Equipment', tab: 'stocks' as const, icon: Package },
                  { label: 'Handle Requests', tab: 'requests' as const, icon: Wrench },
                  { label: 'Generate Reports', tab: 'reports' as const, icon: FileText },
                  { label: 'View Analytics', tab: 'analytics' as const, icon: TrendingUp },
                ].map(({ label, tab, icon: Icon }) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Icon className="w-5 h-5 text-gray-700" />
                    <span className="text-sm text-gray-900">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stocks' && <StockChecker equipment={equipment} onUpdateEquipment={onUpdateEquipment} />}
        {activeTab === 'requests' && <RequestManagement equipment={equipment} requests={requests} onUpdateEquipment={onUpdateEquipment} onUpdateRequests={onUpdateRequests} />}
        {activeTab === 'reports' && <AdminReports equipment={equipment} requests={requests} />}
        {activeTab === 'analytics' && <AdminAnalytics equipment={equipment} requests={requests} />}
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
