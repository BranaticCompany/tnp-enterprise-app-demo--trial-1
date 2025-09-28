import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileAPI, resumeAPI } from '../api/auth';
import toast from 'react-hot-toast';

const StudentProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    branch: '',
    year_of_study: '',
    cgpa: '',
    resume_url: '',
    skills: []
  });

  // Skills suggestions (similar to job posting)
  const skillSuggestions = [
    'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'Angular', 'Vue.js',
    'HTML', 'CSS', 'TypeScript', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift',
    'Machine Learning', 'Data Science', 'AI', 'Deep Learning', 'TensorFlow', 'PyTorch',
    'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase',
    'AWS', 'Azure', 'Docker', 'Kubernetes', 'Jenkins', 'Git',
    'REST APIs', 'GraphQL', 'Microservices', 'System Design', 'Algorithms',
    'Data Structures', 'Problem Solving', 'Communication', 'Leadership', 'Teamwork'
  ];

  const [skillInput, setSkillInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  // Resume upload state
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeInfo, setResumeInfo] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeDeleting, setResumeDeleting] = useState(false);

  const branches = [
    'Computer Science',
    'Information Technology', 
    'Electronics and Communication',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Biotechnology',
    'Aerospace Engineering',
    'Other'
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.getMyProfile();
      if (response.profile) {
        setProfile({
          full_name: response.profile.full_name || '',
          phone: response.profile.phone || '',
          branch: response.profile.branch || '',
          year_of_study: response.profile.year_of_study || '',
          cgpa: response.profile.cgpa || '',
          resume_url: response.profile.resume_url || '',
          skills: response.profile.skills || []
        });

        // Fetch resume info if user has resume_url
        if (response.profile.resume_url) {
          await fetchResumeInfo();
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const fetchResumeInfo = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.id) {
        const response = await resumeAPI.getResumeInfo(user.id);
        if (response.success && response.data.hasResume) {
          setResumeInfo(response.data);
        }
      }
    } catch (error) {
      console.error('Error fetching resume info:', error);
    }
  };

  const handleResumeFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        e.target.value = '';
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        e.target.value = '';
        return;
      }

      setResumeFile(file);
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) {
      toast.error('Please select a PDF file to upload');
      return;
    }

    try {
      setResumeUploading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      
      const response = await resumeAPI.uploadResume(user.id, resumeFile);
      
      if (response.success) {
        toast.success('Resume uploaded successfully!');
        setResumeFile(null);
        // Clear file input
        const fileInput = document.getElementById('resume-upload');
        if (fileInput) fileInput.value = '';
        
        // Refresh profile and resume info
        await fetchProfile();
        await fetchResumeInfo();
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to upload resume');
      }
    } finally {
      setResumeUploading(false);
    }
  };

  const handleResumeDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your resume? This action cannot be undone.')) {
      return;
    }

    try {
      setResumeDeleting(true);
      const user = JSON.parse(localStorage.getItem('user'));
      
      const response = await resumeAPI.deleteResume(user.id);
      
      if (response.success) {
        toast.success('Resume deleted successfully');
        setResumeInfo(null);
        setProfile(prev => ({ ...prev, resume_url: '' }));
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to delete resume');
      }
    } finally {
      setResumeDeleting(false);
    }
  };

  const handleResumeView = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await resumeAPI.getResume(user.id);
      
      // Create blob URL and open in new tab
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Clean up the URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error viewing resume:', error);
      toast.error('Failed to open resume');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillInputChange = (e) => {
    const value = e.target.value;
    setSkillInput(value);
    
    if (value.trim()) {
      const filtered = skillSuggestions.filter(skill => 
        skill.toLowerCase().includes(value.toLowerCase()) &&
        !profile.skills.includes(skill)
      ).slice(0, 8);
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const addSkill = (skill) => {
    if (skill && !profile.skills.includes(skill)) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
      setSkillInput('');
      setShowSuggestions(false);
    }
  };

  const removeSkill = (skillToRemove) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSkillKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const skill = skillInput.trim();
      if (skill) {
        addSkill(skill);
      }
    }
  };

  const calculateProfileCompletion = () => {
    const fields = ['full_name', 'phone', 'branch', 'year_of_study', 'cgpa'];
    const filledFields = fields.filter(field => profile[field] && profile[field].toString().trim());
    const skillsBonus = profile.skills.length > 0 ? 1 : 0;
    const resumeBonus = resumeInfo?.hasResume ? 1 : 0;
    return Math.round(((filledFields.length + skillsBonus + resumeBonus) / (fields.length + 2)) * 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!profile.full_name.trim()) {
      toast.error('Full name is required');
      return;
    }

    if (profile.cgpa && (profile.cgpa < 0 || profile.cgpa > 10)) {
      toast.error('CGPA must be between 0.0 and 10.0');
      return;
    }

    if (profile.year_of_study && (profile.year_of_study < 1 || profile.year_of_study > 5)) {
      toast.error('Year of study must be between 1 and 5');
      return;
    }

    try {
      setSaving(true);
      
      // Prepare data for API
      const profileData = {
        ...profile,
        cgpa: profile.cgpa ? parseFloat(profile.cgpa) : null,
        year_of_study: profile.year_of_study ? parseInt(profile.year_of_study) : null,
        skills: profile.skills || []
      };

      const response = await profileAPI.updateProfile(profileData);
      
      if (response.message) {
        toast.success('Profile updated successfully!');
        // Navigate back to dashboard after a short delay
        setTimeout(() => {
          navigate('/student/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response?.data?.details) {
        error.response.data.details.forEach(detail => toast.error(detail));
      } else {
        toast.error(error.response?.data?.error || 'Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const completionPercentage = calculateProfileCompletion();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Update Profile</h1>
              <p className="text-gray-600 mt-1">Keep your profile information up to date</p>
            </div>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
          
          {/* Profile Completion */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Profile Completion</span>
              <span className="font-medium text-green-600">{completionPercentage}%</span>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch
                </label>
                <select
                  name="branch"
                  value={profile.branch}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select your branch</option>
                  {branches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year of Study
                </label>
                <select
                  name="year_of_study"
                  value={profile.year_of_study}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CGPA
                </label>
                <input
                  type="number"
                  name="cgpa"
                  value={profile.cgpa}
                  onChange={handleInputChange}
                  min="0"
                  max="10"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your CGPA (0.0 - 10.0)"
                />
              </div>

              {/* Resume Upload Section */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resume Upload
                </label>
                
                {/* Current Resume Status */}
                {resumeInfo?.hasResume ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Resume uploaded successfully
                          </p>
                          <p className="text-xs text-green-600">
                            {resumeInfo.fileInfo?.filename} • 
                            Last updated: {new Date(resumeInfo.lastUpdated).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={handleResumeView}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          View Resume
                        </button>
                        <button
                          type="button"
                          onClick={handleResumeDelete}
                          disabled={resumeDeleting}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {resumeDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
                    <div className="text-center">
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm text-gray-600">No resume uploaded</p>
                      <p className="text-xs text-gray-500">Upload a PDF resume to improve your profile</p>
                    </div>
                  </div>
                )}

                {/* Upload New Resume */}
                <div className="space-y-4">
                  <div>
                    <input
                      type="file"
                      id="resume-upload"
                      accept=".pdf"
                      onChange={handleResumeFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Only PDF files are allowed. Maximum file size: 5MB
                    </p>
                  </div>

                  {resumeFile && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-blue-800">{resumeFile.name}</p>
                            <p className="text-xs text-blue-600">
                              {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleResumeUpload}
                          disabled={resumeUploading}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {resumeUploading ? 'Uploading...' : 'Upload'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Skills
              </label>
              <input
                type="text"
                value={skillInput}
                onChange={handleSkillInputChange}
                onKeyPress={handleSkillKeyPress}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Type a skill and press Enter (e.g., JavaScript, Python, React)"
              />
              
              {/* Skills Suggestions */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredSuggestions.map((skill, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => addSkill(skill)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Current Skills */}
            {profile.skills.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Current Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 text-green-600 hover:text-green-800 focus:outline-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentProfile;
