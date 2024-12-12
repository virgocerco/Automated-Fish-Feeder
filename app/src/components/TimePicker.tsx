import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Alert,
  Vibration,
} from 'react-native';
import { getDatabase, ref, set, get } from 'firebase/database';
import { auth } from '../utils/firebaseConfig';

const TIME_VALUES = {
  hours: Array.from({ length: 12 }, (_, i) => (i + 1).toString()),
  minutes: Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')),
  periods: ['AM', 'PM'],
};

const loopIndex = (array: any, index: any) => (index + array.length) % array.length;

const convertTo24HourFormat = (hour: any, minute: any, period:any) => {
  let hourNum = parseInt(hour);
  if (period === 'PM' && hourNum !== 12) hourNum += 12;
  else if (period === 'AM' && hourNum === 12) hourNum = 0;
  return `${hourNum.toString().padStart(2, '0')}:${minute}`;
};

const TimePicker = () => {
  const [hourIndex, setHourIndex] = useState(0);
  const [minuteIndex, setMinuteIndex] = useState(0);
  const [periodIndex, setPeriodIndex] = useState(0);

  useEffect(() => {
    const fetchSavedTime = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const db = getDatabase();
        const timeSnapshot = await get(ref(db, `HISTORY/initialTime/initialHours`));

        if (timeSnapshot.exists()) {
          const savedHour = timeSnapshot.val();
          const savedMinute = await get(ref(db, `HISTORY/initialTime/initialMinutes`)).then(snap => snap.val());
          const period = savedHour >= 12 ? 'PM' : 'AM';
          const displayHour = savedHour % 12 || 12;

          setHourIndex(TIME_VALUES.hours.indexOf(displayHour.toString()));
          setMinuteIndex(TIME_VALUES.minutes.indexOf(savedMinute.toString().padStart(2, '0')));
          setPeriodIndex(TIME_VALUES.periods.indexOf(period));
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
        const user = auth.currentUser;
        if (!user) {
          Alert.alert('Error', 'User not authenticated');
          return;
        }
  
        // Convert selected time to 24-hour format
        const timeString = convertTo24HourFormat(
          TIME_VALUES.hours[hourIndex],
          TIME_VALUES.minutes[minuteIndex],
          TIME_VALUES.periods[periodIndex]
        );
  
        const db = getDatabase();
        
        // Parse hours and minutes
        const [hours, minutes] = timeString.split(':').map(Number);
  
        // Save the selected time to initialTime
        await set(ref(db, `HISTORY/initialTime/initialHours`), hours);
        await set(ref(db, `HISTORY/initialTime/initialMinutes`), minutes);
  
        // Fetch the interval
        const intervalSnapshot = await get(ref(db, `HISTORY/feedingInterval/interval`));
        const interval = intervalSnapshot.exists() ? parseInt(intervalSnapshot.val(), 10) : 1;
  
        // Calculate the next feeding time more explicitly
        const nextFeedingTime = new Date(0, 0, 0, hours, minutes);
        nextFeedingTime.setHours(nextFeedingTime.getHours() + interval);
  
        // Save the next feeding time as separate hours and minutes
        await set(ref(db, `HISTORY/nextFeedingTime/nextFeedingHours`), nextFeedingTime.getHours());
        await set(ref(db, `HISTORY/nextFeedingTime/nextFeedingMinutes`), nextFeedingTime.getMinutes());
  
        Vibration.vibrate(100);
      } catch (error) {
        console.error('Error submitting time:', error);
        Alert.alert('Error', 'Failed to submit feed time');
      }
    };
  
    submitTime();
  }, [hourIndex, minuteIndex, periodIndex]);
  
  const createPanResponder = (onSwipeUp: any, onSwipeDown: any) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -10) onSwipeUp();
        else if (gestureState.dy > 10) onSwipeDown();
        Vibration.vibrate(50);
      },
    });

  return (
    <View style={styles.container}>
      <View style={styles.column} {...createPanResponder(
        () => setHourIndex((prev) => loopIndex(TIME_VALUES.hours, prev - 1)),
        () => setHourIndex((prev) => loopIndex(TIME_VALUES.hours, prev + 1))
      ).panHandlers}>
        <Text style={styles.text}>{TIME_VALUES.hours[hourIndex]}</Text>
      </View>
      <Text style={styles.text}>:</Text>
      <View style={styles.column} {...createPanResponder(
        () => setMinuteIndex((prev) => loopIndex(TIME_VALUES.minutes, prev - 1)),
        () => setMinuteIndex((prev) => loopIndex(TIME_VALUES.minutes, prev + 1))
      ).panHandlers}>
        <Text style={styles.text}>{TIME_VALUES.minutes[minuteIndex]}</Text>
      </View>
      <View style={styles.column} {...createPanResponder(
        () => setPeriodIndex((prev) => loopIndex(TIME_VALUES.periods, prev - 1)),
        () => setPeriodIndex((prev) => loopIndex(TIME_VALUES.periods, prev + 1))
      ).panHandlers}>
        <Text style={styles.text}>{TIME_VALUES.periods[periodIndex]}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  column: { alignItems: 'center', marginHorizontal: 10 },
  text: { fontSize: 50, color: '#0D5C63', fontFamily: 'Motley' },
});

export default TimePicker;