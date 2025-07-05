#!/bin/bash

# CYY Mobile App - iOS Signing Configuration Script
# This script automatically configures the development team for iOS signing

echo "🔧 Configuring iOS signing settings..."

# Get the development team ID from the available certificates
TEAM_ID=$(security find-identity -v -p codesigning | grep "Apple Development" | head -1 | sed 's/.*(\([A-Z0-9]*\)).*/\1/')

if [ -z "$TEAM_ID" ]; then
    echo "❌ No development team found. Please ensure you have a valid Apple Developer account and certificate."
    exit 1
fi

echo "✅ Found development team: $TEAM_ID"

# Update the project.pbxproj file to include the development team
PROJECT_FILE="ios/CYYMobileApp.xcodeproj/project.pbxproj"

# Add DEVELOPMENT_TEAM and CODE_SIGN_STYLE to Debug configuration
sed -i '' '/13B07F941A680F5B00A75B9A \/\* Debug \*\//,/};/ {
    /DEVELOPMENT_TEAM/d
    /CODE_SIGN_STYLE/d
    /PRODUCT_NAME = CYYMobileApp;/a\
				DEVELOPMENT_TEAM = '"$TEAM_ID"';
				CODE_SIGN_STYLE = Automatic;
}' "$PROJECT_FILE"

# Add DEVELOPMENT_TEAM and CODE_SIGN_STYLE to Release configuration
sed -i '' '/13B07F951A680F5B00A75B9A \/\* Release \*\//,/};/ {
    /DEVELOPMENT_TEAM/d
    /CODE_SIGN_STYLE/d
    /PRODUCT_NAME = CYYMobileApp;/a\
				DEVELOPMENT_TEAM = '"$TEAM_ID"';
				CODE_SIGN_STYLE = Automatic;
}' "$PROJECT_FILE"

# Update bundle identifier to use a more standard format
sed -i '' 's/org\.reactjs\.native\.example\.CYYMobileApp/com.cyy.mobileapp/g' "$PROJECT_FILE"

echo "✅ Development team configured successfully!"
echo "🎯 Team ID: $TEAM_ID"
echo "📦 Bundle ID: com.cyy.mobileapp"
echo ""
echo "You can now run: make ios" 