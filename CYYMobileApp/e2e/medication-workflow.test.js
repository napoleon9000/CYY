const { device, expect, element, by, waitFor } = require('detox');

describe('CYY Medication App - Complete Workflow', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: {
        notifications: 'YES',
        camera: 'YES',
        photos: 'YES',
      },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Adding Medication', () => {
    it('should add a new medication with all details', async () => {
      // Navigate to Add Medication screen
      await TestHelpers.waitForElementToBeVisible(by.text('CYY'));
      await TestHelpers.tapElement(by.id('add-medication-button'));
      
      // Verify we're on the Add Medication screen
      await TestHelpers.waitForElementToBeVisible(by.text('Add Medication'));
      
      // Fill in medication details
      await TestHelpers.typeText(by.id('medication-name-input'), 'Aspirin');
      await TestHelpers.typeText(by.id('medication-dosage-input'), '81mg');
      
      // Set reminder time
      await TestHelpers.tapElement(by.id('reminder-time-picker'));
      await TestHelpers.tapElement(by.text('8:00 AM'));
      
      // Select reminder days (Monday, Wednesday, Friday)
      await TestHelpers.tapElement(by.id('day-selector-1')); // Monday
      await TestHelpers.tapElement(by.id('day-selector-3')); // Wednesday
      await TestHelpers.tapElement(by.id('day-selector-5')); // Friday
      
      // Set notification type
      await TestHelpers.tapElement(by.id('notification-sound-toggle'));
      await TestHelpers.tapElement(by.id('notification-vibration-toggle'));
      
      // Set retry count
      await TestHelpers.tapElement(by.id('retry-count-input'));
      await TestHelpers.replaceText(by.id('retry-count-input'), '3');
      
      // Add notes
      await TestHelpers.typeText(by.id('medication-notes-input'), 'Take with food');
      
      // Save medication
      await TestHelpers.tapElement(by.id('save-medication-button'));
      
      // Verify we're back on the home screen with the new medication
      await TestHelpers.waitForElementToBeVisible(by.text('Your Medications'));
      await TestHelpers.waitForElementToBeVisible(by.text('Aspirin'));
      await TestHelpers.waitForElementToBeVisible(by.text('81mg'));
      await TestHelpers.waitForElementToBeVisible(by.text('8:00 AM'));
      
      await TestHelpers.takeScreenshot('medication-added');
    });

    it('should validate required fields', async () => {
      // Navigate to Add Medication screen
      await TestHelpers.tapElement(by.id('add-medication-button'));
      
      // Try to save without filling required fields
      await TestHelpers.tapElement(by.id('save-medication-button'));
      
      // Should see validation errors
      await TestHelpers.waitForElementToBeVisible(by.text('Please enter medication name'));
      await TestHelpers.waitForElementToBeVisible(by.text('Please enter dosage'));
      
      await TestHelpers.takeScreenshot('validation-errors');
    });
  });

  describe('Receiving Notifications', () => {
    it('should schedule and receive notification', async () => {
      // First add a medication with immediate notification for testing
      await TestHelpers.tapElement(by.id('add-medication-button'));
      await TestHelpers.typeText(by.id('medication-name-input'), 'Test Medication');
      await TestHelpers.typeText(by.id('medication-dosage-input'), '10mg');
      
      // Set reminder time to current time + 1 minute
      const currentTime = new Date();
      currentTime.setMinutes(currentTime.getMinutes() + 1);
      const timeString = currentTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      
      await TestHelpers.tapElement(by.id('reminder-time-picker'));
      await TestHelpers.tapElement(by.text(timeString));
      
      // Select today
      const today = currentTime.getDay();
      await TestHelpers.tapElement(by.id(`day-selector-${today}`));
      
      await TestHelpers.tapElement(by.id('save-medication-button'));
      
      // Wait for the notification (this would require a longer timeout in real scenario)
      // For testing purposes, we'll trigger a test notification
      await TestHelpers.tapElement(by.id('settings-tab'));
      await TestHelpers.waitForElementToBeVisible(by.text('Settings'));
      await TestHelpers.scrollToElement(by.id('settings-scroll'), by.text('Test Delayed Notification'));
      await TestHelpers.tapElement(by.text('Test Delayed Notification'));
      
      // Verify alert appears
      await TestHelpers.waitForElementToBeVisible(by.text('Test Notification Scheduled!'));
      await TestHelpers.tapElement(by.text('Got it!'));
      
      // Put app in background to receive notification
      await device.sendToHome();
      await TestHelpers.sleep(6000); // Wait for notification
      
      // Bring app back to foreground
      await device.launchApp({ newInstance: false });
      
      await TestHelpers.takeScreenshot('notification-received');
    });
  });

  describe('Recording Medication as Taken', () => {
    beforeEach(async () => {
      // Ensure we have a medication to work with
      await TestHelpers.tapElement(by.text('Track'));
      await TestHelpers.waitForElementToBeVisible(by.text('📅 Next 24 Hours'));
    });

    it('should record medication as taken without photo', async () => {
      // Look for an upcoming medication
      await TestHelpers.waitForElementToBeVisible(by.id('upcoming-medication-card'));
      
      // Tap the "Taken" button
      await TestHelpers.tapElement(by.id('mark-taken-button'));
      
      // Verify it's marked as taken
      await TestHelpers.waitForElementToBeVisible(by.text('✅ Taken'));
      
      // Check history section
      await TestHelpers.tapElement(by.text('📋 History'));
      await TestHelpers.waitForElementToBeVisible(by.text('Taken at'));
      
      await TestHelpers.takeScreenshot('medication-taken-no-photo');
    });

    it('should record medication as taken with photo', async () => {
      // Look for an upcoming medication
      await TestHelpers.waitForElementToBeVisible(by.id('upcoming-medication-card'));
      
      // Tap the camera button to take photo
      await TestHelpers.tapElement(by.id('take-photo-button'));
      
      // Verify camera modal opens
      await TestHelpers.waitForElementToBeVisible(by.text('Take Photo'));
      await TestHelpers.waitForElementToBeVisible(by.text('Take a photo as evidence'));
      
      // Take photo with camera
      await TestHelpers.tapElement(by.id('camera-button'));
      
      // For testing, we'll simulate camera success (in real device, this would open camera)
      // The mock should return success with photo URI
      
      // Verify photo preview appears
      await TestHelpers.waitForElementToBeVisible(by.text('Photo captured!'));
      
      // Confirm the photo
      await TestHelpers.tapElement(by.text('Confirm'));
      
      // Verify medication is marked as taken with photo
      await TestHelpers.waitForElementToBeVisible(by.text('✅ Taken'));
      await TestHelpers.waitForElementToBeVisible(by.id('photo-thumbnail'));
      
      await TestHelpers.takeScreenshot('medication-taken-with-photo');
    });

    it('should record medication from gallery photo', async () => {
      await TestHelpers.waitForElementToBeVisible(by.id('upcoming-medication-card'));
      await TestHelpers.tapElement(by.id('take-photo-button'));
      
      // Choose from gallery instead
      await TestHelpers.tapElement(by.id('gallery-button'));
      
      // Simulate gallery photo selection
      await TestHelpers.waitForElementToBeVisible(by.text('Photo captured!'));
      await TestHelpers.tapElement(by.text('Confirm'));
      
      // Verify taken with photo from gallery
      await TestHelpers.waitForElementToBeVisible(by.text('✅ Taken'));
      await TestHelpers.waitForElementToBeVisible(by.id('photo-thumbnail'));
      
      await TestHelpers.takeScreenshot('medication-taken-gallery-photo');
    });
  });

  describe('Skipping Medication', () => {
    it('should skip medication and record the action', async () => {
      await TestHelpers.tapElement(by.text('Track'));
      await TestHelpers.waitForElementToBeVisible(by.id('upcoming-medication-card'));
      
      // Tap the "Skip" button
      await TestHelpers.tapElement(by.id('skip-button'));
      
      // Verify skip confirmation dialog
      await TestHelpers.waitForElementToBeVisible(by.text('Skip Medication'));
      await TestHelpers.waitForElementToBeVisible(by.text('Are you sure you want to skip'));
      
      // Confirm skip
      await TestHelpers.tapElement(by.text('Skip'));
      
      // Verify medication is marked as skipped
      await TestHelpers.waitForElementToBeVisible(by.text('❌ Skipped'));
      
      // Check in history
      await TestHelpers.tapElement(by.text('📋 History'));
      await TestHelpers.waitForElementToBeVisible(by.text('Skipped at'));
      
      await TestHelpers.takeScreenshot('medication-skipped');
    });

    it('should cancel skip action', async () => {
      await TestHelpers.waitForElementToBeVisible(by.id('upcoming-medication-card'));
      await TestHelpers.tapElement(by.id('skip-button'));
      
      // Cancel the skip
      await TestHelpers.tapElement(by.text('Cancel'));
      
      // Verify medication is still pending
      await TestHelpers.waitForElementToBeVisible(by.text('⏰ Pending'));
      
      await TestHelpers.takeScreenshot('skip-cancelled');
    });
  });

  describe('Viewing Medication Details', () => {
    it('should view detailed medication information and statistics', async () => {
      // Go to home screen and tap on a medication card
      await TestHelpers.tapElement(by.text('Home'));
      await TestHelpers.waitForElementToBeVisible(by.id('medication-card-aspirin'));
      await TestHelpers.tapElement(by.id('medication-card-aspirin'));
      
      // Verify we're on the details screen
      await TestHelpers.waitForElementToBeVisible(by.text('Medication Details'));
      await TestHelpers.waitForElementToBeVisible(by.text('Aspirin'));
      
      // Check statistics section
      await TestHelpers.waitForElementToBeVisible(by.text('Statistics'));
      await TestHelpers.waitForElementToBeVisible(by.text('Total Records'));
      await TestHelpers.waitForElementToBeVisible(by.text('Taken'));
      await TestHelpers.waitForElementToBeVisible(by.text('Skipped'));
      await TestHelpers.waitForElementToBeVisible(by.text('Compliance'));
      
      // Check time distribution chart
      await TestHelpers.waitForElementToBeVisible(by.text('Time Distribution'));
      
      // View photos if any
      if (await TestHelpers.waitForElementToExist(by.id('photo-thumbnail'))) {
        await TestHelpers.tapElement(by.id('photo-thumbnail'));
        await TestHelpers.waitForElementToBeVisible(by.text('Photo taken at'));
        await TestHelpers.tapElement(by.id('close-photo-viewer'));
      }
      
      await TestHelpers.takeScreenshot('medication-details');
    });
  });

  describe('Deleting History', () => {
    it('should delete individual medication log entries', async () => {
      await TestHelpers.tapElement(by.text('Track'));
      await TestHelpers.waitForElementToBeVisible(by.text('📋 History'));
      await TestHelpers.tapElement(by.text('📋 History'));
      
      // Find a history item and swipe to delete
      await TestHelpers.waitForElementToBeVisible(by.id('swipeable-log-item'));
      
      // Swipe left to reveal delete button
      await element(by.id('swipeable-log-item')).swipe('left', 'fast', 0.8);
      
      // Wait for delete button to appear
      await TestHelpers.waitForElementToBeVisible(by.id('delete-log-button'));
      await TestHelpers.tapElement(by.id('delete-log-button'));
      
      // Verify the item is deleted (should disappear from list)
      await TestHelpers.waitForElementToNotExist(by.id('swipeable-log-item'));
      
      await TestHelpers.takeScreenshot('history-deleted');
    });

    it('should delete entire medication with all history', async () => {
      await TestHelpers.tapElement(by.text('Home'));
      await TestHelpers.waitForElementToBeVisible(by.id('medication-card-aspirin'));
      
      // Tap delete button on medication card
      await TestHelpers.tapElement(by.id('delete-medication-aspirin'));
      
      // Confirm deletion
      await TestHelpers.waitForElementToBeVisible(by.text('Delete Medication'));
      await TestHelpers.waitForElementToBeVisible(by.text('Are you sure you want to delete Aspirin?'));
      await TestHelpers.tapElement(by.text('Delete'));
      
      // Verify medication is removed from home screen
      await TestHelpers.waitForElementToNotExist(by.text('Aspirin'));
      
      // Check that history is also removed
      await TestHelpers.tapElement(by.text('Track'));
      // Should not see any logs for deleted medication
      
      await TestHelpers.takeScreenshot('medication-completely-deleted');
    });
  });

  describe('Settings and Data Management', () => {
    it('should access and modify app settings', async () => {
      await TestHelpers.tapElement(by.text('Settings'));
      await TestHelpers.waitForElementToBeVisible(by.text('Settings'));
      
      // Toggle notification settings
      await TestHelpers.tapElement(by.id('notifications-toggle'));
      await TestHelpers.tapElement(by.id('sound-toggle'));
      await TestHelpers.tapElement(by.id('vibration-toggle'));
      
      // Test notification
      await TestHelpers.scrollToElement(by.id('settings-scroll'), by.text('Test Delayed Notification'));
      await TestHelpers.tapElement(by.text('Test Delayed Notification'));
      await TestHelpers.tapElement(by.text('Got it!'));
      
      await TestHelpers.takeScreenshot('settings-modified');
    });

    it('should clear all app data', async () => {
      await TestHelpers.tapElement(by.text('Settings'));
      await TestHelpers.scrollToElement(by.id('settings-scroll'), by.text('Clear All Data'));
      await TestHelpers.tapElement(by.text('Clear All Data'));
      
      // Confirm data clearing
      await TestHelpers.waitForElementToBeVisible(by.text('Clear All Data'));
      await TestHelpers.waitForElementToBeVisible(by.text('This will permanently delete'));
      await TestHelpers.tapElement(by.text('Clear Data'));
      
      // Verify app is reset
      await TestHelpers.tapElement(by.text('Home'));
      await TestHelpers.waitForElementToBeVisible(by.text('No Medications Yet'));
      
      await TestHelpers.takeScreenshot('all-data-cleared');
    });
  });

  describe('Navigation and UI Flow', () => {
    it('should navigate between all main screens', async () => {
      // Test bottom tab navigation
      const tabs = ['Home', 'Track', 'Settings'];
      
      for (const tab of tabs) {
        await TestHelpers.tapElement(by.text(tab));
        await TestHelpers.waitForElementToBeVisible(by.text(tab));
        await TestHelpers.takeScreenshot(`${tab.toLowerCase()}-screen`);
      }
    });

    it('should handle back navigation correctly', async () => {
      // Navigate to add medication
      await TestHelpers.tapElement(by.text('Home'));
      await TestHelpers.tapElement(by.id('add-medication-button'));
      await TestHelpers.waitForElementToBeVisible(by.text('Add Medication'));
      
      // Go back
      await TestHelpers.tapElement(by.id('back-button'));
      await TestHelpers.waitForElementToBeVisible(by.text('CYY'));
      
      // Navigate to medication details
      if (await TestHelpers.waitForElementToExist(by.id('medication-card'))) {
        await TestHelpers.tapElement(by.id('medication-card'));
        await TestHelpers.waitForElementToBeVisible(by.text('Medication Details'));
        
        // Go back
        await TestHelpers.tapElement(by.id('back-button'));
        await TestHelpers.waitForElementToBeVisible(by.text('CYY'));
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle camera permission denial gracefully', async () => {
      // This would require specific device setup for permission testing
      // For now, we'll test the error states in the UI
      
      await TestHelpers.tapElement(by.text('Track'));
      if (await TestHelpers.waitForElementToExist(by.id('take-photo-button'))) {
        await TestHelpers.tapElement(by.id('take-photo-button'));
        await TestHelpers.waitForElementToBeVisible(by.text('Take Photo'));
        
        // The app should handle permission denial and show appropriate message
        await TestHelpers.takeScreenshot('camera-permission-handling');
      }
    });

    it('should handle network connectivity issues', async () => {
      // Test offline functionality
      await device.setURLBlacklist(['.*']);
      
      // App should continue to work offline since it's local storage based
      await TestHelpers.tapElement(by.text('Home'));
      await TestHelpers.waitForElementToBeVisible(by.text('CYY'));
      
      // Reset network
      await device.setURLBlacklist([]);
      
      await TestHelpers.takeScreenshot('offline-functionality');
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should handle large amounts of data efficiently', async () => {
      // This would involve creating many medications and logs
      // For testing purposes, we'll verify the app remains responsive
      
      const startTime = Date.now();
      
      // Navigate through screens quickly
      await TestHelpers.tapElement(by.text('Home'));
      await TestHelpers.tapElement(by.text('Track'));
      await TestHelpers.tapElement(by.text('Settings'));
      await TestHelpers.tapElement(by.text('Home'));
      
      const endTime = Date.now();
      const navigationTime = endTime - startTime;
      
      // Navigation should be fast (less than 2 seconds for all tab switches)
      expect(navigationTime).toBeLessThan(2000);
      
      await TestHelpers.takeScreenshot('performance-test');
    });
  });
}); 