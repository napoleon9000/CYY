import MockDate from 'mockdate';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Native modules more completely
jest.mock('react-native', () => {
  const React = require('react');
  
  // Create mock components that behave like React components
  const mockComponent = (name) => {
    const Component = React.forwardRef((props, ref) => {
      return React.createElement(name, { ...props, ref });
    });
    Component.displayName = name;
    return Component;
  };

  return {
    Platform: {
      OS: 'ios',
      Version: '14.0',
      select: (obj) => obj.ios || obj.default,
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 414, height: 896 })),
    },
    Alert: {
      alert: jest.fn(),
    },
    Linking: {
      openSettings: jest.fn(),
    },
    StyleSheet: {
      create: (styles) => styles,
      flatten: (styles) => styles,
      absoluteFill: {},
      hairlineWidth: 1,
    },
    // Native components
    View: mockComponent('View'),
    Text: mockComponent('Text'),
    TouchableOpacity: mockComponent('TouchableOpacity'),
    TouchableHighlight: mockComponent('TouchableHighlight'),
    TouchableWithoutFeedback: mockComponent('TouchableWithoutFeedback'),
    ScrollView: mockComponent('ScrollView'),
    FlatList: mockComponent('FlatList'),
    SectionList: mockComponent('SectionList'),
    RefreshControl: mockComponent('RefreshControl'),
    Modal: mockComponent('Modal'),
    Image: mockComponent('Image'),
    TextInput: mockComponent('TextInput'),
    Switch: mockComponent('Switch'),
    ActivityIndicator: mockComponent('ActivityIndicator'),
    Button: mockComponent('Button'),
    StatusBar: mockComponent('StatusBar'),
    SafeAreaView: mockComponent('SafeAreaView'),
    KeyboardAvoidingView: mockComponent('KeyboardAvoidingView'),
    
    Animated: {
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn(() => ({ setValue: jest.fn() })),
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })),
      timing: jest.fn(() => ({ start: jest.fn() })),
      spring: jest.fn(() => ({ start: jest.fn() })),
      View: mockComponent('AnimatedView'),
      Text: mockComponent('AnimatedText'),
      ScrollView: mockComponent('AnimatedScrollView'),
      createAnimatedComponent: (component) => component,
      event: jest.fn(() => jest.fn()),
    },
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      quad: jest.fn(),
      cubic: jest.fn(),
      bezier: jest.fn(),
      in: jest.fn(),
      out: jest.fn(),
      inOut: jest.fn(),
    },
    PermissionsAndroid: {
      request: jest.fn(() => Promise.resolve('granted')),
      check: jest.fn(() => Promise.resolve('granted')),
      PERMISSIONS: {},
      RESULTS: {
        GRANTED: 'granted',
        DENIED: 'denied',
        NEVER_ASK_AGAIN: 'never_ask_again',
      },
    },
    PanResponder: {
      create: jest.fn(() => ({
        panHandlers: {},
      })),
    },
    Keyboard: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    BackHandler: {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  };
});

// Mock Push Notifications
jest.mock('react-native-push-notification', () => ({
  localNotificationSchedule: jest.fn(),
  localNotification: jest.fn(),
  cancelLocalNotification: jest.fn(),
  cancelAllLocalNotifications: jest.fn(),
  getScheduledLocalNotifications: jest.fn((callback) => callback([])),
  configure: jest.fn(),
  requestPermissions: jest.fn(() => Promise.resolve(true)),
  checkPermissions: jest.fn((callback) => callback({ alert: true, badge: true, sound: true })),
}));

// Mock iOS Push Notifications
jest.mock('@react-native-community/push-notification-ios', () => ({
  requestPermissions: jest.fn(() => Promise.resolve(true)),
  checkPermissions: jest.fn(() => Promise.resolve({ alert: true, badge: true, sound: true })),
  getScheduledLocalNotifications: jest.fn((callback) => callback([])),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  })),
  useRoute: jest.fn(() => ({
    params: {},
  })),
  useFocusEffect: jest.fn(),
  NavigationContainer: ({ children }) => children,
}));

// Mock React Navigation Bottom Tabs
jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: jest.fn(() => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  })),
}));

// Mock React Navigation Stack
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: jest.fn(() => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  })),
}));

// Mock Linear Gradient
jest.mock('react-native-linear-gradient', () => 'LinearGradient');

// Mock Vector Icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock React Native Permissions
jest.mock('react-native-permissions', () => ({
  request: jest.fn(() => Promise.resolve('granted')),
  check: jest.fn(() => Promise.resolve('granted')),
  PERMISSIONS: {
    IOS: {
      CAMERA: 'ios.permission.CAMERA',
      PHOTO_LIBRARY: 'ios.permission.PHOTO_LIBRARY',
    },
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
      READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
      WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    BLOCKED: 'blocked',
  },
}));

// Mock Image Picker
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn((options, callback) => {
    callback({
      didCancel: false,
      assets: [{
        uri: 'file://test-image.jpg',
        type: 'image/jpeg',
        fileName: 'test-image.jpg',
      }],
    });
  }),
  launchImageLibrary: jest.fn((options, callback) => {
    callback({
      didCancel: false,
      assets: [{
        uri: 'file://test-image.jpg',
        type: 'image/jpeg',
        fileName: 'test-image.jpg',
      }],
    });
  }),
}));

// Mock Date Picker
jest.mock('react-native-date-picker', () => 'DatePicker');

// Mock Haptic Feedback
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

// Mock Sound
jest.mock('react-native-sound', () => ({
  Sound: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    release: jest.fn(),
  })),
}));

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    View,
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    useDerivedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedScrollHandler: jest.fn(() => jest.fn()),
    withSpring: jest.fn((value) => value),
    withTiming: jest.fn((value) => value),
    runOnJS: jest.fn((fn) => fn),
    interpolate: jest.fn((value) => value),
  };
});

// Mock Safe Area Context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 44, bottom: 34, left: 0, right: 0 })),
  SafeAreaProvider: ({ children }) => children,
}));

// Mock SVG
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Circle: 'Circle',
  Path: 'Path',
  G: 'G',
}));

// Mock Animatable
jest.mock('react-native-animatable', () => ({
  View: 'AnimatableView',
  Text: 'AnimatableText',
}));


// Global test utilities
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch
global.fetch = jest.fn();

// Set up a consistent date for tests
beforeEach(() => {
  MockDate.set('2024-01-15T10:00:00.000Z');
});

afterEach(() => {
  MockDate.reset();
  jest.clearAllMocks();
});

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper'); 