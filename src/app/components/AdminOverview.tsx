import { Package, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { Equipment, BorrowRequest } from '../types';
import { MAX_ACTIVE_BORROW_LIMIT, getStudentActiveBorrowCount } from '../borrowing';
import { getInventoryMetrics } from '../inventoryMetrics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AdminOverviewProps {
  equipment: Equipment[];
  requests: BorrowRequest[];
}

export function AdminOverview({ equipment, requests }: AdminOverviewProps) {
  const inventoryMetrics = getInventoryMetrics(equipment, requests);
  const totalEquipment = inventoryMetrics.total;
  const availableEquipment = inventoryMetrics.available;
  const borrowedEquipment = inventoryMetrics.borrowed;
  const pendingRequests = requests.filter(r => r.status === 'Pending').length;
  const approvedRequests = requests.filter(r => r.status === 'Approved').length;

  const studentsAtLimit = Array.from(new Set(
    requests.filter(r => r.status === 'Approved').map(r => r.studentId)
  )).filter(studentId => getStudentActiveBorrowCount(studentId, requests) >= MAX_ACTIVE_BORROW_LIMIT).length;

  const categoryData = Array.from(new Set(equipment.map(item => item.category))).sort().map(category => {
    const items = equipment.filter(item => item.category === category);
    return {
      id: `category-${category}`,
      name: category,
      total: items.reduce((sum, item) => sum + (inventoryMetrics.byEquipmentId.get(item.id)?.total || 0), 0),
      available: items.reduce((sum, item) => sum + (inventoryMetrics.byEquipmentId.get(item.id)?.available || 0), 0),
      borrowed: items.reduce((sum, item) => sum + (inventoryMetrics.byEquipmentId.get(item.id)?.borrowed || 0), 0),
    };
  });

  // Status pie chart data
  const statusData = [
    { id: 'status-available', name: 'Available', value: availableEquipment },
    { id: 'status-borrowed', name: 'Borrowed', value: borrowedEquipment },
  ];

  const COLORS = ['#10b981', '#ef4444'];

  // Recent activities
  const recentRequests = [...requests]
    .sort((a, b) => `${b.requestDate} ${b.borrowTime || ''}`.localeCompare(`${a.requestDate} ${a.borrowTime || ''}`))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600">Total Stock Units</h3>
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl">{totalEquipment}</p>
          <p className="text-sm text-gray-500 mt-1">Across all categories</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600">Available Units</h3>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl">{availableEquipment}</p>
          <p className="text-sm text-gray-500 mt-1">Ready to borrow</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600">Borrowed Units</h3>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl">{borrowedEquipment}</p>
          <p className="text-sm text-gray-500 mt-1">Currently in use</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600">Pending</h3>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl">{pendingRequests}</p>
          <p className="text-sm text-gray-500 mt-1">Need approval</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600">At Limit</h3>
            <TrendingUp className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl text-red-600">{studentsAtLimit}</p>
          <p className="text-sm text-gray-500 mt-1">Students at 3/3</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg mb-4">Equipment by Category</h3>
          <ResponsiveContainer width="100%" height={300} key="overview-bar-chart">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar key="bar-available" dataKey="available" fill="#10b981" name="Available" />
              <Bar key="bar-borrowed" dataKey="borrowed" fill="#ef4444" name="Borrowed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg mb-4">Overall Status</h3>
          <ResponsiveContainer width="100%" height={300} key="overview-pie-chart">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry) => (
                  <Cell key={entry.id} fill={COLORS[entry.name === 'Available' ? 0 : 1]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg mb-4">Recent Requests</h3>
        <div className="space-y-3">
          {recentRequests.map(request => (
            <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  request.status === 'Pending' ? 'bg-yellow-100' :
                  request.status === 'Approved' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {request.status === 'Pending' ? (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  ) : request.status === 'Approved' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm">{request.studentName}</p>
                  <p className="text-xs text-gray-600">{request.equipmentName}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  request.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                  request.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {request.status}
                </span>
                <p className="text-xs text-gray-500 mt-1">{request.requestDate}</p>
              </div>
            </div>
          ))}
          {recentRequests.length === 0 && (
            <p className="text-center text-gray-500 py-8">No recent requests</p>
          )}
        </div>
      </div>
    </div>
  );
}
