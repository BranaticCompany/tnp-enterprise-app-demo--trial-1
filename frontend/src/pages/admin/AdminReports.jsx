import React, { useState, useEffect } from 'react'
import { reportsAPI } from '../../api/auth'
import toast from 'react-hot-toast'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'

const AdminReports = () => {
  const [loading, setLoading] = useState(true)
  const [summaryStats, setSummaryStats] = useState(null)
  const [applicationsByCompany, setApplicationsByCompany] = useState([])
  const [packageDistribution, setPackageDistribution] = useState(null)
  const [placementTrends, setPlacementTrends] = useState([])
  const [applicationStatus, setApplicationStatus] = useState([])
  const [error, setError] = useState(null)

  // Colors for charts
  const COLORS = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    indigo: '#6366F1',
    pink: '#EC4899',
    teal: '#14B8A6'
  }

  const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.danger]

  useEffect(() => {
    fetchAllReports()
  }, [])

  const fetchAllReports = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('=== FETCHING ALL REPORTS ===')

      // Fetch all reports in parallel
      const [
        summaryResponse,
        applicationsByCompanyResponse,
        packageDistributionResponse,
        placementTrendsResponse,
        applicationStatusResponse
      ] = await Promise.all([
        reportsAPI.getSummaryStats(),
        reportsAPI.getApplicationsByCompany(),
        reportsAPI.getPackageDistribution(),
        reportsAPI.getPlacementTrends(),
        reportsAPI.getApplicationStatus()
      ])

      console.log('Summary stats:', summaryResponse)
      console.log('Applications by company:', applicationsByCompanyResponse)
      console.log('Package distribution:', packageDistributionResponse)
      console.log('Placement trends:', placementTrendsResponse)
      console.log('Application status:', applicationStatusResponse)

      setSummaryStats(summaryResponse)
      setApplicationsByCompany(applicationsByCompanyResponse)
      setPackageDistribution(packageDistributionResponse)
      setPlacementTrends(placementTrendsResponse)
      setApplicationStatus(applicationStatusResponse)

    } catch (error) {
      console.error('Failed to fetch reports:', error)
      setError(error.response?.data?.error || 'Failed to load reports data')
      toast.error('Failed to load reports data')
    } finally {
      setLoading(false)
    }
  }

  const formatPackageDistributionForChart = (distribution) => {
    if (!distribution) return []
    
    // Filter out zero values and calculate percentages
    const entries = Object.entries(distribution).filter(([range, count]) => count > 0)
    const total = entries.reduce((sum, [range, count]) => sum + count, 0)
    
    if (total === 0) return []
    
    return entries.map(([range, count]) => ({
      name: `₹${range}L`,
      range: `₹${range}L`,
      count: count,
      percentage: ((count / total) * 100).toFixed(1)
    }))
  }

  const formatApplicationStatusForChart = (statusData) => {
    return statusData.map((item, index) => ({
      ...item,
      color: PIE_COLORS[index % PIE_COLORS.length]
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            <span className="ml-3 text-gray-600">Loading reports...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-red-600 text-xl mb-4">⚠️ Error Loading Reports</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchAllReports}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">📊 Reports & Analytics</h1>
            <p className="text-red-100">
              Comprehensive insights and analytics for data-driven decision making
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={fetchAllReports}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            🔄 Refresh Data
          </button>
        </div>

        {/* Summary Statistics Cards */}
        {summaryStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryStats.total_students}</p>
                </div>
                <div className="text-blue-500 text-3xl">👥</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Placed Students</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryStats.placed_students}</p>
                  <p className="text-sm text-green-600">
                    {summaryStats.placement_rate}% placement rate
                  </p>
                </div>
                <div className="text-green-500 text-3xl">🎯</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryStats.total_applications}</p>
                </div>
                <div className="text-purple-500 text-3xl">📄</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Package</p>
                  <p className="text-2xl font-bold text-gray-900">₹{summaryStats.avg_package}L</p>
                  <p className="text-sm text-gray-500">per annum</p>
                </div>
                <div className="text-yellow-500 text-3xl">💰</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-indigo-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Companies</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryStats.total_companies}</p>
                </div>
                <div className="text-indigo-500 text-3xl">🏢</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-pink-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryStats.total_jobs}</p>
                </div>
                <div className="text-pink-500 text-3xl">💼</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-teal-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Interviews</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryStats.total_interviews}</p>
                </div>
                <div className="text-teal-500 text-3xl">🎤</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Placement Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryStats.placement_rate}%</p>
                  <p className="text-sm text-gray-500">success rate</p>
                </div>
                <div className="text-orange-500 text-3xl">📈</div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Applications by Company Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📊 Applications by Company
            </h3>
            {applicationsByCompany.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={applicationsByCompany} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="company" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={11}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} applications`, 'Applications']}
                      labelFormatter={(label) => `Company: ${label}`}
                    />
                    <Bar dataKey="applications" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Summary Table */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Top Companies by Applications</h4>
                  <div className="space-y-2">
                    {applicationsByCompany.slice(0, 5).map((company, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{company.company}</span>
                        <span className="text-sm text-gray-600">{company.applications} applications</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <div className="text-6xl mb-4">📊</div>
                <div className="text-lg font-medium mb-2">No Application Data</div>
                <div className="text-sm text-center">
                  Application data by company will appear here once students start applying for jobs.
                </div>
              </div>
            )}
          </div>

          {/* Package Distribution Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              💰 Package Distribution
            </h3>
            {packageDistribution && Object.keys(packageDistribution).length > 0 ? (
              (() => {
                const chartData = formatPackageDistributionForChart(packageDistribution)
                return chartData.length > 0 ? (
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, count, percentage }) => `${name}: ${count} (${percentage}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name) => [`${value} students`, 'Count']}
                          labelFormatter={(label) => `Package Range: ${label}`}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value, entry) => `${entry.payload.name}: ${entry.payload.count} (${entry.payload.percentage}%)`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Summary Statistics */}
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      {chartData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div 
                              className="w-4 h-4 rounded-full mr-2" 
                              style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                            ></div>
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold">{item.count} students</div>
                            <div className="text-xs text-gray-500">{item.percentage}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <div className="text-6xl mb-4">📊</div>
                    <div className="text-lg font-medium mb-2">No Placement Data Yet</div>
                    <div className="text-sm text-center">
                      Package distribution will appear here once students get placed.<br/>
                      Currently showing 0 placements across all salary ranges.
                    </div>
                  </div>
                )
              })()
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <div className="text-6xl mb-4">📊</div>
                <div className="text-lg font-medium mb-2">No Package Data Available</div>
                <div className="text-sm text-center">
                  Package distribution data is not available.<br/>
                  This could be due to missing placement records or database issues.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Application Status Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📈 Application Status Distribution
            </h3>
            {applicationStatus.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={applicationStatus} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="status" 
                      fontSize={12}
                      tick={{ textTransform: 'capitalize' }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} applications`, 'Count']}
                      labelFormatter={(label) => `Status: ${label.charAt(0).toUpperCase() + label.slice(1)}`}
                    />
                    <Bar dataKey="count" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Status Summary */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {applicationStatus.map((status, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium capitalize">{status.status}</span>
                      <span className="text-sm text-gray-600">{status.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <div className="text-6xl mb-4">📈</div>
                <div className="text-lg font-medium mb-2">No Application Status Data</div>
                <div className="text-sm text-center">
                  Application status distribution will appear here once students start applying.
                </div>
              </div>
            )}
          </div>

          {/* Placement Trends */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📅 Placement Trends (Last 12 Months)
            </h3>
            {placementTrends.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={placementTrends} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      fontSize={12}
                      tick={{ angle: -45 }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} placements`, 'Placements']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="placements" 
                      stroke={COLORS.accent} 
                      strokeWidth={3}
                      dot={{ fill: COLORS.accent, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                
                {/* Trends Summary */}
                <div className="mt-4">
                  <div className="text-sm text-gray-600">
                    Total placements in last 12 months: <span className="font-bold">
                      {placementTrends.reduce((sum, trend) => sum + trend.placements, 0)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <div className="text-6xl mb-4">📅</div>
                <div className="text-lg font-medium mb-2">No Placement Trends</div>
                <div className="text-sm text-center">
                  Placement trends over time will appear here once placement data is available.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Reports generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  )
}

export default AdminReports
