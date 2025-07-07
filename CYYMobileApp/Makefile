# CYY Mobile App - Makefile
# React Native Medication Reminder App

.PHONY: help install ios iphone iphone-list iphone-select android clean reset build-ios build-android check-env check-device

# Default target
help:
	@echo "📱 CYY Mobile App - Available Commands"
	@echo ""
	@echo "Setup Commands:"
	@echo "  make install          Install dependencies"
	@echo "  make setup-ios        Setup iOS dependencies (Mac only)"
	@echo "  make setup-android    Setup Android environment"
	@echo ""
	@echo "Development Commands (Simulator-focused):"
	@echo "  make ios              Run on iOS simulator (Debug mode)"
	@echo "  make ios-fast         Run on iOS simulator (Skip clean build)"
	@echo "  make iphone           Run on connected iPhone device (auto-detect)"
	@echo "  make iphone-list      List all connected iOS devices"
	@echo "  make iphone-select    Choose specific iPhone device"
	@echo "  make ios-release      Run on iOS simulator (Release mode)"
	@echo "  make ios-simulator    Choose specific iOS simulator"
	@echo "  make android          Run on Android emulator (Debug mode)"
	@echo "  make android-release  Run on Android emulator (Release mode)"
	@echo "  make start            Start Metro bundler"
	@echo "  make start-clean      Kill existing Metro and start fresh"
	@echo "  make kill-metro       Stop Metro bundler"
	@echo "  make reload           Reload app on all devices"
	@echo ""
	@echo "Debugging Commands (Flipper Integration):"
	@echo "  make debug-ios        Full iOS debugging session (Metro + Flipper + Simulator)"
	@echo "  make debug-android    Full Android debugging session (Metro + Flipper + Emulator)"
	@echo "  make flipper          Open Flipper debugger"
	@echo "  make flipper-install  Install Flipper via Homebrew"
	@echo "  make log-ios          Show iOS device logs"
	@echo "  make log-android      Show Android device logs"
	@echo "  make clear-cache      Clear all caches and restart Metro"
	@echo "  make debug-info       Show debugging information and URLs"
	@echo "  make build-optimize   Optimize iOS build performance"
	@echo "  make update-icons     Optimize and update app icons"
	@echo ""
	@echo "Build Commands:"
	@echo "  make build-ios        Build iOS app for release"
	@echo "  make build-android    Build Android APK"
	@echo "  make archive-ios      Create iOS archive for App Store"
	@echo ""
	@echo "Maintenance Commands:"
	@echo "  make clean            Clean build artifacts"
	@echo "  make reset            Reset node_modules and caches"
	@echo "  make lint             Run linter"
	@echo "  make test             Run tests"
	@echo "  make check-env        Check development environment"
	@echo "  make check-device     Check iOS device setup and certificates"

# Installation and Setup
install:
	@echo "📦 Installing dependencies..."
	npm install
	@echo "✅ Dependencies installed"

setup-ios:
	@echo "🍎 Setting up iOS dependencies..."
	@if ! command -v pod &> /dev/null; then \
		echo "❌ CocoaPods not found. Installing..."; \
		sudo gem install cocoapods; \
	fi
	cd ios && pod install
	@echo "✅ iOS setup complete"

setup-android:
	@echo "🤖 Setting up Android environment..."
	@echo "Please ensure you have:"
	@echo "  - Android Studio installed"
	@echo "  - Android SDK configured"
	@echo "  - ANDROID_HOME environment variable set"
	@echo "  - An Android emulator or physical device connected"

# Development Commands (Simulator-focused for debugging)
start:
	@echo "🚀 Starting Metro bundler..."
	npx react-native start

start-clean:
	@echo "🧹 Cleaning port 8081 and starting Metro..."
	@lsof -ti:8081 | xargs kill -9 2>/dev/null || true
	@pkill -f "react-native start" || true
	@pkill -f "metro" || true
	@sleep 1
	npx react-native start

kill-metro:
	@echo "🛑 Stopping Metro bundler..."
	@lsof -ti:8081 | xargs kill -9 2>/dev/null || true
	@pkill -f "react-native start" || true
	@pkill -f "metro" || true
	@echo "✅ Metro stopped"

# iOS Commands (Simulator-focused for debugging)
ios:
	@echo "🍎 Running on iOS simulator (Debug mode)..."
	npx react-native run-ios --simulator="iPhone 16 Pro"

ios-release:
	@echo "🍎 Running on iOS simulator (Release mode)..."
	npx react-native run-ios --simulator="iPhone 16 Pro" --mode Release

ios-fast:
	@echo "🍎 Running on iOS simulator (Fast incremental build)..."
	@echo "Note: This assumes Metro is already running and previous build exists"
	npx react-native run-ios --simulator="iPhone 16 Pro" --no-packager

iphone:
	@echo "🍎 Running on connected iPhone device..."
	@echo "📱 Checking for connected devices..."
	@if ! xcrun xctrace list devices 2>/dev/null | grep -E "(iPhone|iPad)" | grep -v "Simulator" | grep -v "unavailable" | head -5; then \
		echo "❌ No iOS devices found. Please:"; \
		echo "  1. Connect your iPhone via USB"; \
		echo "  2. Trust this computer on your device"; \
		echo "  3. Ensure Developer Mode is enabled"; \
		echo "  4. Check that your device appears in Xcode"; \
		exit 1; \
	fi
	@echo "🔧 Checking development setup..."
	@if ! security find-identity -p codesigning -v | grep -q "iPhone Developer\|Apple Development"; then \
		echo "⚠️  No valid development certificates found."; \
		echo "   Please configure code signing in Xcode first."; \
	fi
	@echo "🚀 Launching on device..."
	npx react-native run-ios --device

ios-simulator:
	@echo "🍎 Running on specific iOS simulator..."
	@echo "Available simulators:"
	@xcrun simctl list devices | grep -E "(iPhone|iPad)" | grep -v "unavailable"
	@read -p "Enter simulator name (e.g., iPhone 15 Pro): " SIM_NAME; \
	npx react-native run-ios --simulator="$$SIM_NAME"

iphone-list:
	@echo "📱 Connected iOS devices:"
	@xcrun xctrace list devices 2>/dev/null | grep -E "(iPhone|iPad)" | grep -v "Simulator" | grep -v "unavailable" || echo "❌ No devices found"
	@echo ""
	@echo "💡 If no devices appear:"
	@echo "  1. Connect device via USB"
	@echo "  2. Trust this computer on device"
	@echo "  3. Enable Developer Mode in Settings > Privacy & Security"
	@echo "  4. Open Xcode and ensure device appears in Window > Devices"

iphone-select:
	@echo "🍎 Running on specific iPhone device..."
	@echo "📱 Available devices:"
	@xcrun xctrace list devices 2>/dev/null | grep -E "(iPhone|iPad)" | grep -v "Simulator" | grep -v "unavailable" | nl
	@read -p "Enter device name or UDID: " DEVICE_ID; \
	if [[ "$$DEVICE_ID" =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$$ ]]; then \
		npx react-native run-ios --udid="$$DEVICE_ID"; \
	else \
		npx react-native run-ios --device="$$DEVICE_ID"; \
	fi

# Android Commands (Emulator-focused for debugging)
android:
	@echo "🤖 Running on Android emulator (Debug mode)..."
	npx react-native run-android

android-release:
	@echo "🤖 Running on Android emulator (Release mode)..."
	npx react-native run-android --mode=release

android-device:
	@echo "🤖 Running on Android device..."
	adb devices
	npx react-native run-android --device

reload:
	@echo "🔄 Reloading app..."
	npx react-native start --reset-cache

# Build Commands
build-ios:
	@echo "🏗️ Building iOS app for release..."
	cd ios && xcodebuild -workspace CYYMobileApp.xcworkspace -scheme CYYMobileApp -configuration Release -destination 'generic/platform=iOS Simulator' build

build-ios-device:
	@echo "🏗️ Building iOS app for device..."
	cd ios && xcodebuild -workspace CYYMobileApp.xcworkspace -scheme CYYMobileApp -configuration Release -destination 'generic/platform=iOS' build

archive-ios:
	@echo "📦 Creating iOS archive..."
	cd ios && xcodebuild -workspace CYYMobileApp.xcworkspace -scheme CYYMobileApp -configuration Release -destination 'generic/platform=iOS' -archivePath CYYMobileApp.xcarchive archive

export-ios:
	@echo "📤 Exporting iOS app..."
	cd ios && xcodebuild -exportArchive -archivePath CYYMobileApp.xcarchive -exportPath ./build -exportOptionsPlist ExportOptions.plist

build-android:
	@echo "🏗️ Building Android APK..."
	cd android && ./gradlew assembleRelease

build-android-aab:
	@echo "🏗️ Building Android AAB for Play Store..."
	cd android && ./gradlew bundleRelease

# Testing and Quality
lint:
	@echo "🔍 Running linter..."
	npm run lint

test:
	@echo "🧪 Running tests..."
	npm test

# Maintenance Commands
clean:
	@echo "🧹 Cleaning build artifacts..."
	cd ios && xcodebuild clean
	cd android && ./gradlew clean
	npx react-native start --reset-cache
	@echo "✅ Clean complete"

reset:
	@echo "🔄 Resetting project..."
	rm -rf node_modules
	rm -rf ios/Pods
	rm -rf ios/build
	rm -rf android/build
	rm -rf android/.gradle
	npm install
	cd ios && pod install
	@echo "✅ Reset complete"

# iOS Specific Commands
ios-clean:
	@echo "🧹 Cleaning iOS build..."
	cd ios && xcodebuild clean
	rm -rf ios/build
	rm -rf ios/DerivedData

ios-pods-update:
	@echo "📦 Updating iOS pods..."
	cd ios && pod update

# Android Specific Commands
android-clean:
	@echo "🧹 Cleaning Android build..."
	cd android && ./gradlew clean
	rm -rf android/build
	rm -rf android/.gradle

# Debugging Commands (Flipper & Logging)
flipper:
	@echo "🐬 Opening Flipper debugger..."
	@if ! command -v flipper &> /dev/null; then \
		echo "❌ Flipper not found. Download from: https://fbflipper.com/"; \
		echo "💡 Or install via: brew install --cask flipper"; \
		open "https://fbflipper.com/"; \
	else \
		open -a Flipper; \
		echo "✅ Flipper opened. Connect your simulator/device."; \
	fi

flipper-install:
	@echo "🐬 Installing Flipper via Homebrew..."
	brew install --cask flipper

debug-ios:
	@echo "🐛 Starting iOS debugging session with Flipper..."
	@echo "1. Starting Metro bundler..."
	@make start-clean &
	@sleep 3
	@echo "2. Opening Flipper..."
	@make flipper &
	@sleep 2
	@echo "3. Running iOS simulator in debug mode..."
	@make ios

debug-android:
	@echo "🐛 Starting Android debugging session with Flipper..."
	@echo "1. Starting Metro bundler..."
	@make start-clean &
	@sleep 3
	@echo "2. Opening Flipper..."
	@make flipper &
	@sleep 2
	@echo "3. Running Android emulator in debug mode..."
	@make android

log-ios:
	@echo "📱 Showing iOS logs..."
	npx react-native log-ios

log-android:
	@echo "📱 Showing Android logs..."
	npx react-native log-android

log-flipper:
	@echo "🐬 Flipper logs (filtered for CYY app)..."
	@echo "Check Flipper app for detailed logs, or use Console.app on macOS"

# Debug Utils
clear-cache:
	@echo "🧹 Clearing all caches..."
	@make kill-metro
	npx react-native start --reset-cache &
	@sleep 2
	@echo "✅ Cache cleared and Metro restarted"

debug-info:
	@echo "🔍 Debug Information:"
	@echo "📱 Metro bundler: http://localhost:8081"
	@echo "🐬 Flipper: Connect to localhost for simulator debugging"
	@echo "📊 React DevTools: Available in Flipper"
	@echo "💾 AsyncStorage: Browse in Flipper's Databases plugin"
	@echo "🔔 Notifications: Check Flipper's Notifications plugin"
	@echo "📡 Network: Monitor requests in Flipper's Network plugin"

# Development Helpers
simulator-list:
	@echo "📱 Available iOS simulators:"
	xcrun simctl list devices

emulator-list:
	@echo "📱 Available Android emulators:"
	emulator -list-avds

# Build Optimization
build-optimize:
	@echo "🚀 Optimizing iOS build performance..."
	@echo "1. Enabling Xcode build optimization..."
	@defaults write com.apple.dt.Xcode ShowBuildOperationDuration -bool YES
	@echo "2. Setting parallel build threads..."
	@defaults write com.apple.dt.Xcode IDEBuildOperationMaxNumberOfConcurrentCompileTasks 8
	@echo "3. Enabling aggressive optimization..."
	@defaults write com.apple.dt.Xcode IDEBuildOperationMaxNumberOfConcurrentCompileTasks `sysctl -n hw.ncpu`
	@echo "✅ Build optimization complete. Restart Xcode if it's open."

# Setup verification
check-env:
	@echo "🔍 Checking development environment..."
	@echo "Node version: $$(node --version)"
	@echo "npm version: $$(npm --version)"
	@echo "React Native CLI: $$(npx react-native --version)"
	@if command -v pod &> /dev/null; then \
		echo "CocoaPods: $$(pod --version)"; \
	else \
		echo "CocoaPods: Not installed"; \
	fi
	@if [ -n "$$ANDROID_HOME" ]; then \
		echo "Android SDK: $$ANDROID_HOME"; \
	else \
		echo "Android SDK: ANDROID_HOME not set"; \
	fi

check-device:
	@echo "📱 iOS Device Setup Check..."
	@echo ""
	@echo "🔍 Connected Devices:"
	@xcrun xctrace list devices 2>/dev/null | grep -E "(iPhone|iPad)" | grep -v "Simulator" | grep -v "unavailable" || echo "❌ No devices found"
	@echo ""
	@echo "🔑 Code Signing Certificates:"
	@security find-identity -p codesigning -v | grep -E "(iPhone Developer|Apple Development)" || echo "❌ No development certificates found"
	@echo ""
	@echo "📋 Development Team:"
	@if [ -f ios/CYYMobileApp.xcodeproj/project.pbxproj ]; then \
		grep -o 'DEVELOPMENT_TEAM = [^;]*' ios/CYYMobileApp.xcodeproj/project.pbxproj | head -1 || echo "❌ No development team configured"; \
	fi
	@echo ""
	@echo "💡 If device deployment fails:"
	@echo "  1. Open project in Xcode: open ios/CYYMobileApp.xcworkspace"
	@echo "  2. Select your device from the destination menu"
	@echo "  3. Click 'Build and Run' to verify setup"
	@echo "  4. Fix any signing/provisioning issues in Xcode first"

# Icon Management
update-icons:
	@echo "🎨 Optimizing app icons..."
	@if ! command -v magick &> /dev/null; then \
		echo "Installing ImageMagick..."; \
		brew install imagemagick; \
	fi
	@mkdir -p temp_icons
	@echo "Creating optimized icons..."
	@magick assets/icons/icon-1024.png -crop 600x600+212+212 +repage -resize 1024x1024 temp_icons/icon-1024.png
	@cd temp_icons && \
	magick icon-1024.png -resize 180x180 icon-180.png && \
	magick icon-1024.png -resize 120x120 icon-120.png && \
	magick icon-1024.png -resize 87x87 icon-87.png && \
	magick icon-1024.png -resize 80x80 icon-80.png && \
	magick icon-1024.png -resize 60x60 icon-60.png && \
	magick icon-1024.png -resize 58x58 icon-58.png && \
	magick icon-1024.png -resize 40x40 icon-40.png && \
	magick icon-1024.png -resize 29x29 icon-29.png && \
	magick icon-1024.png -resize 20x20 icon-20.png
	@cp temp_icons/icon-*.png assets/icons/
	@cp temp_icons/icon-*.png ios/CYYMobileApp/Images.xcassets/AppIcon.appiconset/
	@rm -rf temp_icons
	@echo "✅ App icons optimized and updated!"

# iOS Signing Configuration
configure-signing:
	@echo "🔧 Configuring iOS signing..."
	@./configure-signing.sh