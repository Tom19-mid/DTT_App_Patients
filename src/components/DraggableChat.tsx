import React, { useRef, useState } from 'react';
import {
  Animated, PanResponder, StyleSheet, View, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

// Drop zone center (bottom-center of screen above tab bar)
const DROP_ZONE_Y   = height - 180;
const DROP_ZONE_X   = width / 2;
const DROP_RADIUS   = 70; // px — how close to trigger "near" state

const DraggableChat = () => {
  const [visible, setVisible]     = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const pan       = useRef(new Animated.ValueXY()).current;
  const xScale    = useRef(new Animated.Value(1)).current; // scale for X circle

  const animateXScale = (toValue: number) => {
    Animated.spring(xScale, {
      toValue,
      tension: 120,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
        setIsDragging(true);
      },

      onPanResponderMove: (e, gesture) => {
        // Update pan position
        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(e, gesture);

        // Check distance from drop zone → animate X scale
        const curX = e.nativeEvent.pageX;
        const curY = e.nativeEvent.pageY;
        const dist = Math.sqrt(
          Math.pow(curX - DROP_ZONE_X, 2) + Math.pow(curY - DROP_ZONE_Y, 2)
        );
        animateXScale(dist < DROP_RADIUS ? 1.5 : 1);
      },

      onPanResponderRelease: (e) => {
        pan.flattenOffset();
        setIsDragging(false);
        animateXScale(1);

        const dropY = e.nativeEvent.pageY;
        const dropX = e.nativeEvent.pageX;
        const dist  = Math.sqrt(
          Math.pow(dropX - DROP_ZONE_X, 2) + Math.pow(dropY - DROP_ZONE_Y, 2)
        );

        if (dist < DROP_RADIUS) {
          setVisible(false);
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <>
      {/* X Drop Zone — shown only while dragging */}
      {isDragging && (
        <View style={styles.closeZone}>
          <Animated.View
            style={[
              styles.closeIconBox,
              SHADOWS.card,
              { transform: [{ scale: xScale }] },
            ]}
          >
            <Ionicons name="close" size={28} color="red" />
          </Animated.View>
        </View>
      )}

      {/* Draggable Chat Button */}
      <Animated.View
        style={[
          styles.container,
          { transform: [{ translateX: pan.x }, { translateY: pan.y }] },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.button, SHADOWS.card]}>
          <Ionicons name="chatbubble-ellipses" size={26} color="#fff" />
        </View>
      </Animated.View>
    </>
  );
};

export default DraggableChat;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 185, // above scroll-to-top button (110) + 60px button + 15px gap
    right: 20,
    zIndex: 9999,
  },
  button: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeZone: {
    position: 'absolute',
    bottom: 108,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9998,
  },
  closeIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#FFD0D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
