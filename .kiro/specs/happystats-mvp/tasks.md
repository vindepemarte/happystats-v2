# Implementation Plan

- [x] 1. Set up project foundation and core configuration
  - Initialize Next.js 14 project with TypeScript and Tailwind CSS
  - Configure PWA settings and service worker
  - Set up PostgreSQL database connection and environment variables
  - Implement CSS color variables from colours.md in global styles
  - _Requirements: 7.1, 9.1, 10.1_

- [x] 2. Implement database schema and core data models
  - Create PostgreSQL migration files for users, charts, data_points, and subscriptions tables
  - Implement TypeScript interfaces for User, Chart, DataPoint, and Subscription
  - Create database connection utilities with connection pooling
  - Write database query functions for basic CRUD operations
  - _Requirements: 1.2, 4.1, 2.1_

- [x] 3. Set up authentication system foundation
  - Install and configure NextAuth.js with JWT strategy
  - Create user registration API endpoint with password hashing
  - Create user login API endpoint with session management
  - Implement password reset functionality with email tokens
  - Create authentication middleware for protected routes
  - _Requirements: 1.1, 1.3, 1.4, 1.5_

- [x] 4. Create core UI components with mobile-first design
  - Build reusable Button, Input, Card, and Modal components using Tailwind CSS
  - Implement responsive design starting from 312px viewport
  - Create Header and Navigation components with mobile-optimized layout
  - Build loading states and error boundary components
  - Test components across different viewport sizes (312px, 375px, 768px, 1024px)
  - _Requirements: 7.1, 7.2, 7.3, 10.1, 10.4_

- [x] 5. Implement user registration and login pages
  - Create registration page with form validation and error handling
  - Create login page with authentication flow
  - Implement logout functionality and session clearing
  - Add form validation for email format and password strength
  - Create user feedback for successful/failed authentication attempts
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 6. Build subscription management system
  - Install and configure Stripe SDK for payment processing
  - Create subscription tiers data structure (free, monthly, lifetime)
  - Implement Stripe customer creation on user registration
  - Create API endpoints for subscription upgrade/downgrade
  - Build subscription status checking middleware
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

- [x] 7. Create chart management core functionality
  - Build Chart model with CRUD operations
  - Create API endpoints for chart creation, reading, updating, and deletion
  - Implement chart limit validation based on subscription tier
  - Create ChartGrid component for dashboard display
  - Build CreateChartButton with subscription limit checking
  - _Requirements: 4.1, 4.2, 3.6, 6.1_

- [x] 8. Implement data point management
  - Create DataPoint model with validation for measurement, date, and name
  - Build API endpoints for adding, editing, and deleting data points
  - Implement data point form components with mobile-friendly inputs
  - Create data validation for numeric measurements and date formats
  - Build data point list display with edit/delete functionality
  - _Requirements: 4.2, 4.5, 4.6_

- [x] 9. Build chart visualization with trending lines
  - Install and configure Chart.js or Recharts for data visualization
  - Implement linear regression algorithm for trend line calculation
  - Create ChartView component with responsive chart rendering
  - Build trend line display that updates when data changes
  - Optimize chart rendering for mobile viewports (312px width)
  - _Requirements: 4.3, 4.4, 7.3_

- [x] 10. Create dashboard interface
  - Build main dashboard layout with chart grid display
  - Implement search functionality to filter charts by name
  - Create category filtering with dropdown/select component
  - Build responsive grid layout that adapts to screen size
  - Add empty state handling when no charts exist
  - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [x] 11. Implement full-view chart mode
  - Create full-view chart page with detailed data display
  - Build chart editing interface with data point management
  - Implement navigation between dashboard and full-view modes
  - Add chart settings and metadata editing functionality
  - Create mobile-optimized full-screen chart experience
  - _Requirements: 3.5, 4.4, 4.5_

- [x] 12. Build date range filtering system
  - Create date range picker component with mobile-friendly interface
  - Implement data filtering logic without mutating original dataset
  - Build filtered trend line calculation for date-restricted data
  - Create clear filter functionality to restore full dataset
  - Add empty state handling for filtered results with no data
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 13. Implement CSV import functionality
  - Create CSV file upload component with drag-and-drop support
  - Build CSV parsing and validation logic for required columns
  - Implement error handling for invalid CSV formats
  - Create preview functionality to show parsed data before import
  - Add chart creation from CSV data with subscription limit checking
  - _Requirements: 6.3, 6.4, 6.5_

- [x] 14. Build CSV export functionality
  - Create export button component for individual charts
  - Implement CSV generation with measurement, date, name, category columns
  - Build file download functionality with proper filename generation
  - Add export progress indication for large datasets
  - Create bulk export option for multiple charts
  - _Requirements: 6.1, 6.2_

- [x] 15. Create landing page with marketing content
  - Build hero section with compelling value proposition
  - Create features showcase with mobile-optimized layout
  - Implement pricing section displaying all three subscription tiers
  - Add AI assistant feature teaser section
  - Create call-to-action buttons linking to registration
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 16. Implement PWA functionality
  - Configure service worker for offline caching
  - Create app manifest for PWA installation
  - Implement offline data synchronization for pending actions
  - Build offline indicator and user feedback
  - Add background sync for data updates when connection restored
  - _Requirements: 7.5, 9.2_

- [x] 17. Add comprehensive error handling
  - Implement global error boundary for React components
  - Create standardized API error responses with proper HTTP codes
  - Build user-friendly error messages for common scenarios
  - Add error logging and monitoring integration
  - Create fallback UI components for error states
  - _Requirements: 1.5, 6.4, 9.5_

- [x] 18. Build subscription upgrade/downgrade flows
  - Create subscription management page with current plan display
  - Implement Stripe checkout integration for plan upgrades
  - Build plan downgrade functionality with data retention warnings
  - Create billing history and invoice access
  - Add subscription cancellation with grace period handling
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 19. Implement comprehensive testing suite
  - Write unit tests for all utility functions and data processing
  - Create component tests using React Testing Library
  - Build API endpoint tests with mock database
  - Implement E2E tests for critical user journeys
  - Add mobile responsiveness tests across viewport sizes
  - _Requirements: 9.2, 7.1, 7.2_

- [x] 20. Optimize performance and prepare for deployment
  - Implement database query optimization and indexing
  - Add image optimization and lazy loading
  - Create Docker configuration for Coolify deployment
  - Build production environment configuration
  - Implement monitoring and health check endpoints
  - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [ ] 21. Final integration and user acceptance testing
  - Test complete user workflows from registration to chart creation
  - Verify subscription limits and upgrade flows work correctly
  - Test CSV import/export with various file formats
  - Validate mobile experience across different devices
  - Perform final security audit and data validation
  - _Requirements: All requirements integration testing_