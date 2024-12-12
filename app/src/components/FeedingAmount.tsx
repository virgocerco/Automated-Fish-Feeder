import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import { ref, set, get } from 'firebase/database';
import { rtdb } from '../utils/firebaseConfig';

const FeedingAmountComponent = () => {
  const [amount, setAmount] = useState<string>("Just Right");
  const [duration, setDuration] = useState<number>(5);
  const [animatedValues, setAnimatedValues] = useState<{[key: string]: Animated.Value}>({
    "Little": new Animated.Value(1),
    "Just Right": new Animated.Value(1),
    "A Lot": new Animated.Value(1)
  });

  const feedingOptions = [
    { 
      label: "Little", 
      value: 3, 
      icon: require('../../assets/media/icon/amount/small.png') 
    },
    { 
      label: "Just Right", 
      value: 5, 
      icon: require('../../assets/media/icon/amount/medium.png') 
    },
    { 
      label: "A Lot", 
      value: 10, 
      icon: require('../../assets/media/icon/amount/large.png') 
    }
  ];

  useEffect(() => {
    const amountRef = ref(rtdb, "HISTORY/feedingAmount/amount");
    const durationRef = ref(rtdb, "HISTORY/feedingAmount/duration");

    get(amountRef).then((snapshot) => {
      if (snapshot.exists()) {
        setAmount(snapshot.val());
      }
    });

    get(durationRef).then((snapshot) => {
      if (snapshot.exists()) {
        setDuration(snapshot.val());
      }
    });
  }, []);

  const handleOptionSelect = (label: string, value: number) => {
    // Animate selection
    Object.keys(animatedValues).forEach(key => {
      Animated.sequence([
        Animated.spring(animatedValues[key], {
          toValue: key === label ? 0.9 : 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true
        }),
        Animated.spring(animatedValues[key], {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true
        })
      ]).start();
    });

    setAmount(label);
    setDuration(value);

    // Update Firebase
    set(ref(rtdb, "HISTORY/feedingAmount/amount"), label);
    set(ref(rtdb, "HISTORY/feedingAmount/duration"), value);
  };

  return (
    <View style={styles.container}>
      {feedingOptions.map((option) => (
        <Animated.View 
          key={option.label}
          style={[
            styles.optionContainer, 
            amount === option.label && styles.selectedContainer,
            { 
              transform: [{ 
                scale: animatedValues[option.label] 
              }] 
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.touchableArea}
            onPress={() => handleOptionSelect(option.label, option.value)}
          >
            <View style={styles.contentWrapper}>
              <Image 
                source={option.icon} 
                style={styles.icon} 
                resizeMode="contain"
              />
              <View style={styles.textWrapper}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionSubtext}>Feeding Amount</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    
  },
  optionContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    display: 'flex',
   
  },
  selectedContainer: {
    borderWidth: 2,
    borderColor: '#4A90E2',
    
  },
  touchableArea: {
    // backgroundColor: 'orange',
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  contentWrapper: {
    gap: 40,
    flexDirection: 'row', 
    // gap: 24,
  },
  icon: {
    width: 60,
    height: 60,
  },
  textWrapper: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  optionSubtext: {
    fontSize: 14,
    color: '#666',
  }
});

export default FeedingAmountComponent;