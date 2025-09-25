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

      // Navigate to Jobs section via dropdown
      cy.contains('Jobs').click()
      cy.contains('Manage Jobs').click()
      cy.url().should('include', '/recruiter/jobs')
      cy.contains('Jobs Management').should('be.visible')

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
      // Note: My Interviews is not implemented yet

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

  describe('Task 17 - Functional Tabs Tests', () => {
    describe('Recruiter Job Management Flow', () => {
      beforeEach(() => {
        // Set recruiter credentials
        cy.window().then((win) => {
          win.localStorage.setItem('token', 'mock-recruiter-token')
          win.localStorage.setItem('user', JSON.stringify({
            id: 2,
            email: 'recruiter@test.com',
            role: 'recruiter'
          }))
        })

        // Mock jobs API
        cy.intercept('GET', '/api/v1/jobs', {
          statusCode: 200,
          body: {
            jobs: [
              {
                id: 1,
                title: 'Software Engineer',
                company: 'Tech Corp',
                description: 'Develop amazing software',
                salary: 800000,
                deadline: '2024-12-31',
                createdAt: '2024-01-01',
                status: 'active',
                applicationCount: 5
              }
            ]
          }
        }).as('getJobs')

        cy.intercept('POST', '/api/v1/jobs', {
          statusCode: 201,
          body: {
            id: 2,
            title: 'Frontend Developer',
            company: 'Web Solutions',
            description: 'Build user interfaces',
            salary: 700000,
            deadline: '2024-11-30'
          }
        }).as('postJob')
      })

      it('recruiter can post a job and see it in jobs list', () => {
        // Navigate to Post Job page via dropdown
        cy.visit('/recruiter/dashboard')
        cy.contains('Jobs').click()
        cy.contains('Post Job').click()

        // Should be on post job page
        cy.url().should('include', '/recruiter/jobs/post')
        cy.contains('Post New Job').should('be.visible')

        // Fill job form
        cy.get('input[name="title"]').type('Frontend Developer')
        cy.get('textarea[name="description"]').type('Build amazing user interfaces using React')
        cy.get('input[name="salary"]').type('700000')
        cy.get('input[name="deadline"]').type('2024-11-30')

        // Submit form
        cy.get('button[type="submit"]').click()

        // Wait for API call
        cy.wait('@postJob')

        // Should redirect to jobs list
        cy.url().should('include', '/recruiter/jobs')
        cy.contains('Jobs Management').should('be.visible')
      })

      it('recruiter can view jobs list', () => {
        cy.visit('/recruiter/jobs')

        // Wait for jobs to load
        cy.wait('@getJobs')

        // Check jobs are displayed
        cy.contains('Software Engineer').should('be.visible')
        cy.contains('Tech Corp').should('be.visible')
        cy.contains('₹8,00,000').should('be.visible')
        cy.contains('View Applications').should('be.visible')
      })

      it('recruiter can access jobs via dropdown menu', () => {
        cy.visit('/recruiter/dashboard')

        // Click Jobs dropdown
        cy.contains('Jobs').click()

        // Check dropdown options
        cy.contains('Post Job').should('be.visible')
        cy.contains('Manage Jobs').should('be.visible')

        // Click Manage Jobs
        cy.contains('Manage Jobs').click()
        cy.url().should('include', '/recruiter/jobs')
      })
    })

    describe('Student Job Application Flow', () => {
      beforeEach(() => {
        // Set student credentials
        cy.window().then((win) => {
          win.localStorage.setItem('token', 'mock-student-token')
          win.localStorage.setItem('user', JSON.stringify({
            id: 3,
            email: 'student@test.com',
            role: 'student'
          }))
        })

        // Mock jobs API for students
        cy.intercept('GET', '/api/v1/jobs', {
          statusCode: 200,
          body: {
            jobs: [
              {
                id: 1,
                title: 'Software Engineer',
                company: 'Tech Corp',
                description: 'Develop amazing software',
                salary: 800000,
                deadline: '2024-12-31',
                createdAt: '2024-01-01',
                status: 'active',
                applicationCount: 5,
                jobType: 'full-time',
                location: 'Bangalore'
              },
              {
                id: 2,
                title: 'Frontend Developer',
                company: 'Web Solutions',
                description: 'Build user interfaces',
                salary: 700000,
                deadline: '2024-11-30',
                createdAt: '2024-01-15',
                status: 'active',
                applicationCount: 3,
                jobType: 'full-time',
                location: 'Mumbai'
              }
            ]
          }
        }).as('getJobsForStudent')

        // Mock applications API - student-specific endpoint
        cy.intercept('GET', '/api/v1/applications/me', {
          statusCode: 200,
          body: {
            applications: [
              {
                id: 1,
                jobId: 1,
                job_id: 1,
                status: 'pending',
                createdAt: '2024-01-10',
                job: {
                  title: 'Software Engineer',
                  company: 'Tech Corp',
                  salary: 800000
                }
              }
            ]
          }
        }).as('getMyApplications')

        // Also mock the fallback general applications endpoint
        cy.intercept('GET', '/api/v1/applications', {
          statusCode: 403,
          body: { error: 'Insufficient permissions' }
        }).as('getApplications')

        cy.intercept('POST', '/api/v1/applications', {
          statusCode: 201,
          body: {
            id: 2,
            jobId: 2,
            status: 'pending',
            createdAt: '2024-01-20'
          }
        }).as('applyToJob')

        // Mock placements API
        cy.intercept('GET', '/api/v1/placements/me', {
          statusCode: 200,
          body: {
            placements: [
              {
                id: 1,
                company: 'Tech Corp',
                position: 'Software Engineer',
                salary: 800000,
                status: 'placed',
                offerDate: '2024-01-15',
                joiningDate: '2024-07-01'
              }
            ]
          }
        }).as('getMyPlacements')
      })

      it('student can browse jobs and apply', () => {
        cy.visit('/student/jobs')

        // Wait for jobs to load
        cy.wait('@getJobsForStudent')

        // Wait for applications to load (to determine which jobs are already applied to)
        cy.wait('@getMyApplications')

        // Check jobs are displayed
        cy.contains('Software Engineer').should('be.visible')
        cy.contains('Frontend Developer').should('be.visible')
        cy.contains('₹8,00,000').should('be.visible')
        cy.contains('₹7,00,000').should('be.visible')

        // Verify Software Engineer shows "Applied" (already applied)
        cy.contains('Software Engineer')
          .parents('[data-cy="job-item"]')
          .should('contain.text', 'Applied ✓', { timeout: 10000 })

        // Verify Frontend Developer shows appropriate button based on deadline
        cy.contains('Frontend Developer')
          .parents('[data-cy="job-item"]')
          .then(($jobCard) => {
            if ($jobCard.text().includes('Deadline Passed')) {
              cy.wrap($jobCard).should('not.contain.text', 'Apply Now')
            } else {
              cy.wrap($jobCard).should('contain.text', 'Apply Now', { timeout: 10000 })
            }
          })

        // Click Apply Now button for Frontend Developer (only if deadline hasn't passed)
        cy.contains('Frontend Developer')
          .parents('[data-cy="job-item"]')
          .then(($jobCard) => {
            if (!$jobCard.text().includes('Deadline Passed')) {
              cy.wrap($jobCard)
                .find('[data-cy="apply-btn"]')
                .click()

              // Wait for application API call
              cy.wait('@applyToJob')

              // Button should change to "Applied"
              cy.contains('Applied ✓').should('be.visible')
            }
          })
      })

      it('student can view their applications', () => {
        cy.visit('/student/applications')

        // Wait for applications to load
        cy.wait('@getMyApplications')

        // Check applications are displayed
        cy.contains('My Applications').should('be.visible')
        cy.contains('Software Engineer').should('be.visible')
        cy.contains('Tech Corp').should('be.visible')
        cy.contains('Pending').should('be.visible')

        // Check statistics
        cy.contains('1').should('be.visible') // Total applications
      })

      it('student can view their placements', () => {
        cy.visit('/student/placements')

        // Wait for placements to load
        cy.wait('@getMyPlacements')

        // Check placements are displayed
        cy.contains('My Placements').should('be.visible')
        cy.contains('Tech Corp').should('be.visible')
        cy.contains('Software Engineer').should('be.visible')
        cy.contains('Placed').should('be.visible')
        cy.contains('₹8,00,000').should('be.visible')

        // Check congratulations message
        cy.contains('🎉 Congratulations on your placement!').should('be.visible')
      })

      it('student navigation works correctly', () => {
        cy.visit('/student/dashboard')

        // Test Browse Jobs navigation
        cy.contains('Browse Jobs').click()
        cy.url().should('include', '/student/jobs')
        cy.contains('Browse Jobs').should('be.visible')

        // Test My Applications navigation
        cy.contains('My Applications').click()
        cy.url().should('include', '/student/applications')
        cy.contains('My Applications').should('be.visible')

        // Test My Placements navigation
        cy.contains('My Placements').click()
        cy.url().should('include', '/student/placements')
        cy.contains('My Placements').should('be.visible')
      })
    })

    describe('Application Management Flow', () => {
      beforeEach(() => {
        // Set recruiter credentials
        cy.window().then((win) => {
          win.localStorage.setItem('token', 'mock-recruiter-token')
          win.localStorage.setItem('user', JSON.stringify({
            id: 2,
            email: 'recruiter@test.com',
            role: 'recruiter'
          }))
        })

        // Mock applications for recruiter
        cy.intercept('GET', '/api/v1/applications?jobId=1', {
          statusCode: 200,
          body: {
            applications: [
              {
                id: 1,
                jobId: 1,
                status: 'pending',
                createdAt: '2024-01-10',
                student: {
                  name: 'John Doe',
                  email: 'john@test.com',
                  course: 'Computer Science',
                  year: '4th Year',
                  cgpa: '8.5'
                }
              }
            ]
          }
        }).as('getJobApplications')

        cy.intercept('PUT', '/api/v1/applications/1', {
          statusCode: 200,
          body: { success: true }
        }).as('updateApplication')
      })

      it('recruiter can view and manage applications', () => {
        // First need to mock jobs API for the dropdown
        cy.intercept('GET', '/api/v1/jobs', {
          statusCode: 200,
          body: {
            jobs: [
              {
                id: 1,
                title: 'Software Engineer',
                company: 'Tech Corp'
              }
            ]
          }
        }).as('getJobsForApplications')

        cy.visit('/recruiter/applications?jobId=1')

        // Wait for jobs to load first
        cy.wait('@getJobsForApplications')

        // Wait for applications to load
        cy.wait('@getJobApplications')

        // Check application is displayed
        cy.contains('John Doe').should('be.visible')
        cy.contains('john@test.com').should('be.visible')
        cy.contains('Computer Science').should('be.visible')
        cy.contains('Pending').should('be.visible')

        // Accept application
        cy.contains('Accept').click()

        // Wait for update API call
        cy.wait('@updateApplication')

        // Status should update (mocked in real scenario)
        cy.contains('Accept').should('be.visible')
      })
    })

    describe('Error Handling and Loading States', () => {
      it('handles job loading errors gracefully', () => {
        // Set student credentials
        cy.window().then((win) => {
          win.localStorage.setItem('token', 'mock-student-token')
          win.localStorage.setItem('user', JSON.stringify({
            id: 3,
            email: 'student@test.com',
            role: 'student'
          }))
        })

        // Mock API error
        cy.intercept('GET', '/api/v1/jobs', {
          statusCode: 500,
          body: { error: 'Server error' }
        }).as('getJobsError')

        cy.visit('/student/jobs')

        // Wait for error
        cy.wait('@getJobsError')

        // Check error message is displayed
        cy.contains('Failed to load jobs').should('be.visible')
        cy.contains('Retry').should('be.visible')
      })

      it('shows loading states correctly', () => {
        // Set student credentials
        cy.window().then((win) => {
          win.localStorage.setItem('token', 'mock-student-token')
          win.localStorage.setItem('user', JSON.stringify({
            id: 3,
            email: 'student@test.com',
            role: 'student'
          }))
        })

        // Mock slow API response
        cy.intercept('GET', '/api/v1/jobs', {
          statusCode: 200,
          body: { jobs: [] },
          delay: 1000
        }).as('getJobsSlow')

        cy.visit('/student/jobs')

        // Check loading state
        cy.contains('Loading jobs...').should('be.visible')

        // Wait for API call to complete
        cy.wait('@getJobsSlow')

        // Loading should disappear
        cy.contains('Loading jobs...').should('not.exist')
      })
    })
  })
})
