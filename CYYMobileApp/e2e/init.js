const { device, expect, element, by, waitFor } = require('detox');

// Common test helpers
const TestHelpers = {
  // Wait for element to be visible
  waitForElementToBeVisible: async (matcher, timeout = 10000) => {
    await waitFor(element(matcher)).toBeVisible().withTimeout(timeout);
  },

  // Wait for element to exist
  waitForElementToExist: async (matcher, timeout = 10000) => {
    await waitFor(element(matcher)).toExist().withTimeout(timeout);
  },

  // Tap element safely
  tapElement: async (matcher) => {
    await TestHelpers.waitForElementToBeVisible(matcher);
    await element(matcher).tap();
  },

  // Type text safely
  typeText: async (matcher, text) => {
    await TestHelpers.waitForElementToBeVisible(matcher);
    await element(matcher).typeText(text);
  },

  // Clear text and type new text
  replaceText: async (matcher, text) => {
    await TestHelpers.waitForElementToBeVisible(matcher);
    await element(matcher).replaceText(text);
  },

  // Scroll to element
  scrollToElement: async (scrollMatcher, elementMatcher) => {
    await waitFor(element(elementMatcher))
      .toBeVisible()
      .whileElement(scrollMatcher)
      .scroll(200, 'down');
  },

  // Take screenshot
  takeScreenshot: async (name) => {
    await device.takeScreenshot(name);
  },

  // Reset app state
  resetApp: async () => {
    await device.reloadReactNative();
  },

  // Clear app data
  clearAppData: async () => {
    await device.clearKeychain();
  }
};

// Make helpers available globally
global.TestHelpers = TestHelpers;

// Set up test environment
beforeAll(async () => {
  console.log('Setting up E2E test environment...');
  await device.launchApp({
    permissions: {
      notifications: 'YES',
      camera: 'YES',
      photos: 'YES',
    },
  });
});

beforeEach(async () => {
  console.log('Setting up test...');
  await TestHelpers.resetApp();
});

afterEach(async () => {
  console.log('Cleaning up test...');
  // Take screenshot on failure
  if (jasmine.testPath && jasmine.testPath.includes('FAILED')) {
    await TestHelpers.takeScreenshot('test-failure');
  }
});

afterAll(async () => {
  console.log('Tearing down E2E test environment...');
  await TestHelpers.clearAppData();
}); 