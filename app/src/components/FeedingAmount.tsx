import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet ,Image } from 'react-native';
import { ref, set, get } from 'firebase/database';
import { rtdb } from '../utils/firebaseConfig';

const FeedingAmountComponent = () => {
  const [amount, setAmount] = useState<string>("Just Right");
  const [duration, setDuration] = useState<number>(5);

  const feedingOptions = [
    { label: "Little", value: 3 },
    { label: "Just Right", value: 5 },
    { label: "A Lot", value: 10 },
  ];

  useEffect(() => {
    const amountRef = ref(rtdb, "HISTORY/feedingAmount/amount");
    const durationRef = ref(rtdb, "HISTORY/feedingAmount/duration");

    // Fetch existing values from Firebase
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
    setAmount(label);
    setDuration(value);

    // Update Firebase
    set(ref(rtdb, "HISTORY/feedingAmount/amount"), label);
    set(ref(rtdb, "HISTORY/feedingAmount/duration"), value);
  };

  return (
    <View style={styles.container}>
      <Image
        style={{position: 'absolute', top: 0, left: 0, width: '500%', height: '500%', resizeMode: 'cover'}}
        source={require('../../assets/media/background/plank.jpg')}></Image>
      <Text style={styles.title}>Choose Feeding Amount</Text>
      <View style={styles.optionsContainer}>
        {feedingOptions.map((option) => (
          <TouchableOpacity
            key={option.label}
            style={[
              styles.optionButton,
              amount === option.label && styles.selectedOption
            ]}
            onPress={() => handleOptionSelect(option.label, option.value)}
          >
            <Text style={styles.optionText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'red',
    borderRadius: 8,
    padding: 12,
    width: '80%',
    marginTop: 10,
    overflow: 'hidden',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  optionsContainer: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionButton: {
    flex: 1,
    padding: 4,
    margin: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    // backgroundColor: 'orange'
  },
  selectedOption: {
    backgroundColor: '#e0e0e0',
  },
  optionText: {
    fontSize: 16,
  },
});

export default FeedingAmountComponent;