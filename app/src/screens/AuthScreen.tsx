
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  View, 
  Animated, 
  TouchableWithoutFeedback, 
  TouchableOpacity, 
  Image, 
  ImageBackground, 
  Platform, 
  ActivityIndicator,
  PanResponder,
  Alert
} from 'react-native';

// import { useFonts } from 'expo-font';
import { KeyboardAvoidingView, Keyboard } from 'react-native';
import { BlurView } from 'expo-blur';

import { useFontLoader } from '../utils/fontLoader';
import { useIconPanner } from '../utils/IconPanner'; 

// Firebase imports
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigation } from '@react-navigation/native';

import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebaseConfig';

type ModalType = 'login' | 'signup';

export default function AuthScreen() {
    const [modalType, setModalType] = useState<ModalType>('login');

    const [drivera, setDriver] = useState(false); // State to manage the driver's status
    const [isPressing, setIsPressing] = useState(false); // To detect if the icon is being pressed
    const longPressTimeout = useRef<NodeJS.Timeout | null>(null); // Timer for long press detection
    
    // Use the new hook for pan responder
    const { panX, panY, iconPanResponder } = useIconPanner();
  
    // Recreate animations without native driver
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateYAnim = useRef(new Animated.Value(50)).current;
    const iconScaleAnim = useRef(new Animated.Value(1)).current;
    const switchStringBounce = useRef(new Animated.Value(0)).current;

    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const { fontsLoaded, fontError } = useFontLoader();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");

    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const navigation = useNavigation();
      
    const handleSignup = async () => {
        try {
            // Validate inputs with more robust checking
            if (!email || !password || !username) {
                Alert.alert('Error', 'Please fill in all fields');
                return;
            }

            // Perform signup
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Update user profile
            await updateProfile(userCredential.user, { 
                displayName: username 
            });
      
            // Add user to Firestore
            await addDoc(collection(db, 'users'), {
                uid: userCredential.user.uid,
                email: email,
                username: username,
                createdAt: new Date()
            });
      
            Alert.alert('Success', 'Account created successfully!');
        } catch (error: any) {
            // More user-friendly error handling
            let errorMessage = 'An unexpected error occurred';
            
            switch(error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Email is already registered';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email format';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak';
                    break;
            }
            
            Alert.alert('Signup Error', errorMessage);
            console.error("Signup Error:", error);
        }
    };

    const handleLogin = async () => {
      try {
        if (!loginEmail || !loginPassword) {
          Alert.alert('Error', 'Please enter email and password');
          return;
        }
    
        // Add more detailed logging
        console.log('Attempting login...');
    
        const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
        
        console.log('Login successful', userCredential.user);
    
        // Use a more robust navigation method
        if (navigation) {
          (navigation.navigate as (routeName: string) => void)('Dashboard');
        } else {
          console.error('Navigation object is undefined');
        }
      } catch (error: any) {
        console.error('Detailed Login Error:', error);
        
        let errorMessage = 'An unexpected error occurred';
        
        switch(error.code) {
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password';
            break;
          case 'auth/user-not-found':
            errorMessage = 'No user found with this email';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password';
            break;
        }
        
        Alert.alert('Login Error', errorMessage);
      }
    };
    const handleModalTypeChange = () => {
        
        setDriver(true);
        const newModalType = modalType === 'login' ? 'signup' : 'login';

        Animated.sequence([
        Animated.timing(switchStringBounce, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
        }),
        Animated.spring(switchStringBounce, {
            toValue: 0,
            friction: 3,
            tension: 40,
            useNativeDriver: false,
        })
        ]).start();


        Animated.timing(iconScaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
        }).start(() => {
            setModalType(newModalType);
            
            Animated.spring(iconScaleAnim, {  
                toValue: 1,
                friction: 3,
                tension: 40,
                useNativeDriver: false,
            }).start();
        });

        // setDriver(false);
    };

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        () => {
            setKeyboardVisible(true);
        }
        );
        const keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => {
            setKeyboardVisible(false);
        }
        );
    
        return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
        };
    }, []);
    
    useEffect(() => {
        Animated.parallel([
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
        }),
        Animated.delay(500), 
        Animated.timing(translateYAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
        })
        ]).start();
    }, [modalType]);

  return (
    <ImageBackground 
      source={modalType === 'login' 
        ? require('../../assets/media/background/login.jpg') 
        : require('../../assets/media/background/signup.png')} 
      style={styles.backgroundImage} 
      resizeMode="cover"
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
        {/* Switch Puller */}
        <TouchableOpacity 
          style={styles.switchPullerContainer} 
          onPress={handleModalTypeChange}
        >
          <Animated.Image 
            source={require('../../assets/media/switch-string.png')}
            style={[
              styles.switchPuller, 
              { transform: [{ translateY: switchStringBounce.interpolate({
                inputRange: [0, 1], 
                outputRange: [0, 10]
              }) }] }
            ]}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* MY UPPER CONTAINER */}
        {!isKeyboardVisible && (
          <View style={{backgroundColor: 'transparent', flex: 1, padding: 20, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <View style={styles.topIconContainer}>
              
              <TouchableOpacity
              >
                {/* <Text style={{color: 'white'}}>{drivera === true ? 'Driver: True' : 'Driver: False'}</Text> */}
              </TouchableOpacity>
                
              <Animated.Image 
                
                source={modalType === 'signup' 
                  ? require('../../assets/media/icon/signup-ico.png') 
                  : require('../../assets/media/icon/main-ico.png')}
                style={[
                  styles.topIcon, 
                  { 
                    transform: [
                      { scale: iconScaleAnim },
                      { translateX: panX },
                      { translateY: panY }
                    ]
                  }
                ]}
                
                resizeMode="contain"
                // onError={(e) => console.log('Image load error', e.nativeEvent.error)}
                {...iconPanResponder.panHandlers}
              />

              {/* <Animated.View 
                style={[
                  styles.topIcon, 
                  {
                    transform: [
                      { scale: iconScaleAnim },
                      { translateX: panX },
                      { translateY: panY },
                    ]
                  }
                ]}
                {...iconPanResponder.panHandlers}
              >
                <TouchableOpacity
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                >
                  <Animated.Image 
                    style={{width: 100, height: 100}}
                    source={require('../../assets/media/icon/signup-ico.png')}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </Animated.View> */}
            </View>

            <View style={{backgroundColor: 'transparent', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '90%'}}>
              <Text style={styles.customText}>ISDA FEEDER</Text>
              <Text style={styles.customText2}>Developed by Group 16</Text>
            </View>
          </View>
        )}

        {/* MY LOWER CONTAINER */}
        <View style={{backgroundColor: 'transparent', flex: 1.4, padding: 20, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <TouchableWithoutFeedback>
            <Animated.View
              key={modalType}
              style={[
                styles.modalView, 
                { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] },
                {height: modalType === 'login' ? '90%' : '100%'}
              ]}
            >
              <BlurView intensity={70} style={styles.blurByu} tint="dark">
                {modalType === 'login' ? (
                  <>
                    <TextInput
                      value={loginEmail}
                      onChangeText={setLoginEmail}
                      placeholder="Username"
                      placeholderTextColor={'white'}
                      style={styles.input} 
                      autoCapitalize="none"
                    />
                    <TextInput
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                      placeholder="Password"
                      placeholderTextColor={'white'}
                      style={styles.input} 
                      secureTextEntry 
                      autoCapitalize="none"
                    />
                    <TouchableOpacity style={styles.button} onPress={handleLogin}>
                      <Text style={styles.buttonText}>LOG IN LANG</Text>
                    </TouchableOpacity>

                    <View style={{backgroundColor: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10}}>
                      <View style={{borderColor: '#ffffff50', borderWidth: 0, borderBottomWidth: 1, width: 120}}></View>
                      <Text style={{color: '#ffffff80', fontSize: 12}}>OR</Text>
                      <View style={{borderColor: '#ffffff50', borderWidth: 0, borderBottomWidth: 1, width: 120}}></View>
                    </View>
                    
                    <TouchableOpacity style={styles.btnGoogle}>
                      <Image source={require('../../assets/media/icon/google-ico.png')} style={styles.googleIcon} />
                      <Text style={styles.btnGoogleText}>
                        Continue with{"\n"}Goggles
                      </Text>
                    </TouchableOpacity>
                  </>
                  ) : (
                    <>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Email"
                        placeholderTextColor={'white'}
                        style={styles.input} 
                        keyboardType="email-address" 
                        autoCapitalize="none"
                      />
                      <TextInput
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Username" 
                        placeholderTextColor={'white'}
                        style={styles.input} 
                        autoCapitalize="none"
                      />
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Password"
                        placeholderTextColor={'white'} 
                        style={styles.input} 
                        secureTextEntry 
                        autoCapitalize="none"
                      />
                      <TouchableOpacity style={modalType as String === 'login' ? styles.button : styles.btnSignup}>
                        <Text style={styles.buttonText} onPress={handleSignup}>SIGN UP MUNA</Text>
                      </TouchableOpacity>

                      <View style={{backgroundColor: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10}}>
                        <View style={{borderColor: '#ffffff90', borderWidth: 0, borderBottomWidth: 1, width: 100}}></View>
                        <Text style={{color: 'white', fontSize: 20}}>OR</Text>
                        <View style={{borderColor: '#ffffff90', borderWidth: 0, borderBottomWidth: 1, width: 100}}></View>
                      </View>
                      
                      <TouchableOpacity style={styles.btnGoogleS}>
                        <Image source={require('../../assets/media/icon/google-ico.png')} style={styles.googleIcon} />
                        <Text style={styles.btnGoogleText}>
                          Continue with{"\n"}Goggles
                        </Text>
                      </TouchableOpacity>
                    </>
                )}
              </BlurView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
    backgroundImage: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    container: {
      flex: 1,
      flexDirection: 'column',
      backgroundColor: 'transparent', // #cb
      justifyContent: 'space-between',
      padding: 10
    },
    topIconContainer: {
      backgroundColor: 'transparent', // #icbc
      justifyContent: 'center',
      alignItems: 'center',
      // transform: [{ rotate: '-45deg' }],
    },
    topIcon: {
      width: 250, // #ih
      height: 220,
      objectFit: 'cover',
      // tintColor: 'black',
      // filter: 'invert(100%)',
    },
    blurByu: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 20,
      padding: 20
    },
    modalView: {
      width: '100%',
      backgroundColor: '#00000000',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#FFFFFF60',
      gap: 20,
      overflow: 'hidden'
    },
    customText: { // #ct
      fontFamily: 'LexendZetta-Black', // Use the custom font
      // fontWeight: '900',
      // flexWrap: 'wrap',
      width: '100%',
      fontSize: 32,
      color: 'white', // Set the color to white
      // backgroundColor: 'orange',
      textAlign: 'center',
      marginTop: 10,
      textShadowColor: '#ffffff80',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 8
    },
    customText2: { // #ct
      fontFamily: 'LexendZetta-Black',
      width: '100%',
      fontSize: 10,
      color: 'white',
      textAlign: 'center',
      textShadowColor: '#ffffff80',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 8
    },
    input: {
      width: '90%',
      height: 40,
      borderWidth: 0,
      borderBottomWidth: 2,
      borderColor: '#ddd',
      padding: 10,
      // marginBottom: 20,
      backgroundColor: 'transparent',
      color: 'white',
    },
    button: {
      width: '90%',
      padding: 15,
      backgroundColor: '#273EE5',
      alignItems: 'center',
      marginBottom: 10,
  
      borderRadius: 100,
      shadowColor: '#5E70FE',
      shadowOffset: { width: 0, height: 6 },
  
      // Android styles
      ...(Platform.OS === 'android' && {
        borderRadius: 24,
        borderColor: '#5E70FE',
        borderWidth: 2,
        borderBottomWidth: 8,
        elevation: 5, // Shadow for Android
      }),
    },
    btnSignup: {
      width: '90%',
      padding: 15,
      backgroundColor: '#FE7E7E',
      alignItems: 'center',
      marginBottom: 10,
  
      borderRadius: 100,
      shadowColor: '#FE9272',
      shadowOffset: { width: 0, height: 6 },
  
      // Android styles
      ...(Platform.OS === 'android' && {
        borderRadius: 24,
        borderColor: '#FE9272',
        borderWidth: 2,
        borderBottomWidth: 8,
        elevation: 5, // Shadow for Android
      }),
    },
    buttonText: {
      fontFamily: 'LexendMega-Bold',
      color: 'white',
      fontSize: 20,
      // fontWeight: 'bold',
    },
    googleIcon: {
      width: 30,
      height: 30,
      // marginRight: 8,
      // marginLeft: 4
    },
    btnGoogle: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'center',
      gap: 10,
      width: '60%',
      paddingVertical: 10,
      paddingHorizontal: 20,
      backgroundColor: 'white',
      borderRadius: 20,
      shadowColor: '#5E70FE',
      shadowOffset: { width: 0, height: 6 },
  
      // Android styles
      ...(Platform.OS === 'android' && {
        borderRadius: 24,
        borderColor: '#5E70FE',
        borderWidth: 2,
        borderBottomWidth: 8,
        elevation: 5, // Shadow for Android
      }),
    },
    btnGoogleS: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'center',
      gap: 10,
      width: '60%',
      paddingVertical: 10,
      paddingHorizontal: 20,
      backgroundColor: 'white',
      borderRadius: 20,
      shadowColor: '#FE9272',
      shadowOffset: { width: 0, height: 6 },
  
      // Android styles
      ...(Platform.OS === 'android' && {
        borderRadius: 24,
        borderColor: '#FE9272',
        borderWidth: 2,
        borderBottomWidth: 8,
        elevation: 5, // Shadow for Android
      }),
    },
    btnGoogleText: {
      color: '#202020',
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    switchPullerContainer: {
      position: 'absolute',
      top: -150,
      right: 5,
      zIndex: 10,
      // backgroundColor: 'orange',
      width: 50,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    switchPuller: {
      width: 280,
      height: 280,
      tintColor: 'white',
    },
  });  