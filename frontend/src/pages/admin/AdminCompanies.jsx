import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { adminAPI } from '../../api/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { useNavigate } from 'react-router-dom'

const AdminCompanies = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadCompanies = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Loading companies...')
      const response = await adminAPI.getAllCompanies()
      console.log('Companies response:', response)
      setCompanies(response.companies || [])
    } catch (error) {
      console.error('Failed to load companies:', error)
      setError(error.response?.data?.message || 'Failed to load companies')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  // Get statistics
  const stats = {
    total: companies.length,
    withJobs: companies.filter(c => c.jobs_posted > 0).length,
    totalJobs: companies.reduce((sum, c) => sum + c.jobs_posted, 0),
    avgJobsPerCompany: companies.length > 0 ? (companies.reduce((sum, c) => sum + c.jobs_posted, 0) / companies.length).toFixed(1) : 0
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatWebsite = (website) => {
    if (!website || website === 'Not provided') return 'N/A'
    
    // Add https:// if no protocol is specified
    const url = website.startsWith('http') ? website : `https://${website}`
    
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline"
      >
        {website}
      </a>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-red-900">
              Company Management
            </h1>
            <p className="text-red-700 mt-1">
              Welcome back, {user?.email}
            </p>
            <p className="text-red-600 text-sm mt-1">
              Manage companies and their job postings
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              Administrator
            </span>
            <Button onClick={loadCompanies} disabled={loading} variant="outline">
              {loading ? 'Loading...' : 'Refresh Data'}
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Companies with Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.withJobs}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Jobs Posted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalJobs}</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Jobs/Company</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.avgJobsPerCompany}</div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading companies...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <Button onClick={loadCompanies} className="mt-2" size="sm">
            Retry
          </Button>
        </div>
      )}

      {/* Companies Table */}
      {!loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Companies ({companies.length})</CardTitle>
            <CardDescription>
              All companies registered in the TnP system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {companies.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No companies found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Company Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Website</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Jobs Posted</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Registered</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr key={company.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">
                            {company.name}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-600 max-w-xs truncate" title={company.description}>
                            {company.description || 'No description'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-600">
                            {formatWebsite(company.website)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              company.jobs_posted > 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {company.jobs_posted} {company.jobs_posted === 1 ? 'job' : 'jobs'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-600 text-sm">
                            {formatDate(company.created_at)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => {
                                // Could navigate to company details or jobs
                                console.log('View company details:', company.id)
                              }}
                            >
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-gray-500 hover:text-gray-700"
                              onClick={() => {
                                // Could add edit company functionality here
                                console.log('Edit company:', company.id)
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Future Actions Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Company Management Actions</CardTitle>
          <CardDescription>Additional management features (coming soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" disabled className="h-20 flex flex-col items-center justify-center space-y-2">
              <span className="text-lg">✏️</span>
              <span>Edit Company</span>
            </Button>
            <Button variant="outline" disabled className="h-20 flex flex-col items-center justify-center space-y-2">
              <span className="text-lg">🗑️</span>
              <span>Delete Company</span>
            </Button>
            <Button variant="outline" disabled className="h-20 flex flex-col items-center justify-center space-y-2">
              <span className="text-lg">📊</span>
              <span>Company Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminCompanies
