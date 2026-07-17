import React, { useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, TouchableOpacity, View, Dimensions, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const DraggableChat = () => {
  const [visible, setVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;

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
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gesture) => {
        pan.flattenOffset();
        setIsDragging(false);

        // Drop zone is bottom center (close to the tab bar)
        const dropZoneY = height - 200; // bottom 200px
        const dropZoneXMin = width / 2 - 60;
        const dropZoneXMax = width / 2 + 60;

        const dropY = e.nativeEvent.pageY;
        const dropX = e.nativeEvent.pageX;

        if (dropY > dropZoneY && dropX > dropZoneXMin && dropX < dropZoneXMax) {
          setVisible(false); // Dismiss
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <>
      {isDragging && (
        <View style={styles.closeZone}>
          <View style={[styles.closeIconBox, SHADOWS.card]}>
            <Ionicons name="close" size={32} color="red" />
          </View>
        </View>
      )}
      <Animated.View
        style={[
          styles.container,
          { transform: [{ translateX: pan.x }, { translateY: pan.y }] }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity activeOpacity={0.8} style={[styles.button, SHADOWS.card]}>
          <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 110, // above tab bar (60) + offset (20) + clearance (30)
    right: 20,
    zIndex: 9999,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeZone: {
    position: 'absolute',
    bottom: 110, // above tab bar as well
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9998,
  },
  closeIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  }
});

export default DraggableChat;
