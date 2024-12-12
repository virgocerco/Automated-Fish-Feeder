import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Alert,
  Vibration,
} from 'react-native';

// Firebase Realtime Database imports
import { getDatabase, ref, set, get } from 'firebase/database';
import { auth } from '../utils/firebaseConfig';

// Font Loader
import { useFontLoader } from '../utils/fontLoader';

// Define the prop interface
interface TimePickerProps {
  onTimeChange?: (newTime: string) => void;
}

const TIME_VALUES = {
  hours: Array.from({ length: 12 }, (_, i) => (i + 1).toString()),
  minutes: Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')),
  periods: ['AM', 'PM'],
};

const loopIndex = (array: string[], index: number): number => {
  const len = array.length;
  return (index + len) % len;
};

// Convert 12-hour format to 24-hour format string
const convertTo24HourFormat = (hour: string, minute: string, period: string): string => {
  let hourNum = parseInt(hour);
  
  // Convert to 24-hour format
  if (period === 'PM' && hourNum !== 12) {
    hourNum += 12;
  } else if (period === 'AM' && hourNum === 12) {
    hourNum = 0;
  }
  
  // Return time in HH:MM format
  return `${hourNum.toString().padStart(2, '0')}:${minute}`;
};

const TimePicker: React.FC<TimePickerProps> = ({ onTimeChange }) => {
  const [hourIndex, setHourIndex] = useState(0);
  const [minuteIndex, setMinuteIndex] = useState(0);
  const [periodIndex, setPeriodIndex] = useState(0);

  const { fontsLoaded, fontError } = useFontLoader();

  useEffect(() => {
    const fetchSavedTime = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          return;
        }
  
        const db = getDatabase();
        const timeRef = ref(db, `HISTORY/feedingTime/time`);
  
        // Read the saved time
        const timeSnapshot = await get(timeRef);
  
        if (timeSnapshot.exists()) {
          const savedTime = timeSnapshot.val();
          const [savedHour, savedMinute] = savedTime.split(':').map(Number);
  
          // Convert 24-hour format back to 12-hour format
          let displayHour = savedHour;
          let period = 'AM';
  
          if (savedHour >= 12) {
            period = 'PM';
            if (savedHour > 12) {
              displayHour = savedHour - 12;
            }
          }
          if (displayHour === 0) {
            displayHour = 12;
          }
  
          // Set the indexes to match the saved time
          setHourIndex(TIME_VALUES.hours.indexOf(displayHour.toString()));
          setMinuteIndex(TIME_VALUES.minutes.indexOf(savedMinute.toString().padStart(2, '0')));
          setPeriodIndex(TIME_VALUES.periods.indexOf(period));
        } else {
          // Fallback: Set default time if no saved time found
          setHourIndex(0);
          setMinuteIndex(0);
          setPeriodIndex(0); // Default to 1:00 AM
        }
      } catch (error) {
        console.error('Error fetching saved time:', error);
      }
    };
  
    fetchSavedTime();
  }, []);
  
  useEffect(() => {
    const submitTime = async () => {
      try {
        // Get current user
        const user = auth.currentUser;
        if (!user) {
          Alert.alert('Error', 'User not authenticated');
          return;
        }

        // Convert selected time to 24-hour format string
        const timeString = convertTo24HourFormat(
          TIME_VALUES.hours[hourIndex],
          TIME_VALUES.minutes[minuteIndex],
          TIME_VALUES.periods[periodIndex]
        );

        // Get Firebase Realtime Database instance
        const db = getDatabase();

        // Submit time to Firebase Realtime Database
        await set(ref(db, `HISTORY/feedingTime/time`), timeString);
        
        // Update nextFeedTimes with the new time
        await set(ref(db, `HISTORY/feedingTime/nextFeedTime`), timeString);

        // Call onTimeChange callback if provided
        if (onTimeChange) {
          onTimeChange(timeString);
        }

        // Vibrate briefly on successful time submission
        Vibration.vibrate(100);

      } catch (error) {
        console.error('Error submitting time:', error);
        Alert.alert('Error', 'Failed to submit feed time');
      }
    };

    submitTime();
  }, [hourIndex, minuteIndex, periodIndex, onTimeChange]);

  // Rest of the component remains the same as in the original implementation
  const createPanResponder = (
    onSwipeUp: () => void,
    onSwipeDown: () => void
  ) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        if (gestureState.dy < -10) {
          // Swipe Up
          onSwipeUp();
          // Short vibration on swipe up
          Vibration.vibrate(50);
        } else if (gestureState.dy > 10) {
          // Swipe Down
          onSwipeDown();
          // Short vibration on swipe down
          Vibration.vibrate(50);
        }
      },
    });

  const hourResponder = createPanResponder(
    () => setHourIndex((prev) => loopIndex(TIME_VALUES.hours, prev - 1)),
    () => setHourIndex((prev) => loopIndex(TIME_VALUES.hours, prev + 1))
  );

  const minuteResponder = createPanResponder(
    () => setMinuteIndex((prev) => loopIndex(TIME_VALUES.minutes, prev - 1)),
    () => setMinuteIndex((prev) => loopIndex(TIME_VALUES.minutes, prev + 1))
  );

  const periodResponder = createPanResponder(
    () => setPeriodIndex((prev) => loopIndex(TIME_VALUES.periods, prev - 1)),
    () => setPeriodIndex((prev) => loopIndex(TIME_VALUES.periods, prev + 1))
  );

  return (
    <View style={styles.container}>
      <View style={styles.column} {...hourResponder.panHandlers}>
        <Text style={{fontFamily: 'Motley', color: '#0D5C63', fontSize: 60}}>{TIME_VALUES.hours[hourIndex]}</Text>
      </View>
      <Text style={{fontFamily: 'Motley', color: '#0D5C63', fontSize: 40}}>:</Text>
      <View style={styles.column} {...minuteResponder.panHandlers}>
        <Text style={{fontFamily: 'Motley', color: '#0D5C63', fontSize: 60}}>{TIME_VALUES.minutes[minuteIndex]}</Text>
      </View>
      <View style={styles.column} {...periodResponder.panHandlers}>
        <Text style={{fontFamily: 'Motley', color: '#E3655B', fontSize: 60}}>{TIME_VALUES.periods[periodIndex]}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  column: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
});

export default TimePicker;