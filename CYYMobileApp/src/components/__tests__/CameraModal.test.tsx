import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { request, check, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { CameraModal } from '../CameraModal';

// Mock dependencies
jest.mock('react-native-image-picker');
jest.mock('react-native-permissions');

const mockLaunchCamera = launchCamera as jest.MockedFunction<typeof launchCamera>;
const mockLaunchImageLibrary = launchImageLibrary as jest.MockedFunction<typeof launchImageLibrary>;
const mockRequest = request as jest.MockedFunction<typeof request>;
const mockCheck = check as jest.MockedFunction<typeof check>;
const mockAlert = jest.mocked(Alert.alert);

describe('CameraModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onPhotoCapture: jest.fn(),
    medicationName: 'Test Medication',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when visible', () => {
    const { getByText } = render(<CameraModal {...defaultProps} />);
    
    expect(getByText('Medication Photo')).toBeTruthy();
    expect(getByText('Test Medication')).toBeTruthy();
    expect(getByText('Take a photo of your medication to confirm you\'ve taken it.')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(<CameraModal {...defaultProps} visible={false} />);
    
    expect(queryByText('Medication Photo')).toBeNull();
  });

  it('should call onClose when cancel button is pressed', () => {
    const mockOnClose = jest.fn();
    const { getByText } = render(<CameraModal {...defaultProps} onClose={mockOnClose} />);
    
    fireEvent.press(getByText('Cancel'));
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  describe('Camera Permission Handling', () => {
    it('should request permission if not granted', async () => {
      mockCheck.mockResolvedValue(RESULTS.DENIED);
      mockRequest.mockResolvedValue(RESULTS.GRANTED);
      mockLaunchCamera.mockImplementation((options, callback) => {
        if (callback) {
          callback({
            didCancel: false,
            assets: [{ uri: 'file://test-image.jpg' }],
          } as any);
        }
      });

      const { getByTestId } = render(<CameraModal {...defaultProps} />);
      
      fireEvent.press(getByTestId('camera-button'));
      
      await waitFor(() => {
        expect(mockCheck).toHaveBeenCalledWith(PERMISSIONS.IOS.CAMERA);
        expect(mockRequest).toHaveBeenCalledWith(PERMISSIONS.IOS.CAMERA);
      });
    });

    it('should show alert when permission is denied', async () => {
      mockCheck.mockResolvedValue(RESULTS.DENIED);
      mockRequest.mockResolvedValue(RESULTS.DENIED);

      const { getByTestId } = render(<CameraModal {...defaultProps} />);
      
      fireEvent.press(getByTestId('camera-button'));
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Camera Permission Required',
          expect.stringContaining('camera permission'),
          expect.arrayContaining([
            expect.objectContaining({ text: 'Cancel' }),
            expect.objectContaining({ text: 'Open Settings' }),
          ])
        );
      });
    });

    it('should handle blocked permission', async () => {
      mockCheck.mockResolvedValue(RESULTS.BLOCKED);

      const { getByTestId } = render(<CameraModal {...defaultProps} />);
      
      fireEvent.press(getByTestId('camera-button'));
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Camera Permission Required',
          expect.stringContaining('camera permission'),
          expect.arrayContaining([
            expect.objectContaining({ text: 'Cancel' }),
            expect.objectContaining({ text: 'Open Settings' }),
          ])
        );
      });
    });
  });

  describe('Camera Functionality', () => {
    beforeEach(() => {
      mockCheck.mockResolvedValue(RESULTS.GRANTED);
    });

    it('should launch camera when camera button is pressed', async () => {
      const mockOnPhotoCapture = jest.fn();
      mockLaunchCamera.mockImplementation((options, callback) => {
        if (callback) {
          callback({
            didCancel: false,
            assets: [{ uri: 'file://test-image.jpg' }],
          } as any);
        }
      });

      const { getByTestId } = render(
        <CameraModal {...defaultProps} onPhotoCapture={mockOnPhotoCapture} />
      );
      
      fireEvent.press(getByTestId('camera-button'));
      
      await waitFor(() => {
        expect(mockLaunchCamera).toHaveBeenCalledWith(
          expect.objectContaining({
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 1024,
            maxHeight: 1024,
          }),
          expect.any(Function)
        );
        expect(mockOnPhotoCapture).toHaveBeenCalledWith('file://test-image.jpg');
      });
    });

    it('should launch image library when gallery button is pressed', async () => {
      const mockOnPhotoCapture = jest.fn();
      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        if (callback) {
          callback({
            didCancel: false,
            assets: [{ uri: 'file://gallery-image.jpg' }],
          } as any);
        }
      });

      const { getByTestId } = render(
        <CameraModal {...defaultProps} onPhotoCapture={mockOnPhotoCapture} />
      );
      
      fireEvent.press(getByTestId('gallery-button'));
      
      await waitFor(() => {
        expect(mockLaunchImageLibrary).toHaveBeenCalledWith(
          expect.objectContaining({
            mediaType: 'photo',
            quality: 0.8,
          }),
          expect.any(Function)
        );
        expect(mockOnPhotoCapture).toHaveBeenCalledWith('file://gallery-image.jpg');
      });
    });

    it('should handle user cancellation', async () => {
      const mockOnPhotoCapture = jest.fn();
      mockLaunchCamera.mockImplementation((options, callback) => {
        if (callback) {
          callback({
            didCancel: true,
          } as any);
        }
      });

      const { getByTestId } = render(
        <CameraModal {...defaultProps} onPhotoCapture={mockOnPhotoCapture} />
      );
      
      fireEvent.press(getByTestId('camera-button'));
      
      await waitFor(() => {
        expect(mockOnPhotoCapture).not.toHaveBeenCalled();
      });
    });

    it('should handle camera errors', async () => {
      mockLaunchCamera.mockImplementation((options, callback) => {
        if (callback) {
          callback({
            didCancel: false,
            errorMessage: 'Camera error',
          } as any);
        }
      });

      const { getByTestId } = render(<CameraModal {...defaultProps} />);
      
      fireEvent.press(getByTestId('camera-button'));
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Camera Error',
          'Camera error',
          [{ text: 'OK' }]
        );
      });
    });

    it('should handle missing assets', async () => {
      mockLaunchCamera.mockImplementation((options, callback) => {
        if (callback) {
          callback({
            didCancel: false,
            assets: [],
          } as any);
        }
      });

      const { getByTestId } = render(<CameraModal {...defaultProps} />);
      
      fireEvent.press(getByTestId('camera-button'));
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'No Image Selected',
          'Please try again or select an image from your gallery.',
          [{ text: 'OK' }]
        );
      });
    });
  });

  describe('UI Elements', () => {
    it('should display medication name correctly', () => {
      const { getByText } = render(
        <CameraModal {...defaultProps} medicationName="Aspirin 81mg" />
      );
      
      expect(getByText('Aspirin 81mg')).toBeTruthy();
    });

    it('should have correct button texts', () => {
      const { getByText, getByTestId } = render(<CameraModal {...defaultProps} />);
      
      expect(getByText('📷')).toBeTruthy(); // Camera emoji
      expect(getByText('Take Photo')).toBeTruthy();
      expect(getByText('🖼️')).toBeTruthy(); // Gallery emoji
      expect(getByText('Choose from Gallery')).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
    });

    it('should apply correct accessibility labels', () => {
      const { getByTestId } = render(<CameraModal {...defaultProps} />);
      
      expect(getByTestId('camera-button')).toBeTruthy();
      expect(getByTestId('gallery-button')).toBeTruthy();
    });
  });

  describe('Platform-specific behavior', () => {
    it('should use iOS permissions on iOS', async () => {
      mockCheck.mockResolvedValue(RESULTS.DENIED);
      mockRequest.mockResolvedValue(RESULTS.GRANTED);

      const { getByTestId } = render(<CameraModal {...defaultProps} />);
      
      fireEvent.press(getByTestId('camera-button'));
      
      await waitFor(() => {
        expect(mockCheck).toHaveBeenCalledWith(PERMISSIONS.IOS.CAMERA);
        expect(mockRequest).toHaveBeenCalledWith(PERMISSIONS.IOS.CAMERA);
      });
    });

    // Note: Android test would be similar but with PERMISSIONS.ANDROID.CAMERA
  });

  describe('Error Handling', () => {
    it('should handle permission check errors', async () => {
      mockCheck.mockRejectedValue(new Error('Permission check failed'));

      const { getByTestId } = render(<CameraModal {...defaultProps} />);
      
      fireEvent.press(getByTestId('camera-button'));
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Error',
          'Failed to check camera permission: Permission check failed',
          [{ text: 'OK' }]
        );
      });
    });

    it('should handle camera launch errors', async () => {
      mockCheck.mockResolvedValue(RESULTS.GRANTED);
      mockLaunchCamera.mockImplementation(() => {
        throw new Error('Camera launch failed');
      });

      const { getByTestId } = render(<CameraModal {...defaultProps} />);
      
      fireEvent.press(getByTestId('camera-button'));
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Error',
          'Failed to open camera: Camera launch failed',
          [{ text: 'OK' }]
        );
      });
    });
  });
}); 