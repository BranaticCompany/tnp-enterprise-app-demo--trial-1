import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { jobsAPI } from '../../api/auth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const PostJob = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    salary: '',
    deadline: '',
    requirements: '',
    location: '',
    jobType: 'Full Time',
    company_name: '',
    cgpa_criteria: '',
    skills: []
  })

  // Skills suggestions
  const skillsSuggestions = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue.js',
    'Django', 'Flask', 'Spring Boot', 'Express.js', 'MongoDB', 'PostgreSQL',
    'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
    'Git', 'HTML', 'CSS', 'TypeScript', 'PHP', 'C++', 'C#', '.NET',
    'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Flutter', 'React Native',
    'Machine Learning', 'Data Science', 'AI', 'Deep Learning', 'TensorFlow',
    'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn', 'SQL', 'NoSQL',
    'REST API', 'GraphQL', 'Microservices', 'DevOps', 'CI/CD', 'Jenkins',
    'Terraform', 'Ansible', 'Linux', 'Windows', 'MacOS', 'Agile', 'Scrum',
    'Project Management', 'Communication', 'Problem Solving', 'Leadership',
    'Teamwork', 'Critical Thinking', 'MS Excel', 'PowerBI', 'Tableau'
  ]

  const [skillInput, setSkillInput] = useState('')
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false)

  // No need to load companies since we're using text input

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSkillInputChange = (e) => {
    const value = e.target.value
    setSkillInput(value)
    setShowSkillSuggestions(value.length > 0)
  }

  const addSkill = (skill) => {
    const trimmedSkill = skill.trim()
    if (trimmedSkill && !formData.skills.includes(trimmedSkill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, trimmedSkill]
      }))
    }
    setSkillInput('')
    setShowSkillSuggestions(false)
  }

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const handleSkillKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (skillInput.trim()) {
        addSkill(skillInput)
      }
    }
  }

  const getFilteredSuggestions = () => {
    if (!skillInput) return []
    return skillsSuggestions.filter(skill => 
      skill.toLowerCase().includes(skillInput.toLowerCase()) &&
      !formData.skills.includes(skill)
    ).slice(0, 8) // Limit to 8 suggestions
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Comprehensive validation
    if (!formData.title?.trim()) {
      toast.error('Job title is required')
      return
    }

    if (!formData.description?.trim()) {
      toast.error('Job description is required')
      return
    }

    if (!formData.company_name?.trim()) {
      toast.error('Company name is required')
      return
    }

    if (!formData.deadline) {
      toast.error('Application deadline is required')
      return
    }

    if (!formData.cgpa_criteria || formData.cgpa_criteria === '') {
      toast.error('CGPA criteria is required')
      return
    }

    // Validate CGPA criteria
    const cgpa = parseFloat(formData.cgpa_criteria)
    if (isNaN(cgpa) || cgpa < 0.0 || cgpa > 10.0) {
      toast.error('CGPA criteria must be a number between 0.0 and 10.0')
      return
    }

    // Validate deadline is in the future
    const deadlineDate = new Date(formData.deadline)
    const now = new Date()
    if (deadlineDate <= now) {
      toast.error('Application deadline must be in the future')
      return
    }

    try {
      setLoading(true)

      // Prepare skills array - ensure it's always a valid array
      let skillsArray = [];
      if (formData.skills && Array.isArray(formData.skills)) {
        skillsArray = formData.skills.filter(skill => skill && skill.trim().length > 0);
      }

      // Prepare payload with correct field mapping for backend
      const jobData = {
        company_name: formData.company_name.trim(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        eligibility: formData.requirements?.trim() || null, // Map requirements to eligibility
        application_deadline: formData.deadline, // Map deadline to application_deadline
        package: formData.salary ? parseInt(formData.salary, 10) : null, // Map salary to package as integer
        type: formData.jobType, // Map jobType to type
        location: formData.location?.trim() || null,
        cgpa_criteria: parseFloat(formData.cgpa_criteria),
        skills: skillsArray // Send skills array (always a valid array)
      }

      console.log('=== FRONTEND JOB POSTING DEBUG ===');
      console.log('Form skills:', formData.skills);
      console.log('Processed skills array:', skillsArray);
      console.log('Sending job data:', JSON.stringify(jobData, null, 2));

      const response = await jobsAPI.createJob(jobData)
      toast.success('Job posted successfully!')
      navigate('/recruiter/jobs')
    } catch (err) {
      console.error('Error posting job:', err)

      // Enhanced error handling with specific backend messages
      if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
        // Show validation errors from backend
        const errorMessages = err.response.data.details.join(', ')
        toast.error(`Validation failed: ${errorMessages}`)
      } else if (err.response?.data?.error) {
        // Show specific backend error
        toast.error(err.response.data.error)
      } else if (err.response?.data?.message) {
        // Show backend message
        toast.error(err.response.data.message)
      } else {
        // Fallback generic error
        toast.error('Failed to post job. Please check all fields and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/recruiter/jobs')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
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
            Create a new job posting
          </p>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Post New Job</h1>
          <p className="text-gray-600 mt-2">Fill in the details to create a new job posting</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Software Engineer"
                  required
                />
              </div>

              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <Input
                  id="company_name"
                  name="company_name"
                  type="text"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  placeholder="e.g. TechCorp Solutions"
                  required
                />
              </div>

              <div>
                <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <select
                  id="jobType"
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div>
                <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-2">
                  Salary (₹ per annum)
                </label>
                <Input
                  id="salary"
                  name="salary"
                  type="number"
                  value={formData.salary}
                  onChange={handleInputChange}
                  placeholder="e.g. 600000"
                  min="0"
                />
              </div>

              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                  Application Deadline *
                </label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]} // Prevent past dates
                />
              </div>

              <div>
                <label htmlFor="cgpa_criteria" className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum CGPA Criteria *
                </label>
                <Input
                  id="cgpa_criteria"
                  name="cgpa_criteria"
                  type="number"
                  value={formData.cgpa_criteria}
                  onChange={handleInputChange}
                  placeholder="e.g. 7.5"
                  min="0"
                  max="10"
                  step="0.1"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <Input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. Bangalore, India"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Job Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the role, responsibilities, and what you're looking for..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
                Eligibility Criteria & Requirements
              </label>
              <textarea
                id="requirements"
                name="requirements"
                rows={4}
                value={formData.requirements}
                onChange={handleInputChange}
                placeholder="e.g. Final year students with CGPA > 7.0, Computer Science/IT background, knowledge of programming languages..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Skills Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Skills
              </label>
              <div className="space-y-3">
                {/* Skills Input */}
                <div className="relative">
                  <Input
                    type="text"
                    value={skillInput}
                    onChange={handleSkillInputChange}
                    onKeyPress={handleSkillKeyPress}
                    placeholder="Type to search skills or add custom skills (press Enter to add)"
                    className="w-full"
                    onFocus={() => setShowSkillSuggestions(skillInput.length > 0)}
                  />
                  
                  {/* Skills Suggestions Dropdown */}
                  {showSkillSuggestions && getFilteredSuggestions().length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {getFilteredSuggestions().map((skill, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                          onClick={() => addSkill(skill)}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Skills Display */}
                {formData.skills.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Selected Skills ({formData.skills.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Add skills that candidates should have for this position. You can select from suggestions or add custom skills.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Posting...' : 'Post Job'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default PostJob
