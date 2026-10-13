import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, DollarSign, Lightbulb, ThumbsUp, ThumbsDown, Target } from 'lucide-react';
import { BorrowRequest } from '../types';

interface StudentAnalyticsProps {
  requests: BorrowRequest[];
  userId: string;
}

export function StudentAnalytics({ requests, userId }: StudentAnalyticsProps) {
  const userRequests = requests.filter(r => r.studentId === userId);

  // Calculate statistics
  const totalRequests = userRequests.length;
  const approvedRequests = userRequests.filter(r => r.status === 'Approved' || r.status === 'Returned').length;
  const pendingRequests = userRequests.filter(r => r.status === 'Pending').length;
  const rejectedRequests = userRequests.filter(r => r.status === 'Rejected').length;
  
  const overdueRequests = userRequests.filter(r => {
    if (r.status !== 'Approved') return false;
    const due = new Date(r.dueDate);
    const today = new Date();
    return today > due;
  });

  const totalPenalties = userRequests.reduce((sum, r) => sum + (r.penalty || 0), 0);
  const averageHoursBorrowed = userRequests.filter(r => r.hoursBorrowed).reduce((sum, r) => sum + (r.hoursBorrowed || 0), 0) / userRequests.filter(r => r.hoursBorrowed).length || 0;

  // Request Status Distribution
  const statusData = [
    { name: 'Approved', value: approvedRequests, color: '#10b981' },
    { name: 'Pending', value: pendingRequests, color: '#f59e0b' },
    { name: 'Rejected', value: rejectedRequests, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // Monthly Usage Trend (last 6 months)
  const monthlyData = getMonthlyUsageData(userRequests);

  // Equipment Category Usage
  const categoryData = getCategoryUsageData(userRequests);

  // Penalty Trends
  const penaltyTrendData = getPenaltyTrendData(userRequests);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl">My Analytics Dashboard</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Requests</p>
              <p className="text-3xl">{totalRequests}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Approved Rate</p>
              <p className="text-3xl text-green-600">
                {totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Overdue Items</p>
              <p className="text-3xl text-red-600">{overdueRequests.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Penalties</p>
              <p className="text-3xl text-red-600">₱{totalPenalties}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg mb-4">Request Status Distribution</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300} key="pie-chart-status">
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
                    <Cell key={`student-status-cell-${idx}-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <p className="text-sm">No request data available</p>
            </div>
          )}
        </div>

        {/* Equipment Category Usage */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg mb-4">Equipment Category Usage</h3>
          {categoryData.filter(c => c.requests > 0).length > 0 ? (
            <ResponsiveContainer width="100%" height={300} key="bar-chart-category">
              <BarChart data={categoryData.filter(c => c.requests > 0)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="requests" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <p className="text-sm">No category usage data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Usage Trend */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg mb-4">Monthly Usage Trend</h3>
          {totalRequests > 0 ? (
            <ResponsiveContainer width="100%" height={300} key="line-chart-monthly">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <p className="text-sm">No monthly usage data available</p>
            </div>
          )}
        </div>

        {/* Penalty Trends */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg mb-4">Penalty Trends</h3>
          {totalPenalties > 0 ? (
            <ResponsiveContainer width="100%" height={300} key="line-chart-penalty">
              <LineChart data={penaltyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="penalties" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <p className="text-sm">No penalty data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <h4 className="text-sm text-gray-600">Average Borrow Time</h4>
          </div>
          <p className="text-2xl">{averageHoursBorrowed.toFixed(1)} hours</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h4 className="text-sm text-gray-600">On-Time Returns</h4>
          </div>
          <p className="text-2xl text-green-600">
            {totalRequests > 0 ? Math.round(((totalRequests - overdueRequests.length) / totalRequests) * 100) : 0}%
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <h4 className="text-sm text-gray-600">Late Returns</h4>
          </div>
          <p className="text-2xl text-red-600">{overdueRequests.length}</p>
        </div>
      </div>

      {/* System Insights & Feedback */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl text-gray-900">Personal Insights & Recommendations</h3>
            <p className="text-sm text-gray-600">AI-powered analysis of your borrowing behavior</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Performance Rating */}
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-blue-600 mt-1" />
              <div className="flex-1">
                <h4 className="text-sm text-gray-900 mb-2">Overall Performance Rating</h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        totalRequests > 0 && Math.round(((totalRequests - overdueRequests.length) / totalRequests) * 100) >= 80
                          ? 'bg-green-500'
                          : totalRequests > 0 && Math.round(((totalRequests - overdueRequests.length) / totalRequests) * 100) >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${totalRequests > 0 ? Math.round(((totalRequests - overdueRequests.length) / totalRequests) * 100) : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-2xl text-gray-900">
                    {totalRequests > 0 ? Math.round(((totalRequests - overdueRequests.length) / totalRequests) * 100) : 0}%
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {totalRequests > 0 && Math.round(((totalRequests - overdueRequests.length) / totalRequests) * 100) >= 80
                    ? '🌟 Excellent! You are a responsible borrower.'
                    : totalRequests > 0 && Math.round(((totalRequests - overdueRequests.length) / totalRequests) * 100) >= 60
                    ? '⚠️ Good, but there is room for improvement.'
                    : '❗ Needs improvement. Please return items on time.'}
                </p>
              </div>
            </div>
          </div>

          {/* Positive Insights */}
          {totalRequests > 0 && Math.round(((totalRequests - overdueRequests.length) / totalRequests) * 100) >= 80 && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <ThumbsUp className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4 className="text-sm text-green-900 mb-2">What You're Doing Well</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Consistently returning equipment on time ({totalRequests > 0 ? Math.round(((totalRequests - overdueRequests.length) / totalRequests) * 100) : 0}% on-time rate)</li>
                    <li>• No penalty charges incurred - saving money!</li>
                    <li>• Contributing to smooth equipment availability for other students</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Areas for Improvement */}
          {(overdueRequests.length > 0 || totalPenalties > 0) && (
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-1" />
                <div>
                  <h4 className="text-sm text-orange-900 mb-2">Areas for Improvement</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    {overdueRequests.length > 0 && (
                      <li>• You have {overdueRequests.length} overdue item{overdueRequests.length > 1 ? 's' : ''} - please return ASAP</li>
                    )}
                    {totalPenalties > 0 && (
                      <li>• Total penalties: ₱{totalPenalties} - Set reminders to return items on time</li>
                    )}
                    <li>• Consider borrowing items only when necessary to maintain a good track record</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Borrowing Patterns */}
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-1" />
              <div className="flex-1">
                <h4 className="text-sm text-gray-900 mb-2">Your Borrowing Patterns</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded p-3">
                    <p className="text-xs text-gray-600 mb-1">Most Borrowed</p>
                    <p className="text-sm text-gray-900">
                      {categoryData.sort((a, b) => b.requests - a.requests)[0]?.name || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded p-3">
                    <p className="text-xs text-gray-600 mb-1">Avg. Borrow Duration</p>
                    <p className="text-sm text-gray-900">{averageHoursBorrowed.toFixed(1)}h</p>
                  </div>
                  <div className="bg-blue-50 rounded p-3">
                    <p className="text-xs text-gray-600 mb-1">Peak Month</p>
                    <p className="text-sm text-gray-900">
                      {monthlyData.sort((a, b) => b.requests - a.requests)[0]?.month || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Recommendations */}
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <h4 className="text-sm text-gray-900 mb-2">Smart Recommendations</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {averageHoursBorrowed > 6 && (
                    <li>• You tend to borrow items for extended periods. Plan ahead to return within the 8-hour limit.</li>
                  )}
                  {approvedRequests > 0 && totalRequests > 0 && (approvedRequests / totalRequests) < 0.7 && (
                    <li>• Your approval rate is {Math.round((approvedRequests / totalRequests) * 100)}%. Ensure equipment is available before requesting.</li>
                  )}
                  <li>• Set phone reminders 1 hour before due time to avoid penalties.</li>
                  <li>• Check equipment condition before and after use to avoid damage charges.</li>
                  {totalPenalties === 0 && totalRequests > 3 && (
                    <li>• 🎉 Keep up the great work! Zero penalties shows excellent responsibility.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getMonthlyUsageData(requests: BorrowRequest[]) {
  const months = getRecentMonthBuckets();
  const monthlyCount = new Map(months.map(month => [month.key, 0]));

  requests.forEach(req => {
    const date = parseDate(req.requestDate);
    const key = date ? `${date.getFullYear()}-${date.getMonth()}` : '';
    if (monthlyCount.has(key)) monthlyCount.set(key, (monthlyCount.get(key) || 0) + 1);
  });

  return months.map(({ key, label }) => ({
    month: label,
    requests: monthlyCount.get(key) || 0,
  }));
}

function getCategoryUsageData(requests: BorrowRequest[]) {
  const categories = new Map<string, number>();
  requests.forEach(request => {
    const category = request.equipmentCategory || 'Other';
    categories.set(category, (categories.get(category) || 0) + 1);
  });
  return Array.from(categories, ([name, count]) => ({ name, requests: count }));
}

function getPenaltyTrendData(requests: BorrowRequest[]) {
  const months = getRecentMonthBuckets();
  const monthlyPenalties = new Map(months.map(month => [month.key, 0]));

  requests.forEach(req => {
    if (req.penalty && req.returnDate) {
      const date = parseDate(req.returnDate);
      const key = date ? `${date.getFullYear()}-${date.getMonth()}` : '';
      if (monthlyPenalties.has(key)) monthlyPenalties.set(key, (monthlyPenalties.get(key) || 0) + req.penalty);
    }
  });

  return months.map(({ key, label }) => ({
    month: label,
    penalties: monthlyPenalties.get(key) || 0,
  }));
}

function getRecentMonthBuckets() {
  const current = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(current.getFullYear(), current.getMonth() - 5 + index, 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
    };
  });
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}
