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

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(getPhilippineTime());
    }, 1000);

    // Fetch and listen to next feed time
    const db = getDatabase();
    const FeedingTimeRef = ref(db, `HISTORY/feedingTime/FeedingTime`);

    // Listen for real-time updates
    const unsubscribe = onValue(FeedingTimeRef, (snapshot) => {
      if (snapshot.exists()) {
        const nextTime24Hour = snapshot.val();
        // Convert to 12-hour format
        const nextTime12Hour = convertTo12HourFormat(nextTime24Hour);
        setFeedingTime(nextTime12Hour);
      }
    });

    // Cleanup interval and listener on component unmount
    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, []);


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

      <View style={{flex: 1, backgroundColor: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0, marginBottom: -60}}>
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
            style={{position: 'absolute', width: '100%', height: '110%', resizeMode: 'stretch', zIndex: 0}} 
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
          {FeedingTime && (
            <Text style={{color: '#DAA520', fontSize: 12, fontFamily: 'Motley'}}>
              Next Feed Time: {FeedingTime}
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
          <FeedingAmount/>
        </View>
      </View>

      <View style={{position: 'relative', flex: 0.8, backgroundColor: '#6bacab', borderLeftWidth: 2, borderRightWidth: 2, borderTopWidth: 3, borderColor: '#0D5C63', display: 'flex', justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 32, borderTopRightRadius: 32}}>
        <View style={{position: 'absolute', top: 12, display: 'flex', flexDirection: 'row', gap: 6, backgroundColor: 'transparent'}}>
          <TouchableOpacity style={{backgroundColor: '#0D5C63', borderRadius: 12, width: 50, height: 50, display: 'flex', justifyContent: 'center', alignItems: 'center'}} onPress={() => {}}>
            <Image style={{width: 30, height: 30}} source={require('../../assets/media/icon/calendar-ico.png')}></Image>
          </TouchableOpacity>
          <TouchableOpacity style={{backgroundColor: '#0D5C63', borderRadius: 12, width: 50, height: 50, display: 'flex', justifyContent: 'center', alignItems: 'center'}} onPress={() => {}}>
            <Image style={{width: 30, height: 30}} source={require('../../assets/media/icon/book-ico.png')}></Image>
          </TouchableOpacity>
        </View>
        <Calendar />
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
