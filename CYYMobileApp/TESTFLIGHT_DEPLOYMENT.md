# 🚀 TestFlight Deployment Guide

## Quick Start

Your CYY Mobile App is ready for TestFlight! Follow these steps to upload your app for testing.

### Prerequisites ✅

1. **Apple Developer Account** ($99/year)
   - Sign up at [developer.apple.com](https://developer.apple.com)
   - Complete enrollment and payment

2. **Xcode** with valid certificates
   - Install from Mac App Store
   - Sign in with your Apple ID in Xcode → Preferences → Accounts

### Step-by-Step Deployment

#### 1. Configure Apple Developer Settings

1. **Get your Team ID**:
   - Go to [Apple Developer Console](https://developer.apple.com/account/)
   - Your Team ID is displayed in the top-right corner (10 characters)

2. **Create Bundle ID**:
   - Go to "Certificates, Identifiers & Profiles"
   - Create identifier: `com.yourcompany.cyymobileapp`
   - Enable: Push Notifications, Camera, Photo Library

3. **Update ExportOptions.plist**:
   ```bash
   # Edit ios/ExportOptions.plist
   # Replace REPLACE_WITH_YOUR_TEAM_ID with your actual Team ID
   # Replace REPLACE_WITH_YOUR_BUNDLE_ID with your Bundle ID
   ```

#### 2. Run the Deployment Script

```bash
# From the CYYMobileApp directory
make deploy-testflight
```

The script will:
- ✅ Check your environment
- ✅ Validate configuration
- ✅ Clean and build your app
- ✅ Create an archive
- ✅ Export for App Store
- ✅ Guide you through upload

#### 3. Upload to TestFlight

**Option A: Xcode Organizer (Recommended)**
1. Script will open Xcode Organizer
2. Select your archive
3. Click "Distribute App"
4. Choose "App Store Connect"
5. Click "Upload"

**Option B: Transporter App**
1. Download Transporter from Mac App Store
2. Drag your IPA file into Transporter
3. Click "Deliver"

#### 4. Configure TestFlight Testing

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Navigate to your app → TestFlight
3. Wait for processing (5-15 minutes)
4. Add testers:
   - **Internal**: Up to 100 testers (immediate access)
   - **External**: Up to 10,000 testers (requires Apple review)

### Manual Commands (Alternative)

If you prefer manual control:

```bash
# Clean build
make clean

# Create archive
make archive-ios

# Export for App Store
make export-ios

# Upload via Xcode
open ios/CYYMobileApp.xcarchive
```

### Troubleshooting

**Common Issues:**

1. **"No matching provisioning profiles found"**
   - Open Xcode → Preferences → Accounts
   - Download Manual Profiles
   - Or use Automatic Signing

2. **"Invalid Bundle ID"**
   - Ensure Bundle ID matches your Apple Developer Console
   - Check spelling and format

3. **"Code signing failed"**
   - Verify certificates in Keychain Access
   - Check Team ID is correct

4. **"Archive failed"**
   - Clean build: `make clean`
   - Update CocoaPods: `cd ios && pod update`
   - Check iOS deployment target compatibility

### TestFlight Features

- 📱 **90-day expiration** for builds
- 👥 **100 internal testers** (immediate access)
- 🌍 **10,000 external testers** (requires Apple review)
- 📊 **Crash reporting** and analytics
- 💬 **Feedback collection** from testers
- 🔄 **Automatic updates** when new builds are available

### App Store Connect Setup

1. **App Information**:
   - App Name: "CYY - Medication Reminder"
   - Category: Medical
   - Content Rating: 4+ (for medical apps)

2. **App Store Assets**:
   - App Icon: 1024x1024 (already included)
   - Screenshots: Required for App Store submission
   - App Preview: Optional video demo

3. **App Privacy**:
   - Data collection: None (local storage only)
   - Camera usage: Photo evidence for medications
   - Notifications: Medication reminders

### Next Steps After TestFlight

1. **Gather feedback** from testers
2. **Fix any issues** reported
3. **Submit for App Store review** when ready
4. **Monitor crash reports** and user feedback

### Support

- **Apple Developer Support**: [developer.apple.com/support](https://developer.apple.com/support)
- **App Store Connect Help**: [help.apple.com/app-store-connect](https://help.apple.com/app-store-connect)
- **TestFlight Documentation**: [developer.apple.com/testflight](https://developer.apple.com/testflight)

---

**🎉 Your medication reminder app is ready to help users manage their health!** 