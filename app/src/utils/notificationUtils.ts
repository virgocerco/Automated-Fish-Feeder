import { rtdb } from './firebaseConfig';
import { ref, get, push, update, serverTimestamp } from 'firebase/database';

export const addFeedHistoryFromHistory = async (feedingTime: string, interval: number) => {
  try {
    const [hours, minutes] = feedingTime.split(":").map(Number);
    const nextFeedingHours = (hours + interval) % 24;
    const nextFeedingTime = `${String(nextFeedingHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;

    const feedHistoryRef = ref(rtdb, '/FEED-HISTORY');
    const newFeedRef = push(feedHistoryRef);
    await update(newFeedRef, {
      time: feedingTime,
      interval,
      timestamp: serverTimestamp(),
    });

    console.log('✅ Feeding history added:', {
      feedingTime,
      interval,
      nextFeedingTime,
    });

    return nextFeedingTime;
  } catch (error) {
    console.error('❌ Error adding to FEED-HISTORY:', error);
    throw error;
  }
};

export const monitorFeedingTime = (feedingTime: string, interval: number, onTrigger: () => void) => {
  console.log(`🕒 Started Monitoring - Feeding Time: ${feedingTime}, Interval: ${interval}`);

  const [inputHours, inputMinutes] = feedingTime.split(":").map(Number);

  const intervalId = setInterval(() => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentSeconds = now.getSeconds();

    // Format current and target times for easy comparison
    const currentTimeStr = `${String(currentHours).padStart(2, "0")}:${String(currentMinutes).padStart(2, "0")}:${String(currentSeconds).padStart(2, "0")}`;
    const targetTimeStr = `${String(inputHours).padStart(2, "0")}:${String(inputMinutes).padStart(2, "0")}:00`;

    // Detailed logging every second
    console.log(`⏰ [Monitoring] Current: ${currentTimeStr} --- Target: ${targetTimeStr}`);

    // Precise time matching
    if (currentHours === inputHours && currentMinutes === inputMinutes && currentSeconds === 0) {
      console.log("🐠 FISH FEED! 🐠");
      console.log(`🕒 Exact Feeding Time Matched: ${currentTimeStr}`);

      // Log to FEED-HISTORY
      addFeedHistoryFromHistory(feedingTime, interval)
        .then((nextFeedingTime) => {
          console.log(`⏭️ Next feeding time will be: ${nextFeedingTime}`);
        })
        .catch((error) => {
          console.error("❌ Error logging feed history:", error);
        });

      onTrigger(); // Trigger any callback or action after feeding time
      clearInterval(intervalId); // Stop monitoring after the log has been triggered
    }
  }, 1000); // Check every second

  return intervalId;
};