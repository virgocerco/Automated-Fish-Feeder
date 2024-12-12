import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Text, Alert } from 'react-native';
import { getDatabase, ref, set, get } from 'firebase/database';
import { auth } from '../utils/firebaseConfig';

const INTERVAL_VALUES = [1, 2, 3, 4, 5, 6];
const SLIDER_POSITIONS = [1.5, 20, 39, 58, 77, 90];

const AmountSlider = () => {
  const [intervalIndex, setIntervalIndex] = useState(0);

  useEffect(() => {
    const fetchSavedInterval = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const db = getDatabase();
        const intervalSnapshot = await get(ref(db, `HISTORY/feedingInterval/interval`));

        if (intervalSnapshot.exists()) {
          const savedInterval = intervalSnapshot.val();
          const savedIndex = INTERVAL_VALUES.indexOf(savedInterval);
          
          if (savedIndex !== -1) {
            setIntervalIndex(savedIndex);
          }
        }
      } catch (error) {
        console.error('Error fetching saved interval:', error);
      }
    };

    fetchSavedInterval();
  }, []);

  const handleIntervalChange = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const db = getDatabase();
      const newIndex = (intervalIndex + 1) % INTERVAL_VALUES.length;
      const newInterval = INTERVAL_VALUES[newIndex];

      // Fetch the initial hours and minutes
      const initialHoursSnapshot = await get(ref(db, `HISTORY/initialTime/initialHours`));
      const initialMinutesSnapshot = await get(ref(db, `HISTORY/initialTime/initialMinutes`));

      if (initialHoursSnapshot.exists() && initialMinutesSnapshot.exists()) {
        const initialHours = initialHoursSnapshot.val();
        const initialMinutes = initialMinutesSnapshot.val();

        // Calculate new feeding time
        let newHours = initialHours;
        let newMinutes = initialMinutes;

        // Add interval
        newHours += newInterval;

        // Handle hour overflow
        if (newHours >= 24) {
          newHours = newHours % 24;
        }

        // Save the new interval
        await set(ref(db, `HISTORY/feedingInterval/interval`), newInterval);
        
        // Save the next feeding time as separate hours and minutes
        await set(ref(db, `HISTORY/nextFeedingTime/nextFeedingHours`), newHours);
        await set(ref(db, `HISTORY/nextFeedingTime/nextFeedingMinutes`), newMinutes);
        
        // Update UI
        setIntervalIndex(newIndex);

        console.log('Interval updated:', {
          newInterval,
          originalTime: `${initialHours.toString().padStart(2, '0')}:${initialMinutes.toString().padStart(2, '0')}`,
          newFeedingTime: `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`
        });
      } else {
        Alert.alert('Error', 'No initial feeding time found');
      }
    } catch (error) {
      console.error('Error updating interval:', error);
      Alert.alert('Error', 'Failed to update interval');
    }
  };

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderBackground}>
        <Image
          style={{ width: '100%', height: 60, resizeMode: 'stretch' }}
          source={require('../../assets/media/icon/sliderimg.png')}
        />
        <TouchableOpacity
          onPress={handleIntervalChange}
          style={[
            styles.circle, 
            { left: `${SLIDER_POSITIONS[intervalIndex]}%` }
          ]}
        >
          <Image
            style={{
              position: 'absolute',
              width: 50,
              height: 50,
              resizeMode: 'contain',
            }}
            source={require('../../assets/media/icon/slider.png')}
          />
          <Text style={styles.circleText}>
            {INTERVAL_VALUES[intervalIndex]}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sliderContainer: { 
    width: '80%', 
    alignSelf: 'center' 
  },
  sliderBackground: { 
    marginTop: 10, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  circle: { 
    width: 30, 
    height: 30, 
    borderRadius: 15, 
    position: 'absolute', 
    top: '50%', 
    transform: [{ translateY: -15 }], 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  circleText: {
    marginTop: 2,
    width: 30,
    textAlign: 'center',
    fontFamily: 'Motley',
    color: 'white',
    fontSize: 26,
    textShadowColor: 'white',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6
  }
});

export default AmountSlider;