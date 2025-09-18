describe('TnP Portal - Role-Based Dashboard E2E Tests', () => {
  beforeEach(() => {
    // Mock API responses for all tests
    cy.mockApiResponses()
  })

  describe('Admin Login and Dashboard', () => {
    it('admin login shows admin dashboard with reports', () => {
      // Mock successful login response for admin
      cy.intercept('POST', '/api/v1/auth/login', {
        statusCode: 200,
        body: {
          access_token: 'mock-admin-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: 1,
            email: 'admin@test.com',
            role: 'admin'
          }
        }
      }).as('adminLogin')

      // Visit login page
      cy.visit('/login')

      // Fill login form
      cy.get('input[type="email"]').type('admin@test.com')
      cy.get('input[type="password"]').type('password123')
      cy.get('button[type="submit"]').click()

      // Wait for login API call
      cy.wait('@adminLogin')

      // Should redirect to admin dashboard
      cy.url().should('include', '/admin/dashboard')

      // Check admin dashboard elements
      cy.checkDashboardElements('admin')

      // Verify admin sees Reports
      cy.get('[data-cy="reports-section"]').should('be.visible')
      cy.contains('Total Students').should('be.visible')
      cy.contains('Total Applications').should('be.visible')

      // Check navigation has admin items
      cy.contains('Users').should('be.visible')
      cy.contains('Companies').should('be.visible')
      cy.contains('Reports').should('be.visible')
    })

    it('admin can navigate to different admin sections', () => {
      // Mock login and set localStorage
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'mock-admin-token')
        win.localStorage.setItem('user', JSON.stringify({
          id: 1,
          email: 'admin@test.com',
          role: 'admin'
        }))
      })

      cy.visit('/admin/dashboard')

      // Navigate to Users section
      cy.contains('Users').click()
      cy.url().should('include', '/admin/users')
      cy.contains('User Management').should('be.visible')

      // Navigate to Companies section
      cy.contains('Companies').click()
      cy.url().should('include', '/admin/companies')
      cy.contains('Company Management').should('be.visible')
    })
  })

  describe('Recruiter Login and Dashboard', () => {
    it('recruiter login shows recruiter dashboard with jobs and interviews', () => {
      // Mock successful login response for recruiter
      cy.intercept('POST', '/api/v1/auth/login', {
        statusCode: 200,
        body: {
          access_token: 'mock-recruiter-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: 2,
            email: 'recruiter@test.com',
            role: 'recruiter'
          }
        }
      }).as('recruiterLogin')

      cy.visit('/login')

      cy.get('input[type="email"]').type('recruiter@test.com')
      cy.get('input[type="password"]').type('password123')
      cy.get('button[type="submit"]').click()

      cy.wait('@recruiterLogin')

      // Should redirect to recruiter dashboard
      cy.url().should('include', '/recruiter/dashboard')

      // Check recruiter dashboard elements
      cy.checkDashboardElements('recruiter')

      // Verify recruiter sees Jobs and Interviews
      cy.contains('Active Jobs').should('be.visible')
      cy.contains('Applications Received').should('be.visible')
      cy.contains('Interviews Scheduled').should('be.visible')

      // Check navigation has recruiter items
      cy.contains('Jobs').should('be.visible')
      cy.contains('Applications').should('be.visible')
      cy.contains('Interviews').should('be.visible')

      // Should not see admin items
      cy.contains('Users').should('not.exist')
      cy.contains('Companies').should('not.exist')
    })

    it('recruiter can navigate to jobs and interviews sections', () => {
      // Mock login and set localStorage
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'mock-recruiter-token')
        win.localStorage.setItem('user', JSON.stringify({
          id: 2,
          email: 'recruiter@test.com',
          role: 'recruiter'
        }))
      })

      cy.visit('/recruiter/dashboard')

      // Navigate to Jobs section
      cy.contains('Jobs').click()
      cy.url().should('include', '/recruiter/jobs')
      cy.contains('Job Management').should('be.visible')

      // Navigate to Interviews section
      cy.contains('Interviews').click()
      cy.url().should('include', '/recruiter/interviews')
      cy.contains('Interviews').should('be.visible')
    })
  })

  describe('Student Login and Dashboard', () => {
    it('student login shows student dashboard with applications', () => {
      // Mock successful login response for student
      cy.intercept('POST', '/api/v1/auth/login', {
        statusCode: 200,
        body: {
          access_token: 'mock-student-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: 3,
            email: 'student@test.com',
            role: 'student'
          }
        }
      }).as('studentLogin')

      cy.visit('/login')

      cy.get('input[type="email"]').type('student@test.com')
      cy.get('input[type="password"]').type('password123')
      cy.get('button[type="submit"]').click()

      cy.wait('@studentLogin')

      // Should redirect to student dashboard
      cy.url().should('include', '/student/dashboard')

      // Check student dashboard elements
      cy.checkDashboardElements('student')

      // Verify student sees Applications
      cy.contains('Applications').should('be.visible')
      cy.contains('Interviews').should('be.visible')
      cy.contains('Placements').should('be.visible')

      // Check navigation has student items
      cy.contains('My Applications').should('be.visible')
      cy.contains('My Interviews').should('be.visible')

      // Should not see admin or recruiter items
      cy.contains('Users').should('not.exist')
      cy.contains('Companies').should('not.exist')
      cy.contains('Reports').should('not.exist')
    })

    it('student can navigate to applications and interviews sections', () => {
      // Mock login and set localStorage
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'mock-student-token')
        win.localStorage.setItem('user', JSON.stringify({
          id: 3,
          email: 'student@test.com',
          role: 'student'
        }))
      })

      cy.visit('/student/dashboard')

      // Navigate to Applications section
      cy.contains('My Applications').click()
      cy.url().should('include', '/student/applications')
      cy.contains('My Applications').should('be.visible')

      // Navigate to Interviews section
      cy.contains('My Interviews').click()
      cy.url().should('include', '/student/interviews')
      cy.contains('My Interviews').should('be.visible')
    })
  })

  describe('Access Control Tests', () => {
    it('student cannot access admin routes', () => {
      // Set student credentials
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'mock-student-token')
        win.localStorage.setItem('user', JSON.stringify({
          id: 3,
          email: 'student@test.com',
          role: 'student'
        }))
      })

      // Try to access admin dashboard
      cy.visit('/admin/dashboard')

      // Should see access denied page
      cy.contains('Access Denied').should('be.visible')
      cy.contains("You don't have permission to access this page").should('be.visible')
      cy.contains('Student').should('be.visible')
    })

    it('recruiter cannot access admin routes', () => {
      // Set recruiter credentials
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'mock-recruiter-token')
        win.localStorage.setItem('user', JSON.stringify({
          id: 2,
          email: 'recruiter@test.com',
          role: 'recruiter'
        }))
      })

      // Try to access admin users page
      cy.visit('/admin/users')

      // Should see access denied page
      cy.contains('Access Denied').should('be.visible')
      cy.contains('Recruiter').should('be.visible')
    })

    it('unauthenticated user redirects to login', () => {
      // Clear any existing auth
      cy.clearLocalStorage()

      // Try to access any dashboard
      cy.visit('/admin/dashboard')

      // Should redirect to login
      cy.url().should('include', '/login')
    })
  })

  describe('Dashboard Functionality', () => {
    it('admin dashboard loads data and shows refresh functionality', () => {
      // Set admin credentials
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'mock-admin-token')
        win.localStorage.setItem('user', JSON.stringify({
          id: 1,
          email: 'admin@test.com',
          role: 'admin'
        }))
      })

      cy.visit('/admin/dashboard')

      // Wait for API calls
      cy.wait('@getApplicationsReport')
      cy.wait('@getInterviewsReport')
      cy.wait('@getPlacementsReport')
      cy.wait('@getStudentsReport')

      // Check that data is displayed
      cy.contains('150').should('be.visible') // Total applications
      cy.contains('75').should('be.visible')  // Total interviews

      // Test refresh functionality
      cy.contains('Refresh Data').click()

      // Should make API calls again
      cy.wait('@getApplicationsReport')
    })

    it('student dashboard loads personal data', () => {
      // Set student credentials
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'mock-student-token')
        win.localStorage.setItem('user', JSON.stringify({
          id: 3,
          email: 'student@test.com',
          role: 'student'
        }))
      })

      cy.visit('/student/dashboard')

      // Wait for API call
      cy.wait('@getMyReport')

      // Check that personal data is displayed
      cy.contains('5').should('be.visible') // Total applications
      cy.contains('3').should('be.visible') // Total interviews
      cy.contains('₹15.0L').should('be.visible') // Highest package
    })
  })
})
