import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { placementsAPI } from '../../api/auth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import toast from 'react-hot-toast'
import { formatSalary, formatDate, formatStatus, getStatusColor, getStatusIcon } from '../../utils/formatters'

const MyPlacements = () => {
  const { user } = useAuth()
  const [placements, setPlacements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMyPlacements()
  }, [])

  const fetchMyPlacements = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await placementsAPI.getMyPlacements()
      setPlacements(response.placements || response || [])
    } catch (err) {
      console.error('Error fetching placements:', err)
      setError('Failed to load placements. Please try again.')
      toast.error('Failed to load placements')
    } finally {
      setLoading(false)
    }
  }


  const getPlacementStats = () => {
    const stats = {
      total: placements.length,
      placed: 0,
      offered: 0,
      accepted: 0,
      rejected: 0
    }

    placements.forEach(placement => {
      const status = placement.status?.toLowerCase() || 'pending'
      if (status === 'placed' || status === 'confirmed') {
        stats.placed++
      } else if (status === 'offered') {
        stats.offered++
      } else if (status === 'accepted') {
        stats.accepted++
      } else if (status === 'rejected' || status === 'declined') {
        stats.rejected++
      }
    })

    return stats
  }

  const stats = getPlacementStats()

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading placements...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with role banner */}
      <div className="mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold text-green-800">
            Welcome, {user?.email}
          </h2>
          <p className="text-green-600">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </span>
            View your placement status and offers
          </p>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Placements</h1>
          <p className="text-gray-600 mt-2">Track your placement status and job offers</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {placements.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.placed}</div>
              <div className="text-sm text-gray-600">Placed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.accepted}</div>
              <div className="text-sm text-gray-600">Accepted</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.offered}</div>
              <div className="text-sm text-gray-600">Offered</div>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={fetchMyPlacements} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {placements.length === 0 && !loading && !error ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No placements yet</h3>
            <p className="text-gray-500 mb-4">Your placement opportunities will appear here once you start getting offers</p>
            <Button onClick={() => window.location.href = '/student/jobs'}>
              Browse Jobs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {placements.map((placement) => (
            <Card key={placement.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-xl text-gray-900">
                        {placement.company_name || 'Company Name'}
                      </CardTitle>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(placement.status)}`}>
                        {getStatusIcon(placement.status)} {formatStatus(placement.status)}
                      </span>
                    </div>
                    <p className="text-gray-600">
                      {placement.role || placement.job_title || 'Position'}
                    </p>
                    {placement.job_type && (
                      <p className="text-sm text-gray-500 mt-1">📋 {placement.job_type}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600 mb-2">
                      {formatSalary(placement.package || placement.salary)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {placement.created_at ? `Placed: ${formatDate(placement.created_at)}` : ''}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Placement Details</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Status:</span> {formatStatus(placement.status)}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Package:</span> {formatSalary(placement.package)}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Role:</span> {placement.role}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Placed On:</span> {formatDate(placement.created_at)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Company & Job Info</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Company:</span> {placement.company_name}
                    </p>
                    {placement.company_website && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Website:</span> 
                        <a href={placement.company_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                          {placement.company_website}
                        </a>
                      </p>
                    )}
                    {placement.job_type && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Job Type:</span> {placement.job_type}
                      </p>
                    )}
                  </div>
                </div>

                {placement.job_description && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Job Description</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      {placement.job_description}
                    </p>
                  </div>
                )}

                {placement.job_eligibility && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Eligibility Requirements</h4>
                    <p className="text-sm text-gray-600">
                      {placement.job_eligibility}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Placement ID: {placement.id}
                  </div>
                  <div className="flex items-center space-x-2">
                    {(placement.status?.toLowerCase() === 'placed' || placement.status?.toLowerCase() === 'joined') && (
                      <span className="text-sm text-green-600 font-medium">
                        🎉 Congratulations on your placement!
                      </span>
                    )}
                    {placement.status?.toLowerCase() === 'offered' && (
                      <span className="text-sm text-yellow-600 font-medium">
                        📋 You have a job offer!
                      </span>
                    )}
                    {(placement.status?.toLowerCase() === 'confirmed' || placement.status?.toLowerCase() === 'accepted') && (
                      <span className="text-sm text-green-600 font-medium">
                        ✅ Placement confirmed!
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyPlacements
