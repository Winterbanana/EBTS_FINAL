import { useState } from 'react';
import { UserPlus, Trash2, Edit, Search, Users, Shield, Briefcase, X } from 'lucide-react';
import { User } from '../types';

interface AccountManagementProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}

export function AccountManagement({ users, onUpdateUsers }: AccountManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'admin' | 'staff'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    password: '',
    role: 'student' as 'student' | 'admin' | 'staff',
    name: '',
    course: '',
    section: '',
    contact: '',
  });

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = () => {
    if (!formData.id || !formData.password || !formData.name) return;

    // Check account limits for Staff and Admin
    const staffCount = users.filter(u => u.role === 'staff').length;
    const adminCount = users.filter(u => u.role === 'admin').length;

    if (formData.role === 'staff' && staffCount >= 2) {
      alert('Maximum of 2 Staff accounts allowed. Please delete an existing staff account first.');
      return;
    }

    if (formData.role === 'admin' && adminCount >= 2) {
      alert('Maximum of 2 Admin accounts allowed. Please delete an existing admin account first.');
      return;
    }

    // Check if ID already exists
    if (users.some(u => u.id === formData.id)) {
      alert('An account with this ID already exists.');
      return;
    }

    const newUser: User = {
      id: formData.id,
      password: formData.password,
      role: formData.role,
      name: formData.name,
      ...(formData.role === 'student' && {
        course: formData.course,
        section: formData.section,
        contact: formData.contact,
      }),
    };

    onUpdateUsers([...users, newUser]);
    setShowAddModal(false);
    resetForm();
  };

  const handleEditUser = () => {
    if (!selectedUser) return;

    const updatedUsers = users.map(u =>
      u.id === selectedUser.id
        ? {
            ...u,
            password: formData.password || u.password,
            name: formData.name || u.name,
            ...(u.role === 'student' && {
              course: formData.course || u.course,
              section: formData.section || u.section,
              contact: formData.contact || u.contact,
            }),
          }
        : u
    );

    onUpdateUsers(updatedUsers);
    setShowEditModal(false);
    setSelectedUser(null);
    resetForm();
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this account?')) {
      onUpdateUsers(users.filter(u => u.id !== userId));
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      id: user.id,
      password: '',
      role: user.role,
      name: user.name,
      course: user.course || '',
      section: user.section || '',
      contact: user.contact || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      id: '',
      password: '',
      role: 'student',
      name: '',
      course: '',
      section: '',
      contact: '',
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'staff':
        return <Briefcase className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700';
      case 'staff':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-green-100 text-green-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-gray-900">Account Management</h2>
          <p className="text-gray-600">Manage student, staff, and admin accounts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID or name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="flex gap-2">
            {(['all', 'student', 'staff', 'admin'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                  filterRole === role
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Accounts</p>
          <p className="text-2xl text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Students</p>
          <p className="text-2xl text-green-600">{users.filter(u => u.role === 'student').length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Staff (Max 2)</p>
          <p className="text-2xl text-blue-600">{users.filter(u => u.role === 'staff').length} / 2</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Admins (Max 2)</p>
          <p className="text-2xl text-red-600">{users.filter(u => u.role === 'admin').length} / 2</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm text-gray-700">ID</th>
                <th className="text-left px-4 py-3 text-sm text-gray-700">Name</th>
                <th className="text-left px-4 py-3 text-sm text-gray-700">Role</th>
                <th className="text-left px-4 py-3 text-sm text-gray-700">Course/Section</th>
                <th className="text-left px-4 py-3 text-sm text-gray-700">Contact</th>
                <th className="text-right px-4 py-3 text-sm text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{user.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{user.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getRoleBadgeClass(user.role)}`}>
                      {getRoleIcon(user.role)}
                      <span className="capitalize">{user.role}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {user.course && user.section ? `${user.course} ${user.section}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{user.contact || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Account"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No accounts found matching your criteria
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl text-gray-900">Add New Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block mb-2 text-sm text-gray-700">Account Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['student', 'staff', 'admin'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData({ ...formData, role })}
                      className={`py-3 px-4 rounded-lg border-2 transition-all capitalize ${
                        formData.role === role
                          ? 'border-gray-800 bg-gray-800 text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* ID */}
              <div>
                <label className="block mb-2 text-sm text-gray-700">
                  {formData.role === 'student' ? 'Student ID' : formData.role === 'admin' ? 'Admin ID' : 'Staff ID'} *
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder={formData.role === 'student' ? '2024-07-001234' : formData.role === 'admin' ? 'ADM2024' : '2024-07-00123'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block mb-2 text-sm text-gray-700">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block mb-2 text-sm text-gray-700">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>

              {/* Student-specific fields */}
              {formData.role === 'student' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm text-gray-700">Course *</label>
                      <input
                        type="text"
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        placeholder="e.g., BSIT"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm text-gray-700">Section *</label>
                      <input
                        type="text"
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        placeholder="e.g., 204"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-700">Contact *</label>
                    <input
                      type="text"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="09123456789"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Add Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl text-gray-900">Edit Account: {selectedUser.id}</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block mb-2 text-sm text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block mb-2 text-sm text-gray-700">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>

              {/* Student-specific fields */}
              {selectedUser.role === 'student' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm text-gray-700">Course</label>
                      <input
                        type="text"
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        placeholder="e.g., BSIT"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm text-gray-700">Section</label>
                      <input
                        type="text"
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        placeholder="e.g., 204"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-700">Contact</label>
                    <input
                      type="text"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="09123456789"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditUser}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
