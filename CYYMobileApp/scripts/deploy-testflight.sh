#!/bin/bash

# CYY Mobile App - TestFlight Deployment Script
# This script guides you through uploading your app to TestFlight

set -e

# Get the project root directory (parent of scripts directory)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}"

echo "🍎 CYY Mobile App - TestFlight Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Step 1: Pre-flight checks
echo "📋 Step 1: Pre-flight Checks"
echo "----------------------------"

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script must be run on macOS for iOS deployment"
    exit 1
fi

# Check Xcode installation
if ! command_exists xcodebuild; then
    print_error "Xcode is not installed. Please install Xcode from the App Store."
    exit 1
fi

# Check if we're in the right directory
if [[ ! -d "ios/CYYMobileApp.xcworkspace" ]]; then
    print_error "Please run this script from the CYYMobileApp root directory"
    exit 1
fi

print_status "Environment checks passed"

# Step 2: Configuration Check
echo ""
echo "⚙️  Step 2: Configuration Check"
echo "------------------------------"

# Check if ExportOptions.plist is configured
if grep -q "REPLACE_WITH_YOUR_TEAM_ID" ios/ExportOptions.plist; then
    print_error "Please configure your Apple Developer Team ID in ios/ExportOptions.plist"
    print_info "Replace 'REPLACE_WITH_YOUR_TEAM_ID' with your actual Team ID"
    print_info "Get your Team ID from: https://developer.apple.com/account/"
    exit 1
fi

if grep -q "REPLACE_WITH_YOUR_BUNDLE_ID" ios/ExportOptions.plist; then
    print_error "Please configure your Bundle ID in ios/ExportOptions.plist"
    print_info "Replace 'REPLACE_WITH_YOUR_BUNDLE_ID' with your actual Bundle ID"
    print_info "Create a Bundle ID at: https://developer.apple.com/account/resources/identifiers/"
    exit 1
fi

print_status "Configuration looks good"

# Step 3: Clean and prepare
echo ""
echo "🧹 Step 3: Clean Build"
echo "--------------------"
echo "Cleaning previous builds..."

# Clean iOS build (ignore if clean action is not configured)
cd ios && (xcodebuild clean -workspace CYYMobileApp.xcworkspace -scheme CYYMobileApp || echo "Clean action not configured, skipping...") && cd ..

# Clean React Native cache
# Kill any existing metro server
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
pkill -f "react-native start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2

# Start metro briefly to reset cache
npx react-native start --reset-cache &
METRO_PID=$!
sleep 3
kill $METRO_PID 2>/dev/null || true

print_status "Clean completed"

# Step 4: Build Archive
echo ""
echo "🏗️  Step 4: Building Archive"
echo "---------------------------"
echo "This may take several minutes..."

echo "Current directory: $(pwd)"
echo "Checking if ios directory exists..."
if [ -d "ios" ]; then
    echo "ios directory found"
    cd ios
    echo "Changed to ios directory: $(pwd)"
else
    echo "ERROR: ios directory not found"
    ls -la
    exit 1
fi

# Check if archive already exists
if [ -d "CYYMobileApp.xcarchive" ]; then
    echo "🔄 Existing archive found. Skipping build step."
    echo "   To rebuild, delete CYYMobileApp.xcarchive and run again."
else
    # Build archive
    echo "🔨 Building new archive..."
    xcodebuild -workspace CYYMobileApp.xcworkspace \
        -scheme CYYMobileApp \
        -configuration Release \
        -destination 'generic/platform=iOS' \
        -archivePath CYYMobileApp.xcarchive \
        archive
fi

if [[ $? -eq 0 ]]; then
    print_status "Archive created successfully"
else
    print_error "Archive failed. Check the build logs above."
    exit 1
fi

# Step 5: Export for App Store
echo ""
echo "📤 Step 5: Exporting for App Store"
echo "----------------------------------"

# Try local export first (without upload)
echo "🔄 Attempting local export first..."
xcodebuild -exportArchive \
    -archivePath CYYMobileApp.xcarchive \
    -exportPath ./build \
    -exportOptionsPlist ExportOptionsLocal.plist

if [[ $? -eq 0 ]]; then
    print_status "Local export completed successfully"
    EXPORT_SUCCESS=true
    
    # Try to upload the exported IPA
    IPA_PATH="./build/CYYMobileApp.ipa"
    if [ -f "$IPA_PATH" ]; then
        echo "📤 Found exported IPA, attempting upload..."
        xcrun altool --upload-app --type ios --file "$IPA_PATH" --username "YOUR_APPLE_ID" --password "@keychain:Application Loader: YOUR_APPLE_ID" 2>/dev/null
        
        if [[ $? -eq 0 ]]; then
            print_status "Upload completed successfully"
        else
            echo "⚠️  Upload failed, but IPA is ready for manual upload"
            echo "   IPA location: $(pwd)/build/CYYMobileApp.ipa"
            echo "   You can upload manually via Xcode or Transporter app"
            EXPORT_SUCCESS=true
        fi
    fi
else
    print_error "Export failed. Check your provisioning profile and certificates."
    exit 1
fi

cd ..

# Step 6: Upload to TestFlight
echo ""
echo "🚀 Step 6: Upload to TestFlight"
echo "------------------------------"

IPA_PATH="ios/build/CYY - Medication Reminder.ipa"

if [[ ! -f "$IPA_PATH" ]]; then
    print_error "IPA file not found at: $IPA_PATH"
    print_info "Check the build output above for the exact filename"
    exit 1
fi

print_info "IPA file ready for upload: $IPA_PATH"
print_info "File size: $(du -h "$IPA_PATH" | cut -f1)"

echo ""
echo "🎯 Upload Options:"
echo "1. Upload via Xcode (Recommended)"
echo "2. Upload via Transporter App"
echo "3. Upload via command line (requires App Store Connect API key)"

echo ""
read -p "Choose upload method (1-3): " upload_choice

case $upload_choice in
    1)
        echo ""
        print_info "Opening Xcode Organizer..."
        open -a Xcode ios/CYYMobileApp.xcarchive
        echo ""
        print_info "In Xcode Organizer:"
        print_info "1. Select your archive"
        print_info "2. Click 'Distribute App'"
        print_info "3. Choose 'App Store Connect'"
        print_info "4. Click 'Upload'"
        ;;
    2)
        echo ""
        print_info "Opening Transporter..."
        if command_exists transporter; then
            open -a Transporter "$IPA_PATH"
        else
            print_warning "Transporter not found. Download from Mac App Store"
            open "https://apps.apple.com/us/app/transporter/id1450874784"
        fi
        echo ""
        print_info "In Transporter:"
        print_info "1. Drag and drop your IPA file"
        print_info "2. Click 'Deliver'"
        ;;
    3)
        echo ""
        print_warning "Command line upload requires App Store Connect API key"
        print_info "If you have an API key configured, you can use:"
        print_info "xcrun altool --upload-app -f \"$IPA_PATH\" -t ios --apiKey YOUR_API_KEY --apiIssuer YOUR_ISSUER_ID"
        ;;
    *)
        print_error "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

# Step 7: Final instructions
echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
print_status "Your app has been prepared for TestFlight!"
echo ""
print_info "Next steps:"
print_info "1. Wait for Apple's processing (usually 5-15 minutes)"
print_info "2. Go to App Store Connect (https://appstoreconnect.apple.com/)"
print_info "3. Navigate to your app → TestFlight"
print_info "4. Add internal or external testers"
print_info "5. Create a test group and invite testers"
echo ""
print_info "Your app will be available for testing once Apple approves it!"
print_info "Internal testers can start testing immediately"
print_info "External testers need Apple's review (usually 24-48 hours)"
echo ""
print_info "TestFlight builds expire after 90 days"
print_info "You can have up to 100 internal testers and 10,000 external testers"
echo ""
print_status "Happy testing! 🚀" 