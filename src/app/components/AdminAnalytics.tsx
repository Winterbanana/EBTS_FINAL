import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, Package, TrendingUp, AlertTriangle, Clock, DollarSign, CheckCircle, XCircle, Lightbulb, Target, ThumbsUp, ShieldAlert } from 'lucide-react';
import { BorrowRequest, Equipment } from '../types';

interface AdminAnalyticsProps {
  requests: BorrowRequest[];
  equipment: Equipment[];
}

export function AdminAnalytics({ requests, equipment }: AdminAnalyticsProps) {
  // Overall Statistics
  const totalRequests = requests.length;
  const approvedRequests = requests.filter(r => r.status === 'Approved' || r.status === 'Returned').length;
  const pendingRequests = requests.filter(r => r.status === 'Pending').length;
  const rejectedRequests = requests.filter(r => r.status === 'Rejected').length;
  
  const overdueRequests = requests.filter(r => {
    if (r.status !== 'Approved') return false;
    const due = new Date(r.dueDate);
    const today = new Date();
    return today > due;
  });

  const totalPenalties = requests.reduce((sum, r) => sum + (r.penalty || 0), 0);
  const totalEquipment = equipment.length;
  const availableEquipment = equipment.filter(e => e.status === 'Available').length;
  const borrowedEquipment = equipment.filter(e => e.status === 'Borrowed').length;
  
  // Equipment utilization rate
  const utilizationRate = totalEquipment > 0 ? Math.round((borrowedEquipment / totalEquipment) * 100) : 0;

  // Equipment condition analysis
  const conditionData = getEquipmentConditionData(equipment);

  // Monthly request trends
  const monthlyTrendData = getMonthlyTrendData(requests);

  // Equipment category utilization
  const categoryUtilizationData = getCategoryUtilizationData(equipment, requests);

  // User activity data
  const userActivityData = getUserActivityData(requests);

  // Overdue & Penalty trends
  const overduePenaltyData = getOverduePenaltyData(requests);

  // Status distribution
  const statusData = [
    { name: 'Approved', value: approvedRequests, color: '#10b981' },
    { name: 'Pending', value: pendingRequests, color: '#f59e0b' },
    { name: 'Rejected', value: rejectedRequests, color: '#ef4444' },
    { name: 'Returned', value: requests.filter(r => r.status === 'Returned').length, color: '#3b82f6' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl">Analytics Dashboard</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Requests</p>
              <p className="text-3xl">{totalRequests}</p>
              <p className="text-xs text-green-600 mt-1">
                {approvedRequests} approved
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Equipment Utilization</p>
              <p className="text-3xl text-blue-600">{utilizationRate}%</p>
              <p className="text-xs text-gray-600 mt-1">
                {borrowedEquipment}/{totalEquipment} in use
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Overdue Items</p>
              <p className="text-3xl text-red-600">{overdueRequests.length}</p>
              <p className="text-xs text-red-600 mt-1">
                Requires attention
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Penalties</p>
              <p className="text-3xl text-red-600">₱{totalPenalties}</p>
              <p className="text-xs text-gray-600 mt-1">
                Collected
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1: Usage Analytics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg mb-4">Usage Analytics - Monthly Trend</h3>
        {totalRequests > 0 ? (
          <ResponsiveContainer width="100%" height={350} key="area-chart-monthly">
            <AreaChart data={monthlyTrendData}>
              <defs>
                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="requests" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRequests)" />
              <Area type="monotone" dataKey="approved" stroke="#10b981" fillOpacity={0.6} fill="#10b981" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[350px] flex items-center justify-center text-gray-400">
            <p className="text-sm">No monthly trend data available</p>
          </div>
        )}
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Utilization by Category */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg mb-4">Equipment Utilization Analytics</h3>
          {categoryUtilizationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300} key="bar-chart-utilization">
              <BarChart data={categoryUtilizationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#94a3b8" name="Total Equipment" />
                <Bar dataKey="borrowed" fill="#3b82f6" name="Currently Borrowed" />
                <Bar dataKey="available" fill="#10b981" name="Available" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <p className="text-sm">No equipment utilization data available</p>
            </div>
          )}
        </div>

        {/* Request Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg mb-4">Request Status Distribution</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300} key="pie-chart-admin-status">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, idx) => (
                    <Cell key={`admin-status-cell-${idx}-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <p className="text-sm">No status data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue & Penalty Trends */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg mb-4">Overdue & Penalty Trends</h3>
          {totalPenalties > 0 || overdueRequests.length > 0 ? (
            <ResponsiveContainer width="100%" height={300} key="line-chart-overdue">
              <LineChart data={overduePenaltyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="overdue" stroke="#ef4444" strokeWidth={2} name="Overdue Items" />
                <Line yAxisId="right" type="monotone" dataKey="penalties" stroke="#f59e0b" strokeWidth={2} name="Penalties (₱)" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <p className="text-sm">No overdue or penalty data available</p>
            </div>
          )}
        </div>

        {/* User Activity Analytics */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg mb-4">User Activity Analytics</h3>
          {userActivityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300} key="bar-chart-user-activity">
              <BarChart data={userActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="user" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="requests" fill="#3b82f6" name="Total Requests" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <p className="text-sm">No user activity data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Equipment Condition Analytics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg mb-4">Equipment Condition Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          {conditionData.map((condition) => {
            const colors = {
              'Excellent': { bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircle },
              'Good': { bg: 'bg-blue-100', text: 'text-blue-600', icon: CheckCircle },
              'Fair': { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: AlertTriangle },
              'Poor': { bg: 'bg-orange-100', text: 'text-orange-600', icon: AlertTriangle },
              'Damaged': { bg: 'bg-red-100', text: 'text-red-600', icon: XCircle },
            };
            const style = colors[condition.name as keyof typeof colors];
            const Icon = style.icon;

            return (
              <div key={`condition-${condition.name}`} className={`${style.bg} rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-5 h-5 ${style.text}`} />
                  <p className={`text-sm ${style.text}`}>{condition.name}</p>
                </div>
                <p className={`text-2xl ${style.text}`}>{condition.count}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {totalEquipment > 0 ? Math.round((condition.count / totalEquipment) * 100) : 0}% of total
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="text-sm text-gray-600">Approval Rate</h4>
          </div>
          <p className="text-2xl text-green-600">
            {totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0}%
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-yellow-600" />
            <h4 className="text-sm text-gray-600">Pending Requests</h4>
          </div>
          <p className="text-2xl text-yellow-600">{pendingRequests}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h4 className="text-sm text-gray-600">Active Borrows</h4>
          </div>
          <p className="text-2xl text-blue-600">{borrowedEquipment}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <h4 className="text-sm text-gray-600">Rejection Rate</h4>
          </div>
          <p className="text-2xl text-red-600">
            {totalRequests > 0 ? Math.round((rejectedRequests / totalRequests) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* System-Wide Insights & Feedback */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-sm p-6 border border-purple-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl text-gray-900">System Insights & Recommendations</h3>
            <p className="text-sm text-gray-600">Comprehensive analysis of borrowing system performance</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* System Health Score */}
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-purple-600 mt-1" />
              <div className="flex-1">
                <h4 className="text-sm text-gray-900 mb-2">Overall System Health Score</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-purple-50 rounded p-3">
                    <p className="text-xs text-gray-600 mb-1">Equipment Utilization</p>
                    <p className={`text-2xl ${utilizationRate >= 50 && utilizationRate <= 80 ? 'text-green-600' : utilizationRate > 80 ? 'text-orange-600' : 'text-blue-600'}`}>
                      {utilizationRate}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {utilizationRate >= 50 && utilizationRate <= 80 ? 'Optimal' : utilizationRate > 80 ? 'High demand' : 'Underutilized'}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded p-3">
                    <p className="text-xs text-gray-600 mb-1">Return Compliance</p>
                    <p className={`text-2xl ${totalRequests > 0 && ((totalRequests - overdueRequests.length) / totalRequests) >= 0.8 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalRequests > 0 ? Math.round(((totalRequests - overdueRequests.length) / totalRequests) * 100) : 0}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {totalRequests > 0 && ((totalRequests - overdueRequests.length) / totalRequests) >= 0.8 ? 'Excellent' : 'Needs attention'}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded p-3">
                    <p className="text-xs text-gray-600 mb-1">Equipment Condition</p>
                    <p className={`text-2xl ${equipment.filter(e => e.qualityCondition === 'Excellent' || e.qualityCondition === 'Good').length / totalEquipment >= 0.8 ? 'text-green-600' : 'text-orange-600'}`}>
                      {totalEquipment > 0 ? Math.round((equipment.filter(e => e.qualityCondition === 'Excellent' || e.qualityCondition === 'Good').length / totalEquipment) * 100) : 0}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Good/Excellent</p>
                  </div>
                  <div className="bg-purple-50 rounded p-3">
                    <p className="text-xs text-gray-600 mb-1">Response Time</p>
                    <p className="text-2xl text-blue-600">
                      {pendingRequests > 0 ? 'Review' : 'Good'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{pendingRequests} pending</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Alerts */}
          {(overdueRequests.length > 0 || equipment.filter(e => e.status === 'Missing').length > 0 || pendingRequests > 5) && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 mt-1" />
                <div>
                  <h4 className="text-sm text-red-900 mb-2">⚠️ Critical Alerts Requiring Immediate Action</h4>
                  <ul className="text-sm text-red-800 space-y-1">
                    {overdueRequests.length > 0 && (
                      <li>• <strong>{overdueRequests.length} overdue items</strong> - Contact students immediately to prevent further penalties</li>
                    )}
                    {equipment.filter(e => e.status === 'Missing').length > 0 && (
                      <li>• <strong>{equipment.filter(e => e.status === 'Missing').length} missing items</strong> (₱{equipment.filter(e => e.status === 'Missing').length * 200} in potential losses) - Initiate recovery procedures</li>
                    )}
                    {pendingRequests > 5 && (
                      <li>• <strong>{pendingRequests} pending requests</strong> - Process requests to maintain student satisfaction</li>
                    )}
                    {equipment.filter(e => e.qualityCondition === 'Damaged' || e.qualityCondition === 'Poor').length > 0 && (
                      <li>• <strong>{equipment.filter(e => e.qualityCondition === 'Damaged' || e.qualityCondition === 'Poor').length} items in poor/damaged condition</strong> - Schedule maintenance or replacement</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Positive Trends */}
          {totalRequests > 0 && ((totalRequests - overdueRequests.length) / totalRequests) >= 0.8 && equipment.filter(e => e.status === 'Missing').length === 0 && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <ThumbsUp className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4 className="text-sm text-green-900 mb-2">🌟 System Performance Highlights</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• <strong>Excellent return compliance:</strong> {Math.round(((totalRequests - overdueRequests.length) / totalRequests) * 100)}% of items returned on time</li>
                    <li>• <strong>Zero missing items:</strong> All equipment accounted for</li>
                    <li>• <strong>High approval rate:</strong> {Math.round((approvedRequests / totalRequests) * 100)}% of requests approved</li>
                    <li>• <strong>Total revenue:</strong> ₱{totalPenalties} collected from late penalties</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Usage Analytics & Patterns */}
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-purple-600 mt-1" />
              <div className="flex-1">
                <h4 className="text-sm text-gray-900 mb-3">Usage Analytics & Borrowing Patterns</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-2">Most Popular Equipment</p>
                    <div className="space-y-2">
                      {categoryUtilizationData.sort((a, b) => b.borrowed - a.borrowed).map((cat) => (
                        <div key={`category-${cat.category}`} className="flex justify-between items-center bg-purple-50 rounded p-2">
                          <span className="text-sm text-gray-800">{cat.category}</span>
                          <span className="text-sm text-purple-600">{cat.borrowed} borrowed</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-2">Peak Activity Insights</p>
                    <div className="bg-purple-50 rounded p-3 mb-2">
                      <p className="text-xs text-gray-600">Busiest Month</p>
                      <p className="text-sm text-gray-900">{monthlyTrendData.sort((a, b) => b.requests - a.requests)[0]?.month || 'N/A'} ({monthlyTrendData.sort((a, b) => b.requests - a.requests)[0]?.requests || 0} requests)</p>
                    </div>
                    <div className="bg-purple-50 rounded p-3 mb-2">
                      <p className="text-xs text-gray-600">Most Active Student</p>
                      <p className="text-sm text-gray-900">{userActivityData[0]?.user || 'N/A'} ({userActivityData[0]?.requests || 0} requests)</p>
                    </div>
                    <div className="bg-purple-50 rounded p-3">
                      <p className="text-xs text-gray-600">Average Processing Time</p>
                      <p className="text-sm text-gray-900">{pendingRequests > 0 ? 'Under review' : 'Same day'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Recommendations */}
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-purple-600 mt-1" />
              <div>
                <h4 className="text-sm text-gray-900 mb-2">Strategic Recommendations for System Improvement</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  {utilizationRate > 80 && (
                    <li>• <strong>High demand detected:</strong> Consider acquiring additional {categoryUtilizationData.sort((a, b) => b.borrowed - a.borrowed)[0]?.category} equipment to meet student needs</li>
                  )}
                  {utilizationRate < 30 && (
                    <li>• <strong>Low utilization:</strong> Promote equipment availability through student communications or adjust inventory</li>
                  )}
                  {equipment.filter(e => e.qualityCondition === 'Fair' || e.qualityCondition === 'Poor').length > 0 && (
                    <li>• <strong>Maintenance needed:</strong> Schedule repairs for {equipment.filter(e => e.qualityCondition === 'Fair' || e.qualityCondition === 'Poor').length} items to prevent future damage</li>
                  )}
                  {totalPenalties > 500 && (
                    <li>• <strong>High penalty trend:</strong> Implement automated reminder system to reduce late returns and improve compliance</li>
                  )}
                  {pendingRequests > 3 && (
                    <li>• <strong>Request backlog:</strong> Streamline approval process or add more staff members to handle requests</li>
                  )}
                  <li>• <strong>Data-driven decision:</strong> Use peak activity months ({monthlyTrendData.sort((a, b) => b.requests - a.requests)[0]?.month}) to schedule maintenance during low-demand periods</li>
                  <li>• <strong>Student engagement:</strong> Recognize top borrowers with good return records to encourage responsible behavior</li>
                  {equipment.filter(e => e.status === 'Missing').length === 0 && totalRequests > 5 && (
                    <li>• 🎯 <strong>Excellent management:</strong> Zero missing items shows effective tracking. Continue current procedures!</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Financial Overview */}
          {totalPenalties > 0 && (
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-purple-600 mt-1" />
                <div className="flex-1">
                  <h4 className="text-sm text-gray-900 mb-3">Financial Overview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-purple-50 rounded p-3">
                      <p className="text-xs text-gray-600 mb-1">Total Penalties Collected</p>
                      <p className="text-2xl text-purple-600">₱{totalPenalties}</p>
                    </div>
                    <div className="bg-purple-50 rounded p-3">
                      <p className="text-xs text-gray-600 mb-1">Avg. Penalty per Incident</p>
                      <p className="text-2xl text-purple-600">
                        ₱{requests.filter(r => r.penalty && r.penalty > 0).length > 0 ? Math.round(totalPenalties / requests.filter(r => r.penalty && r.penalty > 0).length) : 0}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded p-3">
                      <p className="text-xs text-gray-600 mb-1">Potential Missing Item Costs</p>
                      <p className="text-2xl text-red-600">₱{equipment.filter(e => e.status === 'Missing').length * 200}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getMonthlyTrendData(requests: BorrowRequest[]) {
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  const monthlyData: { [key: string]: { requests: number, approved: number } } = {};
  
  months.forEach(month => {
    monthlyData[month] = { requests: 0, approved: 0 };
  });

  requests.forEach(req => {
    const date = new Date(req.requestDate);
    const monthName = date.toLocaleString('default', { month: 'short' });
    if (monthlyData[monthName]) {
      monthlyData[monthName].requests++;
      if (req.status === 'Approved' || req.status === 'Returned') {
        monthlyData[monthName].approved++;
      }
    }
  });

  return months.map((month) => ({
    month,
    requests: monthlyData[month].requests,
    approved: monthlyData[month].approved,
  }));
}

function getCategoryUtilizationData(equipment: Equipment[], requests: BorrowRequest[]) {
  const categories = ['Screwdriver Set', 'LAN Cable Set', 'Cable Pliers', 'Wires', 'RJ45', 'LAN Cables', 'Cooking Tool Set', 'Projectors', 'HDMI Cables', 'First Aid Kits'];

  return categories.map((category) => {
    const categoryEquipment = equipment.filter(e => e.category === category);
    const total = categoryEquipment.length;
    const borrowed = categoryEquipment.filter(e => e.status === 'Borrowed').length;
    const available = categoryEquipment.filter(e => e.status === 'Available').length;

    return {
      category,
      total,
      borrowed,
      available,
    };
  }).filter(cat => cat.total > 0); // Only show categories with equipment
}

function getUserActivityData(requests: BorrowRequest[]) {
  const userActivity: { [key: string]: number } = {};

  requests.forEach(req => {
    const userName = req.studentName.split(',')[0]; // Get last name
    if (!userActivity[userName]) {
      userActivity[userName] = 0;
    }
    userActivity[userName]++;
  });

  return Object.keys(userActivity)
    .map((user) => ({
      user,
      requests: userActivity[user],
    }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 8); // Top 8 users
}

function getOverduePenaltyData(requests: BorrowRequest[]) {
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  const monthlyData: { [key: string]: { overdue: number, penalties: number } } = {};
  
  months.forEach(month => {
    monthlyData[month] = { overdue: 0, penalties: 0 };
  });

  requests.forEach(req => {
    if (req.returnDate || req.status === 'Returned') {
      const date = new Date(req.returnDate || req.dueDate);
      const monthName = date.toLocaleString('default', { month: 'short' });
      if (monthlyData[monthName]) {
        if (req.penalty && req.penalty > 0) {
          monthlyData[monthName].overdue++;
          monthlyData[monthName].penalties += req.penalty;
        }
      }
    }
  });

  return months.map((month) => ({
    month,
    overdue: monthlyData[month].overdue,
    penalties: monthlyData[month].penalties,
  }));
}

function getEquipmentConditionData(equipment: Equipment[]) {
  const conditions = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'];
  
  return conditions.map(condition => {
    const count = equipment.filter(e => e.qualityCondition === condition).length;
    return {
      name: condition,
      count,
    };
  });
}
