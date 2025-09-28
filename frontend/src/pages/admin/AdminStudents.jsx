import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { adminAPI, resumeAPI } from '../../api/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import toast from 'react-hot-toast'

const AdminStudents = () => {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all, placed, not_placed
  const [resumeAvailability, setResumeAvailability] = useState({})

  const loadStudents = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Loading students...')
      const response = await adminAPI.getAllStudents()
      console.log('Students response:', response)
      const studentsData = response.students || []
      setStudents(studentsData)

      // Check resume availability for each student
      const resumeChecks = {}
      for (const student of studentsData) {
        if (student.id) {
          try {
            const resumeResponse = await resumeAPI.getResumeInfo(student.id)
            resumeChecks[student.id] = resumeResponse.success && resumeResponse.data.hasResume
          } catch (error) {
            console.error(`Error checking resume for student ${student.id}:`, error)
            resumeChecks[student.id] = false
          }
        }
      }
      setResumeAvailability(resumeChecks)
    } catch (error) {
      console.error('Failed to load students:', error)
      setError(error.response?.data?.message || 'Failed to load students')
    }
    setLoading(false)
  }

  const handleViewResume = async (studentId, studentName) => {
    try {
      console.log('Attempting to view resume for student:', studentId, studentName)
      const response = await resumeAPI.getResume(studentId)
      
      // Create blob URL and open in new tab
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      
      // Clean up the URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch (error) {
      console.error('Error viewing resume:', error)
      if (error.response?.status === 404) {
        toast.error(`${studentName} has not uploaded a resume yet`)
      } else {
        toast.error('Failed to open resume')
      }
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  // Filter students based on selected filter
  const filteredStudents = students.filter(student => {
    if (filter === 'all') return true
    if (filter === 'placed') return student.placed
    if (filter === 'not_placed') return !student.placed
    return true
  })

  // Get statistics
  const stats = {
    total: students.length,
    placed: students.filter(s => s.placed).length,
    notPlaced: students.filter(s => !s.placed).length,
    totalApplications: students.reduce((sum, s) => sum + s.total_applications, 0),
    totalInterviews: students.reduce((sum, s) => sum + s.total_interviews, 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatSalary = (amount) => {
    if (!amount) return 'N/A'
    return `₹${(amount / 100000).toFixed(1)}L`
  }

  const getPlacedBadge = (placed, placementDetails) => {
    if (placed && placementDetails) {
      return (
        <div className="space-y-1">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Placed
          </span>
          <div className="text-xs text-gray-600">
            {placementDetails.company_name}
          </div>
          <div className="text-xs text-gray-500">
            {formatSalary(placementDetails.package)}
          </div>
        </div>
      )
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Not Placed
        </span>
      )
    }
  }

  const getBranchBadge = (branch) => {
    if (!branch) return 'N/A'
    const colors = {
      'Computer Science': 'bg-blue-100 text-blue-800',
      'Electronics': 'bg-purple-100 text-purple-800',
      'Mechanical': 'bg-orange-100 text-orange-800',
      'Civil': 'bg-gray-100 text-gray-800',
      'Information Technology': 'bg-indigo-100 text-indigo-800'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[branch] || 'bg-gray-100 text-gray-800'}`}>
        {branch}
      </span>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-red-900">
              Student Management
            </h1>
            <p className="text-red-700 mt-1">
              Welcome back, {user?.email}
            </p>
            <p className="text-red-600 text-sm mt-1">
              Manage all students in the TnP system
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              Administrator
            </span>
            <Button onClick={loadStudents} disabled={loading} variant="outline">
              {loading ? 'Loading...' : 'Refresh Data'}
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Placed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.placed}</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Not Placed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.notPlaced}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalApplications}</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalInterviews}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All ({stats.total})
          </Button>
          <Button
            variant={filter === 'placed' ? 'default' : 'outline'}
            onClick={() => setFilter('placed')}
            size="sm"
          >
            Placed ({stats.placed})
          </Button>
          <Button
            variant={filter === 'not_placed' ? 'default' : 'outline'}
            onClick={() => setFilter('not_placed')}
            size="sm"
          >
            Not Placed ({stats.notPlaced})
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading students...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <Button onClick={loadStudents} className="mt-2" size="sm">
            Retry
          </Button>
        </div>
      )}

      {/* Students Table */}
      {!loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Students ({filteredStudents.length})</CardTitle>
            <CardDescription>
              {filter === 'all' ? 'All students in the system' : `Filtered by: ${filter.replace('_', ' ')}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No students found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Branch</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Year</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Phone</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Applications</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Interviews</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Placement Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Joined</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">
                            {student.name || 'N/A'}
                          </div>
                          {student.phone && (
                            <div className="text-xs text-gray-500">{student.phone}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-600">{student.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          {getBranchBadge(student.branch)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-600">
                            {student.year_of_study ? `Year ${student.year_of_study}` : 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-600 text-sm">
                            {student.phone || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-center">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {student.total_applications}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-center">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {student.total_interviews}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getPlacedBadge(student.placed, student.placement_details)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-600 text-sm">
                            {formatDate(student.created_at)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => {
                                // Could show detailed student profile
                                console.log('View student profile:', student.id)
                              }}
                            >
                              View Profile
                            </Button>
                            {resumeAvailability[student.id] ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs text-blue-600 hover:text-blue-800"
                                onClick={() => handleViewResume(student.id, student.name)}
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Resume
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled
                                className="text-xs text-gray-400 cursor-not-allowed"
                                title="No resume available"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                No Resume
                              </Button>
                            )}
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
    </div>
  )
}

export default AdminStudents
