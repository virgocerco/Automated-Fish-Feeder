import * as Notifications from 'expo-notifications';
import { Vibration, Platform } from 'react-native';
import { getDatabase, ref, set } from 'firebase/database';

// Configure notifications with more robust handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Array of random Tagalog notification messages
const FEEDING_MESSAGES = [
  "Makakain na rin sa wakas! 🐟",
  "Pucha, isda kakain na! 🍽️",
  "Sarap ng pagkain sana di mamatay 😂",
  "Time to feast, mga isda! 🐠",
  "Kumusta ka, mga gutom na isda? 🎣",
  "Dinner time, fish squad! 🐡",
  "Hay naku, finally kakain ka! 🍲",
  "Gutom na ang mga isda, sige! 🌊",
  "Kain na tayo, mga bradpren! 🐠",
  "Pagkain na, wag makulit! 😄",
  "Mabuti ka pa, may pagkain ka! 🍴",
  "Salamat sa pagpapakain! 🐟",
  "Wow, libre! Kain na ang mga isda! 🌟",
  "Ang sarap! Kakain na naman! 🍽️",
  "Uy, may pagkain na! 🐠"
];

export const requestNotificationPermissions = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowSound: true,
          allowBadge: false,
        },
      });
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

export const calculateNextFeedTime = (currentTime: string, interval: number): string => {
  // Parse the current time
  const [hours, minutes] = currentTime.split(':').map(Number);
  
  // Calculate the next feed time by adding the interval
  let nextHours = hours + interval;
  
  // Handle hour rollover (24-hour format)
  nextHours = nextHours % 24;
  
  // Format the next feed time
  return `${nextHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const monitorFeedingTime = (
    initialFeedTime: string, 
    interval: number, 
    onFeedCallback?: (nextFeedTime: string) => void
  ) => {
    console.log(`🕒 Started Continuous Monitoring - Initial Feed Time: ${initialFeedTime}, Interval: ${interval}`);
  
    let currentFeedTime = initialFeedTime;
  
    const updateNextFeedingTimeInDatabase = (nextTime: string) => {
      const db = getDatabase();
      const [hours, minutes] = nextTime.split(':').map(Number);
      
      try {
        const nextFeedingTimeRef = ref(db, 'HISTORY/nextFeedingTime');
        set(nextFeedingTimeRef, {
          nextFeedingHours: hours,
          nextFeedingMinutes: minutes
        });
        console.log(`🔄 Updated Next Feeding Time in Database: ${nextTime}`);
      } catch (error) {
        console.error('Error updating next feeding time in database:', error);
      }
    };
  
    const intervalId = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentSeconds = now.getSeconds();
  
      // Parse the current feed time
      const [feedHours, feedMinutes] = currentFeedTime.split(':').map(Number);
  
      // Detailed logging every second
      const currentTimeStr = `${String(currentHours).padStart(2, "0")}:${String(currentMinutes).padStart(2, "0")}:${String(currentSeconds).padStart(2, "0")}`;
      const targetTimeStr = `${String(feedHours).padStart(2, "0")}:${String(feedMinutes).padStart(2, "0")}:00`;
  
      console.log(`⏰ [Monitoring] Current: ${currentTimeStr} --- Target: ${targetTimeStr}`);
  
      // Precise time matching
      if (currentHours === feedHours && currentMinutes === feedMinutes && currentSeconds === 0) {
        console.log("🐠 FISH FEED! 🐠");
        console.log(`🕒 Exact Feeding Time Matched: ${currentTimeStr}`);
  
        // Select a random message from the array
        const randomMessage = FEEDING_MESSAGES[Math.floor(Math.random() * FEEDING_MESSAGES.length)];
  
        // Send Expo Notification
        Notifications.scheduleNotificationAsync({
          content: {
            title: "🐟 Feeding Time!",
            body: randomMessage,
            sound: true,
            priority: Platform.OS === 'android' 
              ? Notifications.AndroidNotificationPriority.HIGH 
              : undefined,
          },
          trigger: null, // Immediate notification
        });
  
        // Vibration pattern
        Vibration.vibrate([1000, 1000, 1000]);
  
        // Calculate the next feed time
        const nextFeedTime = calculateNextFeedTime(currentFeedTime, interval);
        currentFeedTime = nextFeedTime;
  
        // Update next feeding time in database
        updateNextFeedingTimeInDatabase(nextFeedTime);
  
        // Optional callback to notify about the next feed time
        if (onFeedCallback) {
          onFeedCallback(nextFeedTime);
        }
      }
    }, 1000); // Check every second
  
    return {
      intervalId,
      getCurrentFeedTime: () => currentFeedTime
    };
  };