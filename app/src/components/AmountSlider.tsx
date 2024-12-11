import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { getDatabase, ref, set, get } from 'firebase/database';
import { auth } from '../utils/firebaseConfig';
import * as Notifications from 'expo-notifications';
import { Vibration } from 'react-native';

// Notification messages array
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

export default function AmountSlider() {
  const [circlePosition, setCirclePosition] = useState(0);
  const positions = [1.5, 20, 39, 58, 77, 90];
  const numbers = Array.from({ length: 6 }, (_, i) => i + 1);

  const calculateNextFeedTimes = (initialTime: string, interval: number): string[] => {
    const [initialHours, initialMinutes] = initialTime.split(':').map(Number);
    const now = new Date();
    const initialDate = new Date(now);
    initialDate.setHours(initialHours, initialMinutes, 0, 0);

    const nextFeedTimes: string[] = [];
    let nextFeedTime = new Date(initialDate);

    // If initial time is in the past today, add one interval
    if (nextFeedTime <= now) {
      nextFeedTime.setHours(nextFeedTime.getHours() + interval);
    }

    // Generate next 3 feeding times
    for (let i = 0; i < 3; i++) {
      nextFeedTimes.push(
        nextFeedTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true 
        })
      );
      nextFeedTime.setHours(nextFeedTime.getHours() + interval);
    }

    return nextFeedTimes;
  };


  const handleSliderClick = async () => {
    const db = getDatabase();
    const userId = auth.currentUser?.uid;
    if (userId) {
      const newPosition = (circlePosition + 1) % 6;
      setCirclePosition(newPosition);
      
      // Submit interval to Firebase
      const intervalRefPath = ref(db, `HISTORY/feedingInterval/interval`);
      await set(intervalRefPath, numbers[newPosition]);

      // Fetch current feeding time
      const timeSnapshot = await get(ref(db, `HISTORY/feedingTime/time`));
      if (timeSnapshot.exists()) {
        const initialTime = timeSnapshot.val();
        const nextFeedTimes = calculateNextFeedTimes(initialTime, numbers[newPosition]);
        
        // Store next feed times in Firebase
        const nextFeedTimesRef = ref(db, `HISTORY/feedingTime/nextFeedTimes`);
        await set(nextFeedTimesRef, nextFeedTimes);
      }
    }
  };

  // Fetch the saved value from Firebase when the component mounts
  useEffect(() => {
    const fetchSavedValue = async () => {
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

    fetchSavedValue();
  }, []);

  // // Function to parse time string and convert to Date
  // const parseTimeString = (timeString: string): Date => {
  //   const [hours, minutes] = timeString.split(':').map(Number);
  //   const now = new Date();
  //   now.setHours(hours, minutes, 0, 0);
  //   return now;
  // };


  // Function to schedule notifications and set up continuous checking
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkAndTriggerFeeding = async () => {
      const db = getDatabase();
      try {
        // Fetch initial feeding time and interval
        const timeSnapshot = await get(ref(db, `HISTORY/feedingTime/time`));
        const intervalSnapshot = await get(ref(db, `HISTORY/feedingInterval/interval`));

        if (timeSnapshot.exists() && intervalSnapshot.exists()) {
          const initialTime = timeSnapshot.val(); // e.g., "13:57"
          const interval = intervalSnapshot.val(); // e.g., 1

          // Current time
          const now = new Date();
          const currentHours = now.getHours();
          const currentMinutes = now.getMinutes();
          const currentSeconds = now.getSeconds();

          // Parse initial time
          const [initialHours, initialMinutes] = initialTime.split(':').map(Number);

          // Check if current seconds is 00
          if (currentSeconds === 0) {
            // Calculate possible feeding times based on interval
            const feedingTimes: number[] = [];
            let nextFeedingHour = initialHours;

            // Generate possible feeding times
            while (nextFeedingHour <= 23) {
              feedingTimes.push(nextFeedingHour);
              nextFeedingHour += interval;
            }

            // Check if current time matches any feeding time
            const isMatchingFeedingTime = feedingTimes.some(hour => 
              hour === currentHours && currentMinutes === initialMinutes
            );

            if (isMatchingFeedingTime) {
              console.log(`Feeding time triggered at: ${now.toLocaleString()}`);

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
        }
      } catch (error) {
        console.error('Error checking feeding times:', error);
      }
    };

    // Check every second
    intervalId = setInterval(checkAndTriggerFeeding, 1000);

    // Initial check
    checkAndTriggerFeeding();

    // Cleanup
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);
  // Fetch the saved value from Firebase when the component mounts
  useEffect(() => {
    const fetchSavedValue = async () => {
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

    fetchSavedValue();
  }, []);

  // Log the selected number when circlePosition changes
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

// ... (styles remain the same as in the original component)
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
