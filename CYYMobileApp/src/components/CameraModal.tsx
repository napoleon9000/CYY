import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  Linking,
} from 'react-native';
import { 
  ImagePickerResponse, 
  MediaType, 
  ImageLibraryOptions, 
  CameraOptions,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import { 
  request, 
  check, 
  PERMISSIONS, 
  RESULTS, 
  Permission 
} from 'react-native-permissions';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { flipperLog } from '../utils/flipper';

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onPhotoCapture: (photoUri: string) => void;
  medicationName: string;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  visible,
  onClose,
  onPhotoCapture,
  medicationName,
}) => {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCameraPermission = (): Permission => {
    return Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
  };

  const getPhotoLibraryPermission = (): Permission => {
    return Platform.OS === 'ios' ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
  };

  const checkCameraPermission = async (): Promise<boolean> => {
    try {
      const permission = getCameraPermission();
      const result = await check(permission);
      
      flipperLog.info('Camera permission check', { permission, result, platform: Platform.OS });
      
      switch (result) {
        case RESULTS.GRANTED:
          return true;
        case RESULTS.DENIED:
          const requestResult = await requestCameraPermission();
          if (!requestResult) {
            // User denied permission request
            Alert.alert(
              'Camera Permission Required',
              'Camera access is required to take photos of your medication. Please enable camera permission in your device settings to continue.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Open Settings', 
                  onPress: () => Linking.openSettings(),
                },
              ]
            );
          }
          return requestResult;
        case RESULTS.BLOCKED:
          showPermissionBlockedAlert();
          return false;
        case RESULTS.UNAVAILABLE:
          // On iOS, UNAVAILABLE can mean the permission system doesn't recognize camera permission
          // This can happen if the camera capability isn't properly configured
          flipperLog.error('Camera permission unavailable - trying direct camera access', { platform: Platform.OS });
          
          // Try to proceed anyway - sometimes UNAVAILABLE doesn't mean the camera is actually unavailable
          if (Platform.OS === 'ios') {
            flipperLog.info('iOS camera permission unavailable - attempting camera launch anyway');
            return true; // Let the camera launch handle the actual availability
          } else {
            Alert.alert(
              'Camera Not Available',
              'Camera is not available on this device. You can still use the photo library to select existing photos.',
              [{ text: 'OK' }]
            );
            return false;
          }
        default:
          flipperLog.error('Unknown camera permission result', { result });
          return false;
      }
    } catch (error) {
      flipperLog.error('Error checking camera permission', error);
      console.error('Camera permission check error:', error);
      Alert.alert('Error', 'Failed to check camera permission. Please try again.');
      return false;
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      const permission = getCameraPermission();
      const result = await request(permission);
      
      flipperLog.info('Camera permission request', { permission, result });
      
      switch (result) {
        case RESULTS.GRANTED:
          return true;
        case RESULTS.DENIED:
          // User denied the permission request
          return false;
        case RESULTS.BLOCKED:
          // User denied and selected "don't ask again"
          return false;
        case RESULTS.UNAVAILABLE:
          Alert.alert('Error', 'Camera is not available on this device');
          return false;
        default:
          return false;
      }
    } catch (error) {
      flipperLog.error('Error requesting camera permission', error);
      console.error('Camera permission request error:', error);
      Alert.alert('Error', 'Failed to request camera permission. Please try again.');
      return false;
    }
  };

  const showPermissionBlockedAlert = () => {
    Alert.alert(
      'Camera Permission Required',
      'Camera access is required to take photos of your medication. Please enable camera permission in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => Linking.openSettings(),
        },
      ]
    );
  };

  const handleCameraCapture = async () => {
    setIsLoading(true);
    
    try {
      // First try direct camera access without permission check
      // This works better on some iOS devices where permission check returns UNAVAILABLE
      const options: CameraOptions = {
        mediaType: 'photo' as MediaType,
        quality: 0.8,
        includeBase64: false,
        saveToPhotos: false,
        cameraType: 'back',
      };

      flipperLog.info('Attempting camera launch', { platform: Platform.OS });

      launchCamera(options, async (response: ImagePickerResponse) => {
        setIsLoading(false);
        
        if (response.didCancel) {
          flipperLog.info('Camera capture cancelled');
          return;
        }

        if (response.errorMessage) {
          flipperLog.error('Camera capture error', response.errorMessage);
          
          // If we get a permission error, try to handle permissions
          if (response.errorMessage.includes('permission') || 
              response.errorMessage.includes('Permission') ||
              response.errorMessage.includes('denied')) {
            const hasPermission = await checkCameraPermission();
            if (hasPermission) {
              // Try launching camera again after getting permission
              launchCamera(options, (retryResponse: ImagePickerResponse) => {
                if (retryResponse.errorMessage) {
                  Alert.alert('Camera Error', `${retryResponse.errorMessage}`);
                } else if (retryResponse.assets && retryResponse.assets[0]) {
                  const asset = retryResponse.assets[0];
                  if (asset.uri) {
                    flipperLog.info('Photo captured successfully on retry', { uri: asset.uri });
                    setCapturedPhoto(asset.uri);
                  }
                }
              });
            }
            return;
          }
          
          // Handle other camera errors
          if (response.errorMessage.includes('camera unavailable') || 
              response.errorMessage.includes('Camera not available') ||
              response.errorMessage.includes('unavailable')) {
            Alert.alert(
              'Camera Not Available',
              'Camera is not available on this device. You can use "Choose from Gallery" to select an existing photo instead.',
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert('Camera Error', `${response.errorMessage}`);
          }
          return;
        }

        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          if (asset.uri) {
            flipperLog.info('Photo captured successfully', { uri: asset.uri });
            setCapturedPhoto(asset.uri);
          }
        }
      });
    } catch (error) {
      setIsLoading(false);
      flipperLog.error('Camera capture error', error);
      console.error('Camera capture error:', error);
      
      // Fallback: try with permission check
      try {
        const hasPermission = await checkCameraPermission();
        if (!hasPermission) {
          Alert.alert('Error', 'Camera permission is required. You can use "Choose from Gallery" to select an existing photo instead.');
          return;
        }
        // If permission is granted, show a generic error
        Alert.alert('Error', 'Failed to open camera. You can use "Choose from Gallery" to select an existing photo instead.');
      } catch (permError) {
        Alert.alert('Error', 'Failed to access camera. You can use "Choose from Gallery" to select an existing photo instead.');
      }
    }
  };

  const checkPhotoLibraryPermission = async (): Promise<boolean> => {
    try {
      const permission = getPhotoLibraryPermission();
      const result = await check(permission);
      
      flipperLog.info('Photo library permission check', { permission, result, platform: Platform.OS });
      
      switch (result) {
        case RESULTS.GRANTED:
          return true;
        case RESULTS.DENIED:
          const requestResult = await request(permission);
          if (requestResult !== RESULTS.GRANTED) {
            Alert.alert(
              'Photo Library Permission Required',
              'Photo library access is required to select photos of your medications. Please enable photo library permission in your device settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Open Settings', 
                  onPress: () => Linking.openSettings(),
                },
              ]
            );
            return false;
          }
          return true;
        case RESULTS.BLOCKED:
          Alert.alert(
            'Photo Library Permission Required',
            'Photo library access is required to select photos of your medications. Please enable photo library permission in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open Settings', 
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          return false;
        case RESULTS.UNAVAILABLE:
          Alert.alert(
            'Photo Library Not Available',
            'Photo library is not available on this device.',
            [{ text: 'OK' }]
          );
          return false;
        default:
          flipperLog.error('Unknown photo library permission result', { result });
          return false;
      }
    } catch (error) {
      flipperLog.error('Error checking photo library permission', error);
      console.error('Photo library permission check error:', error);
      Alert.alert('Error', 'Failed to check photo library permission. Please try again.');
      return false;
    }
  };

  const handleGallerySelect = async () => {
    setIsLoading(true);

    try {
      const hasPermission = await checkPhotoLibraryPermission();
      if (!hasPermission) {
        setIsLoading(false);
        return;
      }

      const options: ImageLibraryOptions = {
        mediaType: 'photo' as MediaType,
        quality: 0.8,
        includeBase64: false,
        selectionLimit: 1,
      };

      launchImageLibrary(options, (response: ImagePickerResponse) => {
        setIsLoading(false);
        
        if (response.didCancel) {
          flipperLog.info('Gallery selection cancelled');
          return;
        }

        if (response.errorMessage) {
          flipperLog.error('Gallery selection error', response.errorMessage);
          
          if (response.errorMessage.includes('permission') || 
              response.errorMessage.includes('Permission') ||
              response.errorMessage.includes('denied')) {
            Alert.alert(
              'Permission Required',
              'Photo library access is required to select photos. Please enable photo library permission in your device settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Open Settings', 
                  onPress: () => Linking.openSettings(),
                },
              ]
            );
          } else {
            Alert.alert('Error', `Gallery error: ${response.errorMessage}`);
          }
          return;
        }

        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          if (asset.uri) {
            flipperLog.info('Photo selected from gallery', { uri: asset.uri });
            setCapturedPhoto(asset.uri);
          }
        }
      });
    } catch (error) {
      setIsLoading(false);
      flipperLog.error('Gallery selection error', error);
      console.error('Gallery selection error:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      onPhotoCapture(capturedPhoto);
      handleClose();
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
  };

  const handleClose = () => {
    setCapturedPhoto(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#6C5CE7', '#A29BFE']}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Icon name="close" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Medication Photo</Text>
            <Text style={styles.headerSubtitle}>{medicationName}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </LinearGradient>

        {/* Content */}
        <View style={styles.content}>
          {capturedPhoto ? (
            // Photo Preview
            <View style={styles.photoPreviewContainer}>
              <View style={styles.photoContainer}>
                <Image source={{ uri: capturedPhoto }} style={styles.photoPreview} />
              </View>
              
              <Text style={styles.instructionText}>
                Photo captured! Confirm to record your medication as taken.
              </Text>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.retakeButton]}
                  onPress={handleRetakePhoto}
                >
                  <Icon name="refresh" size={20} color="#FF6B6B" />
                  <Text style={[styles.buttonText, styles.retakeButtonText]}>Retake</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.confirmButton]}
                  onPress={handleConfirmPhoto}
                >
                  <Icon name="check" size={20} color="white" />
                  <Text style={[styles.buttonText, styles.confirmButtonText]}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Camera Options
            <View style={styles.cameraOptionsContainer}>
              <View style={styles.iconContainer}>
                <Icon name="camera-alt" size={80} color="#6C5CE7" />
              </View>
              
              <Text style={styles.instructionText}>
                Take a photo of your medication to confirm you've taken it.
              </Text>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cameraButton]}
                  onPress={handleCameraCapture}
                  disabled={isLoading}
                >
                  <Icon name="photo-camera" size={20} color="white" />
                  <Text style={[styles.buttonText, styles.cameraButtonText]}>
                    {isLoading ? 'Opening...' : 'Take Photo'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.galleryButton]}
                  onPress={handleGallerySelect}
                  disabled={isLoading}
                >
                  <Icon name="photo-library" size={20} color="#6C5CE7" />
                  <Text style={[styles.buttonText, styles.galleryButtonText]}>
                    Choose from Gallery
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  closeButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  photoPreviewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoContainer: {
    width: 300,
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 30,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cameraOptionsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cameraButton: {
    backgroundColor: '#6C5CE7',
  },
  galleryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#6C5CE7',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  retakeButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cameraButtonText: {
    color: 'white',
  },
  galleryButtonText: {
    color: '#6C5CE7',
  },
  confirmButtonText: {
    color: 'white',
  },
  retakeButtonText: {
    color: '#FF6B6B',
  },
});