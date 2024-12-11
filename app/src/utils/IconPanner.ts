import { useRef } from 'react';
import { Animated, PanResponder } from 'react-native';

export const useIconPanner = () => {
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

    const dragResistance = 3;
    const elasticity = 10;

  const iconPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gestureState) => {
        Animated.event(
          [
            null, 
            { 
              dx: panX, 
              dy: panY 
            }
          ],
          { useNativeDriver: false }
        )(event, gestureState);
      },
      onPanResponderRelease: () => {
        Animated.spring(panX, {
          toValue: 0,
          friction: dragResistance,
          tension: elasticity,
          useNativeDriver: false
        }).start();
        
        Animated.spring(panY, {
          toValue: 0,
          friction: dragResistance,
          tension: elasticity,
          useNativeDriver: false
        }).start();
      }
    })
  ).current;

  return { 
    panX, 
    panY, 
    iconPanResponder 
  };
};