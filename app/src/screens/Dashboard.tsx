import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Platform, 
  Modal
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../utils/firebaseConfig';
import { getDatabase, ref, get, onValue } from 'firebase/database';
import { KeyboardAvoidingView } from 'react-native';
import TimePicker from '../components/TimePicker';
import AmountSlider from '../components/AmountSlider';
import Calendar from '../components/Calendar';
import FeedingAmount from '../components/FeedingAmount';

import { getPHTime, postTimeToDatabase } from '../utils/phRealTime'; 
import { monitorFeedingTime } from '../utils/notificationUtils'; // Import notification utils
import { requestNotificationPermissions } from '../utils/notificationUtils';

// Utility function to get Philippine Time
const getPhilippineTime = () => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Manila',
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  return new Intl.DateTimeFormat('en-PH', options).format(new Date());
};

// Convert 24-hour time to 12-hour format
const convertTo12HourFormat = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  let displayHours = hours % 12;
  displayHours = displayHours === 0 ? 12 : displayHours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export default function Dashboard() {
  const navigation = useNavigation();
  const [currentTime, setCurrentTime] = useState(getPhilippineTime());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isTimeTooltipVisible, setIsTimeTooltipVisible] = useState(false);
  const [isAmountTooltipVisible, setIsAmountTooltipVisible] = useState(false);
  const [timeTooltipTimeout, setTimeTooltipTimeout] = useState(null);
  const [amountTooltipTimeout, setAmountTooltipTimeout] = useState(null);

  const [FeedingTime, setFeedingTime] = useState<string | null>(null);
  const [FeedingInterval, setFeedingInterval] = useState<number>(1); // Default interval

  // New state to manage view sections
  const [activeSection, setActiveSection] = useState<'calendar' | 'history' | 'feeding-amount'>('calendar');

  useEffect(() => {
    // Function to fetch and post Philippine time
    const updateTime = () => {
      const time = getPHTime();
      postTimeToDatabase(time);
    };
  
    // Update time immediately when the component mounts
    updateTime();
  
    // Set up an interval to update the time every 1 minute (60000 ms)
    const timer = setInterval(updateTime, 1000);
  
    // Cleanup the interval when the component unmounts
    return () => clearInterval(timer);
  }, []); // Empty dependency array means this effect runs once when the component mounts
  

  useEffect(() => {
    // Update time every second and display in app
    const timer = setInterval(() => {
      setCurrentTime(getPhilippineTime());
    }, 1000);
  
    const db = getDatabase();
    const nextFeedingTimeRef = ref(db, 'HISTORY/nextFeedingTime');
    // const IntervalRef = ref(db, 'HISTORY/interval/interval');
  
    const unsubscribeTime = onValue(nextFeedingTimeRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log("Full snapshot data:", data);
  
        const nextfeedingHours = data?.nextFeedingHours;  // Note the triple 'e' in nextFeeedingHours
        const nextfeedingMinutes = data?.nextFeedingMinutes;
  
        if (nextfeedingHours !== undefined && nextfeedingMinutes !== undefined) {
          const nextTime24Hour = `${nextfeedingHours.toString().padStart(2, '0')}:${nextfeedingMinutes.toString().padStart(2, '0')}`;
          const nextTime12Hour = convertTo12HourFormat(nextTime24Hour);
  
          console.log("Next Feed Time (24-hour):", nextTime24Hour);
          console.log("Next Feed Time (12-hour):", nextTime12Hour);
  
          setFeedingTime(nextTime12Hour);
        } else {
          console.error("Hours or minutes are undefined");
          setFeedingTime(null);
        }
      } else {
        console.error("No snapshot exists for nextFeedingTime");
        setFeedingTime(null);
      }
    }, (error) => {
      console.error("Error reading next feeding time:", error);
      setFeedingTime(null);
    });
  
    // Cleanup interval and listener on component unmount
    return () => {
      clearInterval(timer);
      unsubscribeTime();
    };
  }, []); // Ensure empty dependency array to run only once

  useEffect(() => {
    console.log("FeedingTime updated:", FeedingTime);  // Log the updated FeedingTime
  }, [FeedingTime]);  // This will log whenever FeedingTime changes
  

  useEffect(() => {
    const setupNotifications = async () => {
      const permissionGranted = await requestNotificationPermissions();
      
      if (!permissionGranted) {
        Alert.alert(
          "Notification Permissions",
          "We need notification permissions to alert you about feeding times. Please enable them in your device settings.",
          [{ text: "OK" }]
        );
      }
    };

    setupNotifications();
  }, []); // Empty dependency array means this runs once on component mount

  useEffect(() => {
    if (FeedingTime) {
      const [time, period] = FeedingTime.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      
      // Convert to 24-hour format
      let formattedHours = hours;
      if (period === 'PM' && hours !== 12) {
        formattedHours += 12;
      } else if (period === 'AM' && hours === 12) {
        formattedHours = 0;
      }
  
      const formattedTime = `${formattedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      const { intervalId } = monitorFeedingTime(
        formattedTime, 
        FeedingInterval, 
        (nextFeedTime) => {
          // Optional: You can update the database or state with the next feed time
          console.log('Next feed time:', nextFeedTime);
        }
      );
  
      return () => clearInterval(intervalId);
    }
  }, [FeedingTime, FeedingInterval]);

  const handleIconPress = (section: 'calendar' | 'history' | 'feeding-amount') => {
    // Toggle between sections
    setActiveSection(section);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsModalVisible(false);
      (navigation as any).navigate('AuthScreen');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAbout = () => {
    // Navigate to About screen or show an alert
    setIsModalVisible(false);
    (navigation as any).navigate('AboutScreen');
  };

  // Tooltip logic for holding TIME 101
  const handleTimePressIn = () => {
    const timeout = setTimeout(() => {
      setIsTimeTooltipVisible(true);
    }, 500); // 500 ms hold time
    setTimeTooltipTimeout(timeout);
  };

  const handleTimePressOut = () => {
    if (timeTooltipTimeout) {
      clearTimeout(timeTooltipTimeout);
      setTimeTooltipTimeout(null);
    }
    setIsTimeTooltipVisible(false);
  };

  // Tooltip logic for holding Amount Slider
  const handleAmountPressIn = () => {
    const timeout = setTimeout(() => {
      setIsAmountTooltipVisible(true);
    }, 500); // 500 ms hold time
    setAmountTooltipTimeout(timeout);
  };

  const handleAmountPressOut = () => {
    if (amountTooltipTimeout) {
      clearTimeout(amountTooltipTimeout);
      setAmountTooltipTimeout(null);
    }
    setIsAmountTooltipVisible(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Modal Button */}
      <TouchableOpacity
        onPress={() => setIsModalVisible(!isModalVisible)}
        style={styles.modalButton}
      >
        <Text style={styles.modalButtonText}>•••</Text>
      </TouchableOpacity>

      {/* Existing Modal Content */}
      {isModalVisible && (
        <View style={styles.absoluteModalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={handleAbout}
            >
              <Text style={styles.modalOptionText}>About</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={handleLogout}
            >
              <Text style={styles.modalOptionText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tooltip for TIME 101 */}
      {isTimeTooltipVisible && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>Select by swapping the time. This will be the starting point of the Feeder Machine accordingly.</Text>
        </View>
      )}

      {/* Tooltip for Amount Slider */}
      {isAmountTooltipVisible && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>This is Set Feeding Interval. If Time shows 12:00 PM and interval is 3, fish will be fed at 3:00 PM, 6:00 PM  etc...</Text>
        </View>
      )}

      <View style={{flex: 1, backgroundColor: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: -60}}>
        <Image
          style={{position: 'absolute', width: '100%', height: '100%'}}
          source={require('../../assets/media/background/aquarium.png')}
        />
        
        {/* TIME 101 */}
        <View 
          style={{
            // backgroundColor: 'orange',
            width: '90%',
            height: '40%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Image 
            style={{position: 'absolute', width: '100%', height: '140%', resizeMode: 'stretch', zIndex: 0}} 
            source={require('../../assets/media/background/time-frame.png')} 
          />

          <TouchableOpacity 
            onPressIn={handleTimePressIn} 
            onPressOut={handleTimePressOut} 
            style={{width: '80%', height: '80%', position: 'absolute', zIndex: 0, backgroundColor: 'transparent'}}
          >
          </TouchableOpacity>

          <TimePicker />

          <Text style={{color: '#0D5C63', fontSize: 14, fontFamily: 'Motley'}}>
            Current Time: {currentTime}
          </Text>
          {FeedingTime ? (
            <Text style={{color: '#DAA520', fontSize: 12, fontFamily: 'Motley'}}>
              Next Feed Time: {FeedingTime}
            </Text>
          ) : (
            <Text style={{color: 'red', fontSize: 12, fontFamily: 'Motley'}}>
              Loading Next Feed Time...
            </Text>
          )}

        </View>

        {/* Amount Slider with Touchable Wrapper */}
        <View style={{width: '90%', position: 'relative', backgroundColor: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <TouchableOpacity 
            onPressIn={handleAmountPressIn} 
            onPressOut={handleAmountPressOut} 
            style={{position: 'absolute', width: '100%', height: '50%', zIndex: 0, backgroundColor: 'transparent'}}
          />
          <AmountSlider />
        </View>
      </View>

      <View style={styles.bottomNavContainer}>
        <View style={styles.iconContainer}>
          <TouchableOpacity 
            style={[
              styles.iconButton, 
              activeSection === 'calendar' && styles.activeIconButton
            ]} 
            onPress={() => handleIconPress('calendar')}
          >
            <Image 
              style={styles.icon} 
              source={require('../../assets/media/icon/calendar-ico.png')}
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.iconButton, 
              activeSection === 'history' && styles.activeIconButton
            ]} 
            onPress={() => handleIconPress('history')}
          >
            <Image 
              style={styles.icon} 
              source={require('../../assets/media/icon/book-ico.png')}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.iconButton, 
              activeSection === 'feeding-amount' && styles.activeIconButton
            ]} 
            onPress={() => handleIconPress('feeding-amount')}
          >
            <Image 
              style={styles.icon} 
              source={require('../../assets/media/icon/food-ico.png')}
            />
          </TouchableOpacity>
        </View>

      {activeSection === 'calendar' && (
        <Calendar />
      )}

      {activeSection === 'feeding-amount' && (
        <FeedingAmount/>
      )}

      {activeSection === 'history' && (
        <View>
          <Text style={{color: '#f5f5f5', fontSize: 20, fontFamily: 'Motley'}}>No History...</Text>
        </View>
      )}
      </View>



    
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#f5f5f5'
  },
  bottomNavContainer: {
    position: 'relative', 
    flex: 1, 
    backgroundColor: '#6bacab', 
    borderLeftWidth: 2, 
    borderRightWidth: 2, 
    borderTopWidth: 3, 
    borderColor: '#0D5C63', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 50
  },
  iconContainer: {
    position: 'absolute', 
    top: 40, 
    display: 'flex', 
    flexDirection: 'row', 
    gap: 6, 
    backgroundColor: 'transparent'
  },
  iconButton: {
    backgroundColor: '#0D5C63', 
    borderRadius: 12, 
    width: 50, 
    height: 50, 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  activeIconButton: {
    backgroundColor: '#DAA520'
  },
  icon: {
    width: 30, 
    height: 30
  },
  modalButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 38,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalButtonText: {
    fontSize: 18, 
    color: 'black', 
    fontFamily: 'Motley', 
    margin: 0
  },
  absoluteModalContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1001
  },
  modalContent: {
    width: 120,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  modalOption: {
    padding: 10,
    alignItems: 'center'
  },
  modalOptionText: {
    fontSize: 16,
    color: '#0D5C63',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0'
  },
  tooltip: {
    position: 'absolute',
    top: 60,
    width: 240,
    left: '50%',
    transform: [{ translateX: -120 }],
    padding: 10,
    backgroundColor: '#4682B4',
    borderRadius: 8,
    zIndex: 1000,
  },
  tooltipText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'LexandMega-Regular',
    textAlign: 'center',
  }
});