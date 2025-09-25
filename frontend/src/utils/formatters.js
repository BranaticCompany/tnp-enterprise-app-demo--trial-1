/**
 * Utility functions for formatting data consistently across the application
 */

/**
 * Format salary amount to Indian currency format
 * @param {number|string} salary - The salary amount
 * @returns {string} Formatted salary (e.g., "₹8,00,000")
 */
export const formatSalary = (salary) => {
  if (!salary || salary === 0) return 'Not specified'
  
  const amount = typeof salary === 'string' ? parseFloat(salary) : salary
  if (isNaN(amount)) return 'Not specified'
  
  return new Intl.NumberFormat("en-IN", { 
    style: "currency", 
    currency: "INR", 
    maximumFractionDigits: 0 
  }).format(amount)
}

/**
 * Format date to localized string
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

/**
 * Capitalize and format status for user display
 * @param {string} status - The status string
 * @returns {string} Formatted status (e.g., "Pending", "Accepted")
 */
export const formatStatus = (status) => {
  if (!status) return 'Pending'
  
  // Handle common status mappings
  const statusMap = {
    'applied': 'Pending',
    'pending': 'Pending',
    'reviewed': 'Reviewing',
    'reviewing': 'Reviewing',
    'shortlisted': 'Shortlisted',
    'accepted': 'Accepted',
    'approved': 'Accepted',
    'rejected': 'Rejected',
    'declined': 'Rejected',
    'hired': 'Hired',
    'placed': 'Placed',
    'offered': 'Offered',
    'joined': 'Joined',
    'confirmed': 'Confirmed'
  }
  
  const normalizedStatus = status.toLowerCase()
  return statusMap[normalizedStatus] || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

/**
 * Get status color class for badges
 * @param {string} status - The status string
 * @returns {string} Tailwind CSS classes for status badge
 */
export const getStatusColor = (status) => {
  const formattedStatus = formatStatus(status).toLowerCase()
  
  switch (formattedStatus) {
    case 'accepted':
    case 'hired':
    case 'placed':
    case 'joined':
    case 'confirmed':
      return 'bg-green-100 text-green-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'reviewing':
    case 'shortlisted':
      return 'bg-blue-100 text-blue-800'
    case 'offered':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Get status icon for display
 * @param {string} status - The status string
 * @returns {string} Emoji icon for status
 */
export const getStatusIcon = (status) => {
  const formattedStatus = formatStatus(status).toLowerCase()
  
  switch (formattedStatus) {
    case 'accepted':
    case 'hired':
    case 'placed':
    case 'confirmed':
      return '✅'
    case 'rejected':
      return '❌'
    case 'pending':
      return '⏳'
    case 'reviewing':
    case 'shortlisted':
      return '👀'
    case 'offered':
      return '📋'
    case 'joined':
      return '🎉'
    default:
      return '📄'
  }
}
