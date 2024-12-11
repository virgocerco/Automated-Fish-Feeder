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

const calculateNextFeedTime = (initialTime: string, interval: number = 1): string => {
  const [initialHours, initialMinutes] = initialTime.split(':').map(Number);
  const now = new Date();
  const initialDate = new Date(now);
  initialDate.setHours(initialHours, initialMinutes, 0, 0);

  // Calculate next feeding time
  const nextFeedTime = new Date(initialDate.getTime() + interval * 60 * 60 * 1000);

  // Format to 24-hour time
  return nextFeedTime.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
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

  // Function to schedule notifications and set up continuous checking
  useEffect(() => {
    let intervalId;
  
    const checkAndTriggerFeeding = async () => {
      const db = getDatabase();
      try {
        const timeSnapshot = await get(ref(db, `HISTORY/feedingTime/time`));
        const intervalSnapshot = await get(ref(db, `HISTORY/feedingInterval/interval`));
        const nextFeedTimeSnapshot = await get(ref(db, `HISTORY/feedingTime/nextFeedTime`));
    
        if (timeSnapshot.exists() && intervalSnapshot.exists()) {
          const initialTime = timeSnapshot.val(); // e.g., "12:22"
          const interval = intervalSnapshot.val(); // e.g., 1 hour
          const philippineTime = getPhilippineTime(); // Current time in Philippine timezone
    
          console.log(`Current Philippine Time: ${philippineTime}`);
    
          let nextFeedTime;
          if (!nextFeedTimeSnapshot.exists()) {
            // If nextFeedTime is not set, calculate it
            nextFeedTime = calculateNextFeedTime(initialTime, interval);
            await set(ref(db, `HISTORY/feedingTime/nextFeedTime`), nextFeedTime);
          } else {
            // Use the existing next feed time
            nextFeedTime = nextFeedTimeSnapshot.val();
          }
    
          console.log(`Next Feed Time: ${nextFeedTime}`);
    
          // Parse times for comparison
          const [currentHour, currentMinute, currentSecond] = philippineTime.split(':').map(Number);
          const [nextHour, nextMinute] = nextFeedTime.split(':').map(Number);
    
          // Check if current time matches next feed time at HH:mm:00
          if (
            currentHour === nextHour &&
            currentMinute === nextMinute &&
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
    
            // Calculate and store the next feed time
            const newNextFeedTime = calculateNextFeedTime(nextFeedTime, interval);
            await set(ref(db, `HISTORY/feedingTime/nextFeedTime`), newNextFeedTime);
            console.log(`Updated Next Feed Time: ${newNextFeedTime}`);
          }
        }
      } catch (error) {
        console.error('Error checking feeding times:', error);
      }
    };
    
    
    
    // Start the interval for checking feeding times
    intervalId = setInterval(checkAndTriggerFeeding, 1000);
  
    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []); // No dependencies, runs once on mount
  


  
  // Handle slider changes to restart feeding
  const handleSliderClick = async () => {
    const db = getDatabase();
    const userId = auth.currentUser?.uid;
    if (userId) {
      const newPosition = (circlePosition + 1) % 6;
      setCirclePosition(newPosition);
  
      // Update interval in Firebase
      const intervalRefPath = ref(db, `HISTORY/feedingInterval/interval`);
      await set(intervalRefPath, numbers[newPosition]);
  
      // Fetch current feeding time and reset the next feed time
      const timeSnapshot = await get(ref(db, `HISTORY/feedingTime/time`));
      if (timeSnapshot.exists()) {
        const initialTime = timeSnapshot.val();
        const nextFeedTime = calculateNextFeedTime(initialTime, numbers[newPosition]);
  
        // Reset next feed time in Firebase
        const nextFeedTimeRef = ref(db, `HISTORY/feedingTime/nextFeedTime`);
        await set(nextFeedTimeRef, nextFeedTime);
  
        console.log(`Slider updated. New Next Feed Time: ${nextFeedTime}`);
      }
    }
  };
  

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

// Styles remain the same as in the original component
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