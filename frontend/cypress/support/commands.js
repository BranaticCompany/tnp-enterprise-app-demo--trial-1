// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to login with different roles
Cypress.Commands.add('loginAs', (role) => {
  const users = {
    admin: { email: 'admin@test.com', password: 'password123' },
    recruiter: { email: 'recruiter@test.com', password: 'password123' },
    student: { email: 'student@test.com', password: 'password123' }
  }
  
  const user = users[role]
  if (!user) {
    throw new Error(`Unknown role: ${role}`)
  }
  
  cy.visit('/login')
  cy.get('[data-testid="email-input"]').type(user.email)
  cy.get('[data-testid="password-input"]').type(user.password)
  cy.get('[data-testid="login-button"]').click()
})

// Custom command to mock API responses
Cypress.Commands.add('mockApiResponses', () => {
  cy.intercept('GET', '/api/v1/reports/applications', {
    fixture: 'applications-report.json'
  }).as('getApplicationsReport')
  
  cy.intercept('GET', '/api/v1/reports/interviews', {
    fixture: 'interviews-report.json'
  }).as('getInterviewsReport')
  
  cy.intercept('GET', '/api/v1/reports/placements', {
    fixture: 'placements-report.json'
  }).as('getPlacementsReport')
  
  cy.intercept('GET', '/api/v1/reports/students', {
    fixture: 'students-report.json'
  }).as('getStudentsReport')
  
  cy.intercept('GET', '/api/v1/reports/me', {
    fixture: 'my-report.json'
  }).as('getMyReport')
})

// Custom command to check dashboard elements
Cypress.Commands.add('checkDashboardElements', (role) => {
  const expectations = {
    admin: {
      title: 'Admin Dashboard',
      badge: 'Administrator',
      actions: ['Manage Users', 'Manage Companies', 'Generate Reports']
    },
    recruiter: {
      title: 'Recruiter Dashboard',
      badge: 'Recruiter',
      actions: ['Post New Job', 'Review Applications', 'Schedule Interview']
    },
    student: {
      title: 'Student Dashboard',
      badge: 'Student',
      actions: ['Browse Jobs', 'Apply to Job', 'View Applications']
    }
  }
  
  const expected = expectations[role]
  cy.contains(expected.title).should('be.visible')
  cy.contains(expected.badge).should('be.visible')
  
  expected.actions.forEach(action => {
    cy.contains(action).should('be.visible')
  })
})
