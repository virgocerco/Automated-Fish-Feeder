import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { getDatabase, ref, set, get } from 'firebase/database';
import { auth } from '../utils/firebaseConfig';
import * as Notifications from 'expo-notifications';
import { Vibration } from 'react-native';

const getPhilippineTime = () => {
  const options = {
    timeZone: 'Asia/Manila',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };
  return new Intl.DateTimeFormat('en-PH', options).format(new Date());
};

const FEEDING_NOTIFICATIONS = [
  "Kumakain na yung isda haha",
  "eyy busog nanaman ung isda",
  "sanaol makakain na",
  "Feeding time alert! 🐠",
  "sarap boss salamat sa pagkain!",
  "nice one busog nnmn!",
  "yun oh kagutom e!",
  "sanaol thank u po",
];

export default function FeedingTime() {
  const [circlePosition, setCirclePosition] = useState(0);
  const positions = [1.5, 20, 39, 58, 77, 90];
  const numbers = Array.from({ length: 6 }, (_, i) => i + 1);

  // Calculate the feeding time based on the initial time and interval
  const calculateFeedingTime = (initialTime: string, interval: number): string => {
    const [initialHours, initialMinutes] = initialTime.split(':').map(Number);
    const now = new Date();
    const initialDate = new Date(now);
    initialDate.setHours(initialHours, initialMinutes, 0, 0);

    // Calculate the feeding time
    const feedingTime = new Date(initialDate.getTime() + interval * 60 * 60 * 1000);

    // Format to 24-hour time
    return feedingTime.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  useEffect(() => {
    const fetchFeedingTime = async () => {
      const db = getDatabase();
      const userId = auth.currentUser?.uid;
      if (userId) {
        const refPath = ref(db, `HISTORY/feedingInterval/interval`);
        try {
          const snapshot = await get(refPath);
          if (snapshot.exists()) {
            const savedValue = snapshot.val();
            const savedIndex = numbers.indexOf(savedValue);
            if (savedIndex !== -1) {
              setCirclePosition(savedIndex);
            }
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };

    fetchFeedingTime();
  }, []);

  useEffect(() => {
    const checkFeedingTime = async () => {
      const db = getDatabase();
      try {
        const timeSnapshot = await get(ref(db, `HISTORY/feedingTime/time`));
        const intervalSnapshot = await get(ref(db, `HISTORY/feedingInterval/interval`));

        if (timeSnapshot.exists() && intervalSnapshot.exists()) {
          const initialTime = timeSnapshot.val(); // e.g., "12:22"
          const interval = intervalSnapshot.val(); // e.g., 1 hour
          const philippineTime = getPhilippineTime(); // Current time in Philippine timezone

          console.log(`Current Philippine Time: ${philippineTime}`);

          const feedingTime = calculateFeedingTime(initialTime, interval);
          console.log(`Feeding Time: ${feedingTime}`);

          // Parse times for comparison
          const [currentHour, currentMinute, currentSecond] = philippineTime.split(':').map(Number);
          const [feedingHour, feedingMinute] = feedingTime.split(':').map(Number);

          // Check if current time matches feeding time at HH:mm:00
          if (
            currentHour === feedingHour &&
            currentMinute === feedingMinute &&
            currentSecond === 0 // Ensure the second is exactly 00
          ) {
            console.log(`Feeding time triggered at: ${philippineTime}`);

            // Trigger notification
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "Feeding Time! 🐠",
                body: FEEDING_NOTIFICATIONS[Math.floor(Math.random() * FEEDING_NOTIFICATIONS.length)],
                sound: true,
              },
              trigger: null,
            });

            // Vibrate
            Vibration.vibrate([500, 500, 500]);
          }
        }
      } catch (error) {
        console.error('Error checking feeding times:', error);
      }
    };

    // Start checking feeding time
    const intervalId = setInterval(checkFeedingTime, 1000);

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);

  const handleSliderClick = async () => {
    const db = getDatabase();
    const userId = auth.currentUser?.uid;
    if (userId) {
      const newPosition = (circlePosition + 1) % 6;
      setCirclePosition(newPosition);

      // Update interval in Firebase
      const intervalRefPath = ref(db, `HISTORY/feedingInterval/interval`);
      await set(intervalRefPath, numbers[newPosition]);

      // Fetch current feeding time and recalculate the feeding time
      const timeSnapshot = await get(ref(db, `HISTORY/feedingTime/time`));
      if (timeSnapshot.exists()) {
        const initialTime = timeSnapshot.val();
        const feedingTime = calculateFeedingTime(initialTime, numbers[newPosition]);

        // Update feeding time in Firebase
        const feedingTimeRef = ref(db, `HISTORY/feedingTime/feedingTime`);
        await set(feedingTimeRef, feedingTime);

        console.log(`Slider updated. New Feeding Time: ${feedingTime}`);
      }
    }
  };

  useEffect(() => {
    console.log(`Selected interval: ${numbers[circlePosition]} hours`);
  }, [circlePosition]);

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderBackground}>
        <Image
          style={{ width: '105%', height: 60, resizeMode: 'stretch' }}
          source={require('../../assets/media/icon/sliderimg.png')}
        />
        <TouchableOpacity
          onPress={handleSliderClick}
          style={[styles.circle, { left: `${positions[circlePosition]}%` }]}>
          <Image
            style={{
              position: 'absolute',
              width: 50,
              height: 50,
              resizeMode: 'contain',
              transform: [{ rotate: '0deg' }],
            }}
            source={require('../../assets/media/icon/slider.png')}
          />
          <Text style={styles.circleText}>{numbers[circlePosition]}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderContainer: {
    width: '80%',
    height: 60,
    position: 'relative',
    alignSelf: 'center',
  },
  sliderBackground: {
    marginTop: 40,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    height: 14,
    borderRadius: 6,
    transform: [{ translateY: -7 }],
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -15 }],
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleText: {
    width: 30,
    textAlign: 'center',
    fontFamily: 'Motley',
    color: 'white',
    fontSize: 26,
    textShadowColor: 'white',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
});
