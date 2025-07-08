# CYY Mobile App - Testing Guide

## Overview

The CYY Mobile App includes comprehensive testing setup covering both unit tests and end-to-end (E2E) tests to ensure reliability and quality of the medication reminder functionality.

## Testing Stack

### Unit Testing
- **Jest** - JavaScript testing framework
- **React Native Testing Library** - Testing utilities for React Native components
- **MockDate** - Date mocking for consistent time-based testing
- **Custom Test Utilities** - Helper functions and mocks for common testing patterns

### E2E Testing
- **Detox** - Gray box E2E testing framework for React Native
- **Jest** - Test runner for E2E tests
- **Custom Test Helpers** - Wrapper functions for common E2E operations

## Quick Start

### 1. Install Testing Dependencies

```bash
# Install all testing dependencies
make test-install

# Or manually:
npm install --save-dev @testing-library/react-native @testing-library/jest-native detox mockdate
```

### 2. Run Unit Tests

```bash
# Run all unit tests
make test

# Run tests in watch mode (automatically re-run on file changes)
make test-watch

# Run tests with coverage report
make test-coverage
```

### 3. Run E2E Tests

```bash
# First-time setup (builds the test app)
make test-e2e-setup

# Run E2E tests on iOS simulator
make test-e2e

# Run E2E tests on Android emulator
make test-e2e-android

# Run all tests (unit + E2E)
make test-all
```

## Test Structure

```
CYYMobileApp/
├── src/
│   ├── __tests__/
│   │   ├── utils/
│   │   │   └── testUtils.ts           # Common test utilities and mocks
│   │   ├── components/
│   │   └── screens/
│   ├── utils/__tests__/
│   │   ├── dateUtils.test.ts          # Date utility function tests
│   │   ├── timeUtils.test.ts          # Time utility function tests
│   │   └── database.test.ts           # Database class tests
│   ├── components/__tests__/
│   │   └── CameraModal.test.tsx       # Component tests
│   └── screens/__tests__/
│       └── HomeScreen.test.tsx        # Screen component tests
├── e2e/
│   ├── jest.config.js                 # E2E Jest configuration
│   ├── init.js                        # E2E test setup and helpers
│   └── medication-workflow.test.js    # Complete workflow E2E tests
├── jest-setup.js                      # Global Jest setup and mocks
├── jest.config.js                     # Main Jest configuration
└── .detoxrc.js                        # Detox configuration
```

## Unit Tests

### Utility Functions Tests

#### `dateUtils.test.ts`
Tests for date manipulation and formatting functions:
- `getDayAbbreviation()` - Day number to abbreviation conversion
- `isToday()` / `isYesterday()` - Date comparison functions
- `formatDateForDisplay()` - Human-readable date formatting
- `getStartOfDay()` / `getEndOfDay()` - Date boundary calculations
- `addDays()` / `getDaysDifference()` - Date arithmetic
- `isDaySelected()` - Day selection validation

#### `timeUtils.test.ts`
Tests for time formatting and validation functions:
- `formatTime()` - 24-hour to 12-hour format conversion
- `formatTimeFromDate()` - Date object to formatted time string
- `getCurrentTime()` - Current time in HH:MM format
- `isValidTime()` - Time string validation
- `compareTimeStrings()` - Time comparison logic

#### `database.test.ts`
Tests for the Database class (AsyncStorage wrapper):
- **Medication CRUD operations**
  - `getMedications()` / `getMedicationById()`
  - `saveMedication()` / `deleteMedication()`
  - Data migration (adding `retryCount` field)
- **Medication Log operations**
  - `getMedicationLogs()` / `getLogsByMedicationId()`
  - `saveMedicationLog()` / `deleteMedicationLog()`
  - Date serialization/deserialization
- **Settings management**
  - `getSettings()` / `saveSettings()`
  - Default settings merging
- **Utility functions**
  - `generateId()` / `clearAllData()`
  - Error handling

### Component Tests

#### `CameraModal.test.tsx`
Tests for the camera modal component:
- **Rendering behavior**
  - Visible/hidden states
  - Proper medication name display
  - UI element presence
- **Permission handling**
  - Camera permission requests
  - Permission denial scenarios
  - Settings navigation for blocked permissions
- **Camera functionality**
  - Camera launch and photo capture
  - Gallery photo selection
  - Photo preview and confirmation
  - Error handling (user cancellation, camera errors)
- **Platform-specific behavior**
  - iOS vs Android permission handling

#### `HomeScreen.test.tsx`
Tests for the main home screen:
- **Data loading and display**
  - Loading states
  - Medication list rendering
  - Empty state handling
- **Medication management**
  - Navigation to add/edit screens
  - Toggle active/inactive status
  - Delete confirmation and execution
  - Navigation to medication details
- **User interactions**
  - Pull-to-refresh functionality
  - Button press handling
- **Error handling**
  - Database operation failures
  - Network/connectivity issues
- **Accessibility**
  - Proper test IDs and labels

### Test Utilities (`testUtils.ts`)

Common utilities for consistent testing:

#### Mock Data Factories
```typescript
createMockMedication(overrides?: Partial<Medication>): Medication
createMockMedicationLog(overrides?: Partial<MedicationLog>): MedicationLog
createMockAppSettings(overrides?: Partial<AppSettings>): AppSettings
```

#### Mock Service Objects
- `mockDatabase` - Database operations
- `mockNotifications` - Notification scheduling
- `mockImagePicker` - Camera/gallery functionality
- `mockPermissions` - Permission handling

#### Navigation Mocks
- `mockUseNavigation()` - React Navigation hooks
- `mockUseRoute()` - Route parameter handling

#### Testing Helpers
- `customRender()` - Component rendering with navigation context
- `resetAllMocks()` - Clean mock state between tests
- `waitFor()` / `sleep()` - Async operation utilities

## E2E Tests

### Complete Workflow Testing (`medication-workflow.test.js`)

The E2E tests cover the complete user journey through the app:

#### 1. Adding Medication
- Navigate to Add Medication screen
- Fill in all medication details (name, dosage, time, days, notifications)
- Set retry count and notes
- Save and verify medication appears on home screen
- Form validation testing

#### 2. Receiving Notifications
- Schedule test notifications
- Background/foreground app state handling
- Notification interaction testing

#### 3. Recording Medication as Taken
- Mark medication as taken without photo
- Take photo with camera and confirm
- Select photo from gallery
- Verify history recording

#### 4. Skipping Medication
- Skip medication with confirmation dialog
- Cancel skip action
- Verify skip is recorded in history

#### 5. Viewing Medication Details
- Navigate to medication details screen
- View statistics and charts
- Photo thumbnail interaction
- Time distribution visualization

#### 6. Deleting History
- Swipe-to-delete individual log entries
- Delete entire medication with all history
- Confirmation dialogs

#### 7. Settings and Data Management
- Modify notification settings
- Test notification functionality
- Clear all app data
- Verify data reset

#### 8. Navigation and UI Flow
- Bottom tab navigation
- Back button handling
- Screen transitions

#### 9. Error Handling and Edge Cases
- Camera permission denial
- Network connectivity issues
- Offline functionality

#### 10. Performance Testing
- Navigation responsiveness
- Large data set handling

### E2E Test Helpers

The E2E tests use custom helper functions for reliable testing:

```javascript
TestHelpers.waitForElementToBeVisible(matcher, timeout)
TestHelpers.tapElement(matcher)
TestHelpers.typeText(matcher, text)
TestHelpers.scrollToElement(scrollMatcher, elementMatcher)
TestHelpers.takeScreenshot(name)
TestHelpers.resetApp()
TestHelpers.clearAppData()
```

## Configuration

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|...|@bottom-tabs)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageReporters: ['html', 'lcov', 'text'],
  coverageDirectory: 'coverage',
};
```

### Detox Configuration (`.detoxrc.js`)

```javascript
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js'
    }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/CYYMobileApp.app',
      build: 'xcodebuild -workspace ios/CYYMobileApp.xcworkspace -scheme CYYMobileApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    },
    // Android configuration...
  },
  devices: {
    'ios.simulator': {
      type: 'ios.simulator',
      device: { type: 'iPhone 15' }
    }
    // Android emulator configuration...
  },
  configurations: {
    'ios.sim.debug': {
      device: 'ios.simulator',
      app: 'ios.debug'
    }
    // Other configurations...
  }
};
```

## Running Tests in CI/CD

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: cd ios && pod install
      - run: npm run test:e2e:build
      - run: npm run test:e2e
```

## Best Practices

### Writing Unit Tests

1. **Use descriptive test names** that explain what is being tested
2. **Group related tests** using `describe` blocks
3. **Test edge cases** and error conditions
4. **Mock external dependencies** consistently
5. **Use the `beforeEach`/`afterEach` hooks** for setup and cleanup
6. **Test user interactions** rather than implementation details

### Writing E2E Tests

1. **Test complete user workflows** rather than isolated features
2. **Use reliable selectors** (testID over text when possible)
3. **Add appropriate waits** for async operations
4. **Take screenshots** at key points for debugging
5. **Handle device-specific behavior** (iOS vs Android)
6. **Test error scenarios** and edge cases

### Test Maintenance

1. **Keep tests updated** with feature changes
2. **Review test coverage** regularly
3. **Refactor common patterns** into reusable helpers
4. **Monitor test execution time** and optimize slow tests
5. **Run tests locally** before pushing changes

## Coverage Reports

After running `make test-coverage`, view the coverage report:

```bash
# Open HTML coverage report
open coverage/lcov-report/index.html
```

The coverage report shows:
- **Line coverage** - Percentage of code lines executed
- **Function coverage** - Percentage of functions called
- **Branch coverage** - Percentage of code branches taken
- **Statement coverage** - Percentage of statements executed

## Troubleshooting

### Common Issues

#### Unit Tests

**Issue**: Tests fail with "Cannot find module" errors
**Solution**: Check that all dependencies are installed and paths are correct

**Issue**: Date/time tests fail inconsistently
**Solution**: Ensure MockDate is properly set up in test setup

**Issue**: Component tests fail to render
**Solution**: Verify that all required mocks are configured in `jest-setup.js`

#### E2E Tests

**Issue**: "DetoxRuntimeError: device is undefined"
**Solution**: Ensure the app is built before running tests: `make test-e2e-build`

**Issue**: Tests fail with "element not found"
**Solution**: Check element selectors and add appropriate wait conditions

**Issue**: iOS simulator not launching
**Solution**: Verify simulator configuration in `.detoxrc.js` and ensure Xcode is properly set up

### Debug Strategies

1. **Use `console.log`** strategically in tests
2. **Take screenshots** at failure points in E2E tests
3. **Run tests individually** to isolate issues
4. **Check mock configurations** when tests behave unexpectedly
5. **Verify test data setup** and cleanup

## Contributing

When adding new features:

1. **Write unit tests** for new utility functions and components
2. **Update E2E tests** if the user workflow changes
3. **Maintain test coverage** above 80%
4. **Update this documentation** for any new testing patterns or tools

For questions or issues with testing, please refer to the main project documentation or create an issue in the project repository. 