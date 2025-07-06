#!/bin/bash

# CYY Mobile App - Icon Optimization Script
# This script helps optimize app icons by removing excessive padding

echo "🎨 CYY Mobile App Icon Optimization"
echo "=================================="

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    echo "❌ ImageMagick not found. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install imagemagick
    else
        echo "Please install Homebrew first: https://brew.sh"
        exit 1
    fi
fi

# Source and destination directories
SOURCE_DIR="../assets/icons"
IOS_DIR="../ios/CYYMobileApp/Images.xcassets/AppIcon.appiconset"
TEMP_DIR="./temp_icons"

echo "📁 Creating temporary directory..."
mkdir -p "$TEMP_DIR"

# Function to create optimized icon with proper padding
optimize_icon() {
    local input_file="$1"
    local output_file="$2"
    local size="$3"
    
    echo "🖼️  Processing: $output_file ($size x $size)"
    
    # Create optimized icon with minimal padding (90% fill)
    magick "$input_file" \
        -background transparent \
        -gravity center \
        -extent "${size}x${size}" \
        -resize "$(echo "$size * 0.9" | bc | cut -d. -f1)x$(echo "$size * 0.9" | bc | cut -d. -f1)" \
        -gravity center \
        -extent "${size}x${size}" \
        "$output_file"
}

# Base icon (use the 1024px version as source)
BASE_ICON="$SOURCE_DIR/icon-1024.png"

if [ ! -f "$BASE_ICON" ]; then
    echo "❌ Base icon not found: $BASE_ICON"
    exit 1
fi

echo "🚀 Optimizing iOS app icons..."

# Generate all required iOS icon sizes
optimize_icon "$BASE_ICON" "$TEMP_DIR/icon-20.png" 20
optimize_icon "$BASE_ICON" "$TEMP_DIR/icon-29.png" 29
optimize_icon "$BASE_ICON" "$TEMP_DIR/icon-40.png" 40
optimize_icon "$BASE_ICON" "$TEMP_DIR/icon-58.png" 58
optimize_icon "$BASE_ICON" "$TEMP_DIR/icon-60.png" 60
optimize_icon "$BASE_ICON" "$TEMP_DIR/icon-80.png" 80
optimize_icon "$BASE_ICON" "$TEMP_DIR/icon-87.png" 87
optimize_icon "$BASE_ICON" "$TEMP_DIR/icon-120.png" 120
optimize_icon "$BASE_ICON" "$TEMP_DIR/icon-180.png" 180
optimize_icon "$BASE_ICON" "$TEMP_DIR/icon-1024.png" 1024

echo "📱 Copying optimized icons to iOS app..."

# Copy optimized icons to iOS project
cp "$TEMP_DIR"/*.png "$IOS_DIR/"

# Also update the assets/icons directory
cp "$TEMP_DIR"/*.png "$SOURCE_DIR/"

echo "🧹 Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

echo "✅ Icon optimization complete!"
echo ""
echo "📋 Next steps:"
echo "1. Open Xcode: open ios/CYYMobileApp.xcworkspace"
echo "2. Check Images.xcassets/AppIcon.appiconset to verify icons"
echo "3. Build and test the app: make ios"
echo ""
echo "🎉 Your app icons now have optimal padding!"