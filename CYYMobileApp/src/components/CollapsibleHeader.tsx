import React, { useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface CollapsibleHeaderProps {
  colors: string[];
  children: React.ReactNode;
  scrollY: Animated.Value;
  maxHeight?: number;
  minHeight?: number;
}

const CollapsibleHeader: React.FC<CollapsibleHeaderProps> = ({
  colors,
  children,
  scrollY,
  maxHeight = 120,
  minHeight = 60,
}) => {
  const headerHeight = scrollY.interpolate({
    inputRange: [0, maxHeight - minHeight],
    outputRange: [maxHeight, minHeight],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, (maxHeight - minHeight) / 2, maxHeight - minHeight],
    outputRange: [1, 0.7, 0.4],
    extrapolate: 'clamp',
  });

  const contentScale = scrollY.interpolate({
    inputRange: [0, maxHeight - minHeight],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.animatedHeader, { height: headerHeight }]}>
      <LinearGradient
        colors={colors}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradient}
      >
        <Animated.View 
          style={[
            styles.content, 
            { 
              opacity: headerOpacity,
              transform: [{ scale: contentScale }]
            }
          ]}
        >
          {children}
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default CollapsibleHeader;