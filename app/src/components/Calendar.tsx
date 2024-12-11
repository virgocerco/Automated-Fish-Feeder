import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// Font Loader
import { useFontLoader } from '../utils/fontLoader';

// Utility function to generate calendar days (moved inside component)
const generateCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: (number | null)[] = [];

  // Add empty slots for days before the first day of the month
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }

  // Add actual days of the month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(i);
  }

  return days;
};

// Months array for display
const MONTHS = [
  'January', 'February', 'March', 'April', 
  'May', 'June', 'July', 'August', 
  'September', 'October', 'November', 'December'
];

// Weekday headers
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Use useMemo to memoize days generation
  const days = useMemo(() => generateCalendarDays(year, month), [year, month]);

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handlePreviousMonth} style={styles.navigationButton}>
          <Text style={styles.navigationText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.monthYearText}>
          {MONTHS[month]} {year}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.navigationButton}>
          <Text style={styles.navigationText}>{">"}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.weekdaysContainer}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekdayText}>{day}</Text>
        ))}
      </View>
      
      <View style={styles.daysContainer}>
        {days.map((day, index) => (
          <View 
            key={index} 
            style={[
              styles.dayCell, 
              day === new Date().getDate() && 
              month === new Date().getMonth() && 
              year === new Date().getFullYear() 
                ? styles.currentDay 
                : {}
            ]}
          >
            <Text style={styles.dayText}>
              {day !== null ? day : ''}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 10,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: 300,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  monthYearText: {
    fontFamily: 'Motley',
    fontSize: 14,
    color: '#0D5C63'
  },
  navigationButton: {
    padding: 10
  },
  navigationText: {
    fontSize: 18,
    color: '#0D5C63'
  },
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 2,
    // backgroundColor: '#0D5C63',
  },
  weekdayText: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  dayCell: {
    width: 40,
    height: 40,
    // backgroundColor: 'red',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  dayText: {
    fontSize: 8,
    textAlign: 'center',
  },
  currentDay: {
    backgroundColor: '#ef827f',
    borderRadius: '100%'
  }
});