import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { applicationsAPI, jobsAPI } from '../../api/auth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { formatDate, formatStatus, getStatusColor } from '../../utils/formatters'

const ApplicationsList = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const jobId = searchParams.get('jobId')
  
  const [applications, setApplications] = useState([])
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(jobId || '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    if (selectedJob) {
      fetchApplications(selectedJob)
    } else {
      setApplications([])
      setLoading(false)
    }
  }, [selectedJob])

  const fetchJobs = async () => {
    try {
      const response = await jobsAPI.getAllJobs()
      const jobsList = response.jobs || response || []
      setJobs(jobsList)
      
      if (jobId && jobsList.find(job => job.id === jobId)) {
        setSelectedJob(jobId)
      }
    } catch (err) {
      console.error('Error fetching jobs:', err)
      toast.error('Failed to load jobs')
    }
  }

  const fetchApplications = async (jobId) => {
    try {
      setLoading(true)
      setError(null)
      const response = await applicationsAPI.getAllApplications(jobId)
      setApplications(response.applications || response || [])
    } catch (err) {
      console.error('Error fetching applications:', err)
      setError('Failed to load applications. Please try again.')
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const handleJobChange = (e) => {
    setSelectedJob(e.target.value)
  }

  const handleUpdateApplicationStatus = async (applicationId, newStatus) => {
    try {
      await applicationsAPI.updateApplication(applicationId, { status: newStatus })
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ))
      toast.success(`Application ${newStatus}`)
    } catch (err) {
      console.error('Error updating application:', err)
      toast.error('Failed to update application status')
    }
  }


  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with role banner */}
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold text-blue-800">
            Welcome, {user?.email}
          </h2>
          <p className="text-blue-600">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </span>
            Review and manage job applications
          </p>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Applications Management</h1>
          <p className="text-gray-600 mt-2">Review applications for your job postings</p>
        </div>
      </div>

      {/* Job Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Job</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <label htmlFor="jobSelect" className="text-sm font-medium text-gray-700">
              Choose a job to view applications:
            </label>
            <select
              id="jobSelect"
              value={selectedJob}
              onChange={handleJobChange}
              className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a job...</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} - {job.company || 'Your Company'}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={() => fetchApplications(selectedJob)} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {loading && selectedJob && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading applications...</div>
        </div>
      )}

      {!selectedJob && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a job to view applications</h3>
            <p className="text-gray-500">Choose a job from the dropdown above to see its applications</p>
          </CardContent>
        </Card>
      )}

      {selectedJob && !loading && applications.length === 0 && !error && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-500">This job hasn't received any applications yet</p>
          </CardContent>
        </Card>
      )}

      {selectedJob && !loading && applications.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Applications ({applications.length})
            </h2>
            <div className="text-sm text-gray-500">
              Job: {jobs.find(job => job.id === selectedJob)?.title}
            </div>
          </div>

          {applications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {application.studentName || application.student?.name || application.student?.email || 'Student'}
                    </CardTitle>
                    <p className="text-gray-600 mt-1">
                      {application.student?.email || application.email || 'No email provided'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {formatStatus(application.status)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Application Details</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Applied:</span> {formatDate(application.createdAt)}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Status:</span> {formatStatus(application.status)}
                    </p>
                    {application.student?.phone && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Phone:</span> {application.student.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Student Info</h4>
                    {application.student?.course && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Course:</span> {application.student.course}
                      </p>
                    )}
                    {application.student?.year && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Year:</span> {application.student.year}
                      </p>
                    )}
                    {application.student?.cgpa && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">CGPA:</span> {application.student.cgpa}
                      </p>
                    )}
                  </div>
                </div>

                {application.coverLetter && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Cover Letter</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      {application.coverLetter}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Application ID: {application.id}
                  </div>
                  <div className="flex space-x-2">
                    {application.status !== 'accepted' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateApplicationStatus(application.id, 'accepted')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Accept
                      </Button>
                    )}
                    {application.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateApplicationStatus(application.id, 'rejected')}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                    )}
                    {application.status !== 'reviewing' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateApplicationStatus(application.id, 'reviewing')}
                      >
                        Mark as Reviewing
                      </Button>
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

export default ApplicationsList
