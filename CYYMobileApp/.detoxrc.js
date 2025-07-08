module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js'
    },
    jest: {
      setupFilesAfterEnv: ['<rootDir>/e2e/init.js']
    }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/CYYMobileApp.app',
      build: 'xcodebuild -workspace ios/CYYMobileApp.xcworkspace -scheme CYYMobileApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/CYYMobileApp.app',
      build: 'xcodebuild -workspace ios/CYYMobileApp.xcworkspace -scheme CYYMobileApp -configuration Release -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug'
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release'
    }
  },
  devices: {
    'ios.simulator': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15'
      }
    },
    'android.emulator': {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_4_API_30'
      }
    }
  },
  configurations: {
    'ios.sim.debug': {
      device: 'ios.simulator',
      app: 'ios.debug'
    },
    'ios.sim.release': {
      device: 'ios.simulator',
      app: 'ios.release'
    },
    'android.emu.debug': {
      device: 'android.emulator',
      app: 'android.debug'
    },
    'android.emu.release': {
      device: 'android.emulator',
      app: 'android.release'
    }
  }
}; 