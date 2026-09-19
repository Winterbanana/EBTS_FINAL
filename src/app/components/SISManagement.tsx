import { AlertCircle, Database, ArrowRight } from 'lucide-react';

export function SISManagement() {
  return (
    <div className="space-y-6">
      {/* Deprecation Notice */}
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg text-yellow-900 mb-2">External SIS Integration Removed</h3>
            <p className="text-yellow-800 mb-4">
              As of April 1, 2026, this system no longer connects to external School Information System (SIS).
              All user accounts are now managed internally through the new credential database system.
            </p>
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
              <p className="text-sm text-yellow-900 mb-2">
                <strong>What changed:</strong>
              </p>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>Removed external SIS API integration</li>
                <li>Implemented internal credential databases for Student, Staff, and Admin</li>
                <li>All authentication handled locally</li>
                <li>Account management moved to Admin Panel → Accounts tab</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Redirect Information */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-gray-700" />
          <h3 className="text-lg text-gray-900">Account Management Location</h3>
        </div>
        <p className="text-gray-600 mb-4">
          To manage user accounts (add, edit, delete students, staff, and admins), please navigate to:
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-900 mb-1">Admin Dashboard → Accounts Tab</p>
            <p className="text-sm text-gray-600">
              Full account management interface with search, filtering, and CRUD operations
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Database Information */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg text-gray-900 mb-4">Internal Database Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm text-green-900 mb-2">Student Credentials DB</h4>
            <p className="text-xs text-green-700">
              Stores all student login credentials with course, section, and contact information
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm text-blue-900 mb-2">Staff Credentials DB</h4>
            <p className="text-xs text-blue-700">
              Stores staff member login credentials with role-based permissions
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm text-red-900 mb-2">Admin Credentials DB</h4>
            <p className="text-xs text-red-700">
              Stores administrator credentials with full system access
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="text-sm text-purple-900 mb-2">Master User Database</h4>
            <p className="text-xs text-purple-700">
              Combined database containing all user accounts across roles
            </p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="text-sm text-orange-900 mb-2">Equipment Database</h4>
            <p className="text-xs text-orange-700">
              Equipment inventory with QR codes and condition tracking
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm text-gray-900 mb-2">Transaction & Penalty DB</h4>
            <p className="text-xs text-gray-700">
              Borrowing records, returns, and penalty calculations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
