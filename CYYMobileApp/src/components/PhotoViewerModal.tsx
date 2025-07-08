import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface PhotoViewerModalProps {
  visible: boolean;
  photoUri: string;
  medicationName: string;
  photoTakenAt?: Date;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const formatPhotoCaption = (date: Date): string => {
  const now = new Date();
  const photoDate = new Date(date);
  const diffInMs = now.getTime() - photoDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // Same day
  if (diffInDays === 0) {
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
  }
  
  // Yesterday
  if (diffInDays === 1) {
    return `Yesterday at ${photoDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // This week (within 7 days)
  if (diffInDays < 7) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[photoDate.getDay()];
    return `${dayName} at ${photoDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Older than a week
  return photoDate.toLocaleDateString() + ' at ' + photoDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  visible,
  photoUri,
  medicationName,
  photoTakenAt,
  onClose,
}) => {
  if (!photoUri) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)']}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Icon name="close" size={28} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Medication Photo</Text>
            <Text style={styles.headerSubtitle}>{medicationName}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </LinearGradient>

        {/* Photo Content */}
        <ScrollView
          style={styles.photoContainer}
          contentContainerStyle={styles.photoContentContainer}
          minimumZoomScale={1}
          maximumZoomScale={3}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={{ uri: photoUri }}
            style={styles.fullPhoto}
            resizeMode="contain"
          />
        </ScrollView>

        {/* Footer with instructions */}
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
          style={styles.footer}
        >
          <Text style={styles.footerText}>
            📷 {photoTakenAt ? formatPhotoCaption(photoTakenAt) : 'Photo taken'}
          </Text>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    width: 44,
  },
  photoContainer: {
    flex: 1,
  },
  photoContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: screenHeight,
  },
  fullPhoto: {
    width: screenWidth,
    height: screenHeight * 0.8,
    maxWidth: screenWidth,
    maxHeight: screenHeight,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginBottom: 5,
  },
  instructionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});