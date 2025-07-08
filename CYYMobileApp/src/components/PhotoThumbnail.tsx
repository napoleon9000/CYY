import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface PhotoThumbnailProps {
  photoUri: string;
  size?: number;
  onPress: () => void;
}

export const PhotoThumbnail: React.FC<PhotoThumbnailProps> = ({
  photoUri,
  size = 40,
  onPress,
}) => {
  if (!photoUri) return null;

  return (
    <TouchableOpacity
      style={[styles.container, { width: size, height: size }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: photoUri }}
        style={[styles.thumbnail, { width: size, height: size }]}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <Icon name="photo" size={size * 0.4} color="rgba(255, 255, 255, 0.9)" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbnail: {
    borderRadius: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
});