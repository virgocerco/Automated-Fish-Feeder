// phRealTime.ts
import { rtdb } from './firebaseConfig'; // Import the Firebase Realtime Database instance
import { ref, set } from "firebase/database";

// Function to get Philippine time (24-hour format, without seconds)
export const getPHTime = () => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Manila',
    hour12: false, // 24-hour format
    hour: '2-digit', // 2-digit hour
    minute: '2-digit', // 2-digit minute
  };
  
  // Format the time as HH:MM in 24-hour format
  const timeString = new Intl.DateTimeFormat('en-PH', options).format(new Date());
  
  // timeString should now look like "14:30" for 2:30 PM in 24-hour format
  const [hour, minute] = timeString.split(':'); // Split hour and minute

  return {
    hour: Number(hour),   // Convert hour to number
    minute: Number(minute), // Convert minute to number
  };
};

// Function to post the Philippine time to Firebase Realtime Database
export const postTimeToDatabase = (time: { hour: number; minute: number }) => {
  if (time.hour === undefined || time.minute === undefined) {
    console.error("Invalid time data: ", time);
    return;  // Prevent posting to Firebase if data is invalid
  }

  const timeRef = ref(rtdb, 'HISTORY/philippineTime');
  set(timeRef, {
    hour: time.hour,
    minute: time.minute,
  })
  .then(() => {
    // console.log("Philippine time has been posted successfully!");
  })
  .catch((error) => {
    console.error("Error posting time to Firebase:", error);
  });
};
