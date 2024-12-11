import { useState, useEffect } from 'react';
import { useFonts } from 'expo-font';

export const useFontLoader = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontError, setFontError] = useState<Error | null>(null);

  const [loaded, error] = useFonts({
    'LexendZetta-Black': require('../../assets/fonts/LexendZetta-Black.ttf'),
    'LexendMega-Regular': require('../../assets/fonts/LexendMega-Regular.ttf'),
    'LexendMega-Bold': require('../../assets/fonts/LexendMega-Bold.ttf'),
    'Digital-Clock': require('../../assets/fonts/Digital-Clock.ttf'),
    'Motley': require('../../assets/fonts/Motley.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      setFontsLoaded(true);
    }
  }, [loaded]);

  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
      setFontError(error);
    }
  }, [error]);

  return { fontsLoaded, fontError };
};

    // Use the new font loading utility
    // const { fontsLoaded, fontError } = useFontLoader();

    // if (!fontsLoaded) {
    // return (
    //     <View style={styles.container}>
    //     <ActivityIndicator size="large" color="#0000ff" />
    //     </View>
    // );
    // }
    
    // useEffect(() => {
    //     if (fontError) {
    //       console.error('Font loading error:', fontError);
    //     }
    // }, [fontError]);