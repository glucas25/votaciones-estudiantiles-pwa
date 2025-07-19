# Testing Documentation

This directory contains the comprehensive testing suite for the Student Voting System PWA.

## Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── services/           # Service layer tests
│   ├── contexts/           # React Context tests
│   ├── hooks/              # Custom hooks tests
│   └── components/         # Component tests
│       ├── auth/           # Authentication components
│       ├── tutor/          # Tutor module components
│       ├── admin/          # Admin module components
│       ├── common/         # Shared components
│       └── voting/         # Voting interface components
├── integration/            # Integration tests
└── e2e/                   # End-to-end tests
```

## Test Types

### Unit Tests (`tests/unit/`)
- **Services**: Database operations, authentication logic
- **Contexts**: React Context providers and state management
- **Hooks**: Custom hook behavior and side effects
- **Components**: Individual component functionality and rendering

### Integration Tests (`tests/integration/`)
- **Auth Flow**: Complete authentication workflows
- **Data Flow**: Context and service interactions
- **User Journeys**: Multi-component user interactions

### End-to-End Tests (`tests/e2e/`)
- **Authentication**: Login/logout flows across all roles
- **Tutor Panel**: Complete tutor workflow testing
- **Admin Panel**: Administrative functionality testing
- **Cross-browser**: Chrome, Firefox, Safari, Mobile

## Running Tests

### Unit and Integration Tests (Vitest)
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests once with coverage
npm run test:coverage

# Run specific test file
npm test auth.test.js

# Run tests matching pattern
npm test -- --grep "authentication"
```

### End-to-End Tests (Playwright)
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific browser
npx playwright test --project=chromium

# Run specific test file
npx playwright test auth.spec.js

# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

## Test Configuration

### Vitest Configuration (`vitest.config.js`)
- **Environment**: jsdom for React component testing
- **Setup**: Global test setup and mocks
- **Coverage**: Text, JSON, and HTML reports
- **Globals**: Global test functions available

### Playwright Configuration (`playwright.config.js`)
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: iOS Safari, Android Chrome
- **Reporting**: HTML and JSON reports
- **Screenshots**: On failure
- **Video**: Retain on failure

## Test Utilities

### `src/test/setup.js`
- Global test setup
- PouchDB mocking
- LocalStorage mocking
- Navigation mocking

### `src/test/utils.jsx`
- `renderWithProviders()`: Renders components with contexts
- Mock data for users, students, candidates
- Test helper functions

## Writing Tests

### Unit Test Example
```javascript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### E2E Test Example
```javascript
import { test, expect } from '@playwright/test'

test('should login successfully', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Admin').click()
  await page.fill('[placeholder="Username"]', 'admin')
  await page.fill('[placeholder="Password"]', 'admin2024')
  await page.click('button[type="submit"]')
  
  await expect(page.getByText('Dashboard')).toBeVisible()
})
```

## Test Coverage

The test suite aims for comprehensive coverage:

- **Unit Tests**: 90%+ code coverage
- **Integration Tests**: Critical user flows
- **E2E Tests**: Core functionality across browsers

### Coverage Reports
- Generated in `coverage/` directory
- HTML report at `coverage/index.html`
- JSON report for CI/CD integration

## Continuous Integration

Tests are designed to run in CI/CD environments:

### GitHub Actions Example
```yaml
- name: Run Tests
  run: |
    npm run test:run
    npm run test:e2e
```

### Test Artifacts
- Test results: JSON format
- Screenshots: Failure artifacts
- Videos: E2E test recordings
- Coverage reports: HTML/JSON

## Mocking Strategy

### Service Mocks
- **PouchDB**: Mocked for consistent test data
- **Auth Service**: Mocked for controlled login states
- **LocalStorage**: Mocked for session testing

### Component Mocks
- **External dependencies**: Chart libraries, PDF generators
- **Browser APIs**: File API, Notifications
- **Time-dependent functions**: Date.now(), timers

## Best Practices

### Unit Tests
- Test one thing at a time
- Use descriptive test names
- Mock external dependencies
- Test both success and error cases

### Integration Tests
- Test real user workflows
- Use minimal mocking
- Focus on component interactions
- Verify data flow between layers

### E2E Tests
- Test critical user journeys
- Use page object patterns
- Handle async operations properly
- Test across different browsers/devices

## Debugging Tests

### Unit/Integration Tests
```bash
# Debug with Node inspector
npm test -- --inspect-brk

# Run single test file
npm test MyComponent.test.js

# Run with verbose output
npm test -- --verbose
```

### E2E Tests
```bash
# Run in debug mode
npx playwright test --debug

# Run with UI mode
npx playwright test --ui

# Record new tests
npx playwright codegen localhost:3000
```

## Performance Testing

### Load Testing Considerations
- Database operations under load
- Multiple concurrent users
- Memory leak detection
- Bundle size optimization

### Metrics Tracked
- Test execution time
- Component render time
- Database query performance
- Page load speed (E2E)

## Maintenance

### Regular Tasks
- Update test data fixtures
- Review and update mocks
- Maintain test documentation
- Monitor test performance
- Update browser versions

### Test Reliability
- Avoid flaky tests
- Use proper wait conditions
- Handle timing issues
- Maintain stable test data