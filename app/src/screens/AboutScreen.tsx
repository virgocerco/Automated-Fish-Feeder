import React, { useState } from 'react';
import { 
  SafeAreaView, 
  Text, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  ScrollView,
  Image
} from 'react-native';

// Font Loader
import { useFontLoader } from '../utils/fontLoader';

const AboutScreen = ({ navigation}) => {
  const [isTeamVisible, setIsTeamVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const { fontsLoaded, fontError } = useFontLoader();

  const teamMembers = [
    {
      firstName: 'IDALA',
      lastName: 'Rainnier',
      position: 'PROJECT MANAGER',
      description: 'ESP32 Configuration Specialist and Project Leader of Automated Fish Feeder'
    },
    {
      firstName: 'GESTA',
      lastName: 'Peter',
      position: 'UI/UX',
      description: 'UI Designer (Figma)'
    },
    {
      firstName: 'GRAFE',
      lastName: 'John',
      position: 'BACKEND',
      description: 'React Application Programmer'
    },
    {
      firstName: 'BASARIO',
      lastName: 'Nestor',
      position: 'DATABASE',
      description: 'ESP32 Programmer'
    },
    {
      firstName: 'PALMARES',
      lastName: 'Gian',
      position: 'FRONT END',
      description: 'ESP32 Prototype Builder and Tester'
    },
    {
      firstName: 'SANCHEZ',
      lastName: 'Daniel',
      position: 'SECURITY',
      description: 'ESP32 Prototype Builder and Tester'
    },
    {
      firstName: 'SALVADOR',
      lastName: 'Justin',
      position: 'RELEASE MANAGER',
      description: 'Launch Coordinator and UI Designer'
    },
    {
      firstName: 'SAMOSA',
      lastName: 'Jern',
      position: 'UI SPECIALIST',
      description: 'UI Tester and Validator'
    },
    {
      firstName: 'PANGILINAN',
      lastName: 'Andriane',
      position: 'UI SPECIALIST',
      description: 'UI Designer'
    }
  ];

  const toggleTeamVisibility = () => {
    setIsTeamVisible(!isTeamVisible);
  };

  const handleMemberPress = (index) => {
    setSelectedMember(selectedMember === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image 
        source={require('../../assets/media/background/aboutbg.png')}
        style={styles.backgroundImage}
      />

      <TouchableOpacity 
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Image 
          source={require('../../assets/media/icon/exit-ico.png')} 
          style={styles.exitIcon}
        />
      </TouchableOpacity>
      
      {!isTeamVisible && (
        <View style={styles.aboutUsSection}>
          <Text style={styles.sectionTitle}>About Samen</Text>
          <View style={styles.aboutUs}>
            <Text style={styles.aboutUsText}>
              We are Group 16, a team of tech enthusiasts working together to bring ideas to life for our Applications Development (APPSDEV) and Human-Computer Interaction (HCI) subjects. For our project, we are building an Automated Fish Feeder—a smart system designed to streamline the feeding process for pet fish.

              While inspired by existing solutions, we are taking our own approach, combining the capabilities of the ESP32 microcontroller with a sleek React application. By exploring new methods and relying on our collective creativity, we aim to develop a functional and user-friendly system that demonstrates our understanding of both hardware and software integration.

              Our journey is a testament to learning, collaboration, and innovation as we work to turn a concept into a working prototype that balances technology with everyday convenience.
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity 
        style={styles.meetTeamButton}
        onPress={toggleTeamVisibility}
      >
        <Text style={styles.meetTeamButtonText}>
          {isTeamVisible ? 'Back to About' : 'Meet the Team'}
        </Text>
      </TouchableOpacity>

      {isTeamVisible && (
        <View style={styles.teamContainer}>
          <Text style={styles.meetTeamTitle}>Meet the Fckn Team</Text>
          <ScrollView 
            style={styles.teamScrollView}
            contentContainerStyle={styles.teamScrollViewContent}
          >
            {teamMembers.map((member, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => handleMemberPress(index)}
                style={[
                  styles.teamMemberContainer,
                  selectedMember === index && styles.selectedMemberContainer
                ]}
              >
                <View style={styles.memberNameContainer}>
                  <Text style={styles.memberFirstName}>{member.firstName}</Text>
                  <Text style={styles.memberLastName}>{member.lastName}</Text>
                </View>
                <View style={styles.memberDetailsContainer}>
                  <Text style={styles.memberPosition}>{member.position}</Text>
                  <Text style={styles.memberDescription}>{member.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0'
  },
  backgroundImage: {
    position: 'absolute', 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover'
  },
  backBtn: {
    position: 'absolute',
    top: 32,
    left: 32,
    zIndex: 10
  },
  exitIcon: {
    width: 60, 
    height: 60, 
    resizeMode: 'contain'
  },
  aboutUsSection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontFamily: 'Motley',
    fontSize: 30, 
    // fontWeight: 'bold', 
    textAlign: 'left',
    marginBottom: 6,
    color: 'white',
    marginLeft: 8
  },
  aboutUs: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  aboutUsText: {
    fontSize: 16,
    lineHeight: 24,
    color: 'white'
  },
  meetTeamButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,139,139, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    zIndex: 1000
  },
  meetTeamButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  teamContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingTop: 20,
    paddingBottom: 80,
    paddingHorizontal: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  meetTeamTitle: {
    fontFamily: 'Motley',
    fontSize: 24, 
    // fontWeight: 'bold', 
    textAlign: 'left', 
    marginBottom: 16,
    color: 'white'
  },
  teamScrollView: {
    flex: 1
  },
  teamScrollViewContent: {
    paddingBottom: 20
  },
  teamMemberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  selectedMemberContainer: {
    backgroundColor: 'rgba(0,255,0,0.9)' // Light yellow highlight
  },
  memberNameContainer: {
    flex: 1,
    marginRight: 12
  },
  memberFirstName: {
    fontFamily: 'Motley',
    fontSize: 16,
    // fontWeight: 'bold',
    color: 'white'
  },
  memberLastName: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'Motley',
  },
  memberDetailsContainer: {
    
    flex: 2,
    alignItems: 'flex-end'
  },
  memberPosition: {
    fontFamily: 'Motley',
    fontSize: 14,
    // fontWeight: '600',
    color: 'pink', // Changed position text color to pink
    marginBottom: 4
  },
  memberDescription: {
    fontFamily: 'LexendMega-Regular',
    fontSize: 12,
    color: 'white',
    textAlign: 'right'
  }
});

export default AboutScreen;