#include <WiFi.h>
#include <FirebaseESP32.h>

// WiFi and Firebase credentials
const char* ssid = "your-SSID";
const char* password = "your-PASSWORD";
#define FIREBASE_HOST "your-project-id.firebaseio.com"
#define FIREBASE_AUTH "your-database-secret"

// Firebase objects
FirebaseData firebaseData;

// Variables for time and feeding
int currentHour = -1;
int currentMinute = -1;
int initialHours = -1;
int initialMinutes = -1;
int intervalHours = -1;
String feedingAmount = "";
int feedingDuration = 0;

// Feeding amount mapping
const int FEEDING_DURATION_MAP[] = {
  3,  // "Little"
  5,  // "Just Right"
  10  // "A Lot"
};

// Feeding logic variables
unsigned long lastFeedingTime = 0;
bool isFeedingTime = false;

void setup() {
  Serial.begin(115200);
  delay(100);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to Wi-Fi");
  
  // Initialize Firebase
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);
  Serial.println("Firebase initialized");
}

// Function to get feeding duration based on amount
int getFeedingDuration(String amount) {
  if (amount == "Little") return FEEDING_DURATION_MAP[0];
  if (amount == "Just Right") return FEEDING_DURATION_MAP[1];
  if (amount == "A Lot") return FEEDING_DURATION_MAP[2];
  return 3; // Default to "Little" if unknown
}

void activateFeedingMechanism(int duration) {
  // Simulated feeding mechanism
  Serial.println("Feeding Started!");
  
  // Activate food dispenser (placeholder - replace with actual mechanism)
  // For example, turn on a motor or servo
  // digitalWrite(FEEDER_PIN, HIGH);
  
  delay(duration * 1000); // Feed for specified duration
  
  // Stop feeding
  // digitalWrite(FEEDER_PIN, LOW);
  Serial.println("Feeding Stopped!");
}

void loop() {
  // Fetch current hour
  if (Firebase.getInt(firebaseData, "/HISTORY/philippineTime/hour")) {
    if (firebaseData.dataType() == "int") {
      currentHour = firebaseData.intData();
    }
  }
  
  // Fetch current minute
  if (Firebase.getInt(firebaseData, "/HISTORY/philippineTime/minute")) {
    if (firebaseData.dataType() == "int") {
      currentMinute = firebaseData.intData();
    }
  }
  
  // Fetch initial hour
  if (Firebase.getInt(firebaseData, "/HISTORY/initialTime/initialHours")) {
    if (firebaseData.dataType() == "int") {
      initialHours = firebaseData.intData();
    }
  }
  
  // Fetch initial minute
  if (Firebase.getInt(firebaseData, "/HISTORY/initialTime/initialMinutes")) {
    if (firebaseData.dataType() == "int") {
      initialMinutes = firebaseData.intData();
    }
  }
  
  // Fetch feeding interval
  if (Firebase.getInt(firebaseData, "/HISTORY/feedingInterval/interval")) {
    if (firebaseData.dataType() == "int") {
      intervalHours = firebaseData.intData();
    }
  }
  
  // Fetch feeding amount
  if (Firebase.getString(firebaseData, "/HISTORY/feedingAmount/amount")) {
    if (firebaseData.dataType() == "string") {
      feedingAmount = firebaseData.stringData();
      // Get corresponding duration
      feedingDuration = getFeedingDuration(feedingAmount);
    }
  }
  
  // Proceed only if all required values are fetched
  if (currentHour != -1 && currentMinute != -1 && 
      initialHours != -1 && initialMinutes != -1 && 
      intervalHours != -1 && !feedingAmount.isEmpty()) {
    
    Serial.printf("Current time: %02d:%02d\n", currentHour, currentMinute);
    Serial.printf("Initial time: %02d:%02d\n", initialHours, initialMinutes);
    Serial.printf("Interval: %d hours\n", intervalHours);
    Serial.printf("Feeding Amount: %s\n", feedingAmount.c_str());
    Serial.printf("Feeding Duration: %d seconds\n", feedingDuration);
    
    // Convert time to milliseconds
    unsigned long currentMillis = (currentHour * 60 + currentMinute) * 60 * 1000;
    unsigned long initialMillis = (initialHours * 60 + initialMinutes) * 60 * 1000;
    unsigned long intervalMillis = intervalHours * 60 * 60 * 1000;
    
    // Adjust initialMillis to the next valid interval in the future
    while (initialMillis <= currentMillis) {
      initialMillis += intervalMillis;
    }
    
    // Calculate the delay to the next feeding
    unsigned long delayMillis = initialMillis - currentMillis;
    
    // Check if it's time to feed
    if (millis() - lastFeedingTime >= delayMillis) {
      // Activate feeding mechanism
      activateFeedingMechanism(feedingDuration);
      
      // Update last feeding time
      lastFeedingTime = millis();
    }
  }
  
  delay(1000); // Loop every second
}