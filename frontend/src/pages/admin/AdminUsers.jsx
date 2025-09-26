import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { adminAPI } from '../../api/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { useNavigate } from 'react-router-dom'

const AdminUsers = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all, students, recruiters, admins

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Loading users...')
      const response = await adminAPI.getAllUsers()
      console.log('Users response:', response)
      setUsers(response.users || [])
    } catch (error) {
      console.error('Failed to load users:', error)
      setError(error.response?.data?.message || 'Failed to load users')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Filter users based on selected filter
  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true
    if (filter === 'students') return user.role === 'student'
    if (filter === 'recruiters') return user.role === 'recruiter'
    if (filter === 'admins') return user.role === 'admin'
    return true
  })

  // Get statistics
  const stats = {
    total: users.length,
    students: users.filter(u => u.role === 'student').length,
    recruiters: users.filter(u => u.role === 'recruiter').length,
    admins: users.filter(u => u.role === 'admin').length,
    placed: users.filter(u => u.role === 'student' && u.placed).length
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'recruiter': return 'bg-blue-100 text-blue-800'
      case 'student': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlacedBadge = (placed) => {
    if (placed === null) return null
    return placed ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Placed
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Not Placed
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
              User Management
            </h1>
            <p className="text-red-700 mt-1">
              Welcome back, {user?.email}
            </p>
            <p className="text-red-600 text-sm mt-1">
              Manage all users in the TnP system
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              Administrator
            </span>
            <Button onClick={loadUsers} disabled={loading} variant="outline">
              {loading ? 'Loading...' : 'Refresh Data'}
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.students}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Recruiters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.recruiters}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Placed Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.placed}</div>
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
            variant={filter === 'students' ? 'default' : 'outline'}
            onClick={() => setFilter('students')}
            size="sm"
          >
            Students ({stats.students})
          </Button>
          <Button
            variant={filter === 'recruiters' ? 'default' : 'outline'}
            onClick={() => setFilter('recruiters')}
            size="sm"
          >
            Recruiters ({stats.recruiters})
          </Button>
          <Button
            variant={filter === 'admins' ? 'default' : 'outline'}
            onClick={() => setFilter('admins')}
            size="sm"
          >
            Admins ({stats.admins})
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading users...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <Button onClick={loadUsers} className="mt-2" size="sm">
            Retry
          </Button>
        </div>
      )}

      {/* Users Table */}
      {!loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            <CardDescription>
              {filter === 'all' ? 'All users in the system' : `Filtered by: ${filter}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Branch</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Year</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Placed Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Joined</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">
                            {user.name || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-600">{user.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-600">
                            {user.role === 'student' ? (user.branch || 'N/A') : '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-600">
                            {user.role === 'student' ? (user.year_of_study ? `Year ${user.year_of_study}` : 'N/A') : '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getPlacedBadge(user.placed)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-600 text-sm">
                            {formatDate(user.created_at)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            {user.role === 'student' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate('/admin/students')}
                                className="text-xs"
                              >
                                View Details
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-gray-500 hover:text-gray-700"
                              onClick={() => {
                                // Could add edit user functionality here
                                console.log('Edit user:', user.id)
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
    </div>
  )
}

export default AdminUsers
