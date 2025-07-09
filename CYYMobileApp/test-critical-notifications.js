// Test script for critical notifications
// This script can be run to test the critical notification functionality

const { 
  checkCriticalNotificationSupport, 
  debugNotificationStatus,
  sendCriticalTestNotification 
} = require('./src/utils/notifications');

// Mock medication for testing
const testMedication = {
  id: 'test-med-123',
  name: 'Test Medication',
  dosage: '10mg',
  reminderTime: '09:00',
  reminderDays: [1, 2, 3, 4, 5],
  notificationTypes: ['notification'],
  isActive: true,
  color: '#FF4757',
  icon: 'pill',
  notes: 'Test medication for critical notifications',
  retryCount: 2,
  criticalNotification: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

async function testCriticalNotifications() {
  console.log('🧪 Testing Critical Notifications...\n');

  try {
    // 1. Check critical notification support
    console.log('1. Checking critical notification support...');
    const support = await checkCriticalNotificationSupport();
    console.log('✅ Support status:', support);
    console.log('');

    // 2. Check overall notification status
    console.log('2. Checking overall notification status...');
    const status = await debugNotificationStatus();
    console.log('✅ Notification status:', status);
    console.log('');

    // 3. Send a test critical notification
    console.log('3. Sending test critical notification...');
    const testResult = await sendCriticalTestNotification(testMedication, 5);
    console.log('✅ Test result:', testResult);
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('');
    console.log('📱 To test on device:');
    console.log('1. Enable Do Not Disturb mode');
    console.log('2. Set device to silent mode');
    console.log('3. Wait 5 seconds for the test notification');
    console.log('4. The notification should appear even with DND enabled');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testCriticalNotifications();
}

module.exports = { testCriticalNotifications };