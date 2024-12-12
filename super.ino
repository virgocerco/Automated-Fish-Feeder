#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>
#include <ESP32Servo.h>
#include <HTTPClient.h> 


// WiFi credentials
#define WIFI_SSID "Free Wifi tapos Hack kita"
#define WIFI_PASSWORD "dNA=Kill!"

// Firebase credentials
#define API_KEY "AIzaSyCiltxnDdu0644S3n-a9-4yNe_n2NUGdkw"
#define DATABASE_URL "https://sixteen-app-db-default-rtdb.asia-southeast1.firebasedatabase.app/"

#define LIGHT_RED 4   // D4 for Light RED
#define LIGHT_GREEN 33  // D33 for Light GREEN

Adafruit_SSD1306 display(128, 64, &Wire, -1);

// Button pins
const int modeButton = 14;
const int upButton = 27;
const int downButton = 26;
const int enterButton = 25;
const int servoPin = 13; //servo



unsigned long debounceTimers[4] = { 0, 0, 0, 0 };  // Separate debounce times for each button
const unsigned long debounceDelay = 200;           // Debounce delay in milliseconds

int currentMenuIndex = 0;
String menuItems[] = { "History", "Set Time", "Set Amount", "Set Interval" };
int menuLength = sizeof(menuItems) / sizeof(menuItems[0]);

int selectedDay=1;                // Default day for history
int initialHours, initialMinutes;  // Default feeding time
int nextFeedingHours,nextFeedingMinutes;
int hour,minute;
int feedDuration;               // Default servo runtime in seconds
int feedingInterval;            // Default feeding interval in hours

int currentAmountIndex = 0;
String feedingAmount[] = { "Little", "Just Right", "A Lot" };
int feedingLength = sizeof(feedingAmount) / sizeof(feedingAmount[0]);

bool isEditing;
bool  adjustingHour;
bool servoRunning = false;

//firebase
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

//servo 
Servo servo;
int angle = 45; // Initial angle
int increment = 1; // Angle increment



void setup() {
  Serial.begin(115200);

  pinMode(modeButton, INPUT_PULLUP);
  pinMode(upButton, INPUT_PULLUP);
  pinMode(downButton, INPUT_PULLUP);
  pinMode(enterButton, INPUT_PULLUP);

    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
      Serial.println("Display initialization failed!");
      while (true)
        ;  // Halt execution
    }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Initializing...");
  display.display();
 
   // Wi-Fi connection with timeout
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long startAttemptTime = millis();

    while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 10000) {
      display.clearDisplay();
      display.setCursor(0, 0);
      display.println("CONNECTING...");
      display.display();
      delay(300);
    }

    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi connection failed!");
      display.println("WiFi Failed");
      display.display();
    } else {
      display.clearDisplay();
      display.println("Connected");
      display.display();
    
     
  }

  // Firebase configuration
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

    if (Firebase.signUp(&config, &auth, "", "")) {
      display.clearDisplay();
      display.println("Firebase Connected");
      display.display();
    } else {
      display.clearDisplay();
      display.println("Firebase Error");
      display.display();
      Serial.printf("Error: %s\n", config.signer.signupError.message.c_str());
    }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

 // Attach the servo to the defined pin
 servo.attach(servoPin);
 
 // Move the servo to the initial position
  servo.write(angle);
  Serial.println("Servo Motor Control Initialized");
  display.println("Servo Motor Control Initialized");

  pinMode(LIGHT_RED, OUTPUT);
  pinMode(LIGHT_GREEN, OUTPUT);


}

void loop() {

  retrieveDataFromFirebase();
  
   digitalWrite(LIGHT_RED, HIGH); // Turn on Light RED
   digitalWrite(LIGHT_GREEN, HIGH); // Turn on Light GREEN  

  checkFeedingSchedule();

  checkButtonPress(modeButton, 0, [] {
    showMenu();
  }); 
  checkButtonPress(upButton, 1, [] {
    navigateMenu(-1);
  });
  checkButtonPress(downButton, 2, [] {
    navigateMenu(1);
  });
  checkButtonPress(enterButton, 3, [] {
    executeMenuAction();
  });

}

void checkButtonPress(int buttonPin, int index, void (*action)()) {

  if (millis() - debounceTimers[index] > debounceDelay && !digitalRead(buttonPin)) {
    debounceTimers[index] = millis();
    action();
  }

}

void checkFeedingSchedule() {
  // struct tm timeinfo;
  // if (!getLocalTime(&timeinfo)) {
  //   Serial.println("Failed to obtain time");
  //   return;
  // }
  //  display.println("try");
  // int currentHour = currentTime;
 

  // if (!servoRunning && currentHour ) {
  //   servoRunning = true;
  //   startServo();
  // }
}

void showMessage(const String& message) {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.println(message);
  display.display();
  delay(300);  // Display the message for 3 seconds
}


void retrieveDataFromFirebase() {
    // Retrieve feeding amount
    if (Firebase.RTDB.getString(&fbdo, "/HISTORY/feedingAmount/amount")) {
        String feedingAmount = fbdo.stringData();
        Serial.println("Feeding Amount: " + feedingAmount);
    } else {
        Serial.println("Failed to get feeding amount: " + fbdo.errorReason());
    }

    // Retrieve feeding duration
    if (Firebase.RTDB.getInt(&fbdo, "/HISTORY/feedingAmount/duration")) {
        int feedDuration = fbdo.intData();
        Serial.println("Feeding Duration: " + String(feedDuration));
    } else {
        Serial.println("Failed to get feeding duration: " + fbdo.errorReason());
    }

    // Retrieve feeding interval
    if (Firebase.RTDB.getInt(&fbdo, "/HISTORY/feedingInterval/interval")) {
        int feedingInterval = fbdo.intData();
        Serial.println("Feeding Interval: " + String(feedingInterval));
    } else {
        Serial.println("Failed to get feeding interval: " + fbdo.errorReason());
    }

    // Retrieve initial time hours
    if (Firebase.RTDB.getInt(&fbdo, "/HISTORY/initialTime/initialHours")) {
        int initialHours = fbdo.intData();
        Serial.println("Initial Hours: " + String(initialHours));
    } else {
        Serial.println("Failed to get initial hours: " + fbdo.errorReason());
    }

    // Retrieve initial time minutes
    if (Firebase.RTDB.getInt(&fbdo, "/HISTORY/initialTime/initialMinutes")) {
        int initialMinutes = fbdo.intData();
        Serial.println("Initial Minutes: " + String(initialMinutes));
    } else {
        Serial.println("Failed to get initial minutes: " + fbdo.errorReason());
    }
}



void startServo() {

   for (int i = 0; i < feedDuration; i++) {

    // Smoothly move the servo from 0 to 130 degrees
    for (angle = 0; angle <= 130; angle += increment) {
      servo.write(angle);
      delay(5); // Small delay for smooth motion
    }

    // Smoothly move the servo back from 130 to 0 degrees
    for (angle = 130; angle >= 0; angle -= increment) {
      servo.write(angle);
      delay(5); // Small delay for smooth motion
    }

    servoRunning = false;
    Serial.println("Servo operation completed.");
    showMessage("Servo operation completed.");

  }


}

void showMenu() {

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Mode Menu:");

    for (int i = 0; i < menuLength; i++) {
      if (i == currentMenuIndex) {
        display.setTextColor(SSD1306_BLACK, SSD1306_WHITE);
        display.print("-> ");
      } else {
        display.setTextColor(SSD1306_WHITE);
        display.print(" ");
      }
      display.println(menuItems[i]);
    }

  display.display();

}

void navigateMenu(int direction) {

  currentMenuIndex += direction;
    if (currentMenuIndex < 0) {
      currentMenuIndex = menuLength - 1;
    } else if (currentMenuIndex >= menuLength) {
      currentMenuIndex = 0;
    }
  showMenu();

}
// Updated setTime function
void setTime() {
  isEditing = true;
  adjustingHour = true;

  while (isEditing) {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("Set Feeding Time:");

    if (adjustingHour) {
      display.print("Hour: ");
      display.println(initialHours:);
      display.println("Minute: --");
    } else {
      display.print("Hour: ");
      display.println(initialHours:);
      display.print("Minute: ");
      display.println(initialMinutes:);
    }

    display.display();

    checkButtonPress(upButton, 1, [] {
      if (adjustingHour) {
        increaseHour();
      } else {
        increaseMinute();
      }
    });

    checkButtonPress(downButton, 2, [] {
      if (adjustingHour) {
        decreaseHour();
      } else {
        decreaseMinute();
      }
    });

    checkButtonPress(enterButton, 3, [] {
      if (adjustingHour) {
        adjustingHour = false;  // Switch to adjusting minutes
         display.println("Hour Saved!");
      } else {
        confirmTime();
      }
    });

    checkButtonPress(modeButton, 0, cancelEditing);
  }
}

void increaseHour() {
  feedHour = (feedHour + 1) % 24;
}

void decreaseHour() {
  feedHour = (feedHour - 1 + 24) % 24;
}

void increaseMinute() {
  feedMinute = (feedMinute + 1) % 60;
}

void decreaseMinute() {
  feedMinute = (feedMinute - 1 + 60) % 60;
}

void confirmTime() {
  isEditing = false;
  saveFeedingTimeToFirebase(feedHour, feedMinute);
   display.println("Time Saved!");
}

void cancelEditing() {
  isEditing = false;
   display.println("Cancelled!");
}

void executeMenuAction() {
  if (menuItems[currentMenuIndex] == "History") {
    showHistory();
  } else if (menuItems[currentMenuIndex] == "Set Time") {
    setTime(); // Ensure this matches the function name
  } else if (menuItems[currentMenuIndex] == "Set Amount") {
    setAmount();
  } else if (menuItems[currentMenuIndex] == "Set Interval") {
    setInterval(); // Ensure this matches the function name
  }
}


void showHistory() {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Feeding History:");
  display.println("Day: " + String(selectedDay));
  display.display();

  Firebase.RTDB.setInt(&fbdo, "/history/selectedDay", selectedDay);
  delay(2000);
}


// Updated setAmount function
void setAmount() {
 isEditing = true;

  while (isEditing) {
   display.clearDisplay();
   display.setCursor(0, 0);
   display.println("Food Amount:");


     // Display the options and highlight the current selection
      for (int i = 0; i < feedingLength; i++) {
          if (i == currentAmountIndex) {
          display.setTextColor(SSD1306_BLACK, SSD1306_WHITE);  // Highlight selected
          display.print("-> ");
          } else {
          display.setTextColor(SSD1306_WHITE);  // Normal text
          display.print("   ");
          }
        display.println(feedingAmount[i]);  // Print the option

      }

   display.display();

    // Check button presses
    checkButtonPress(upButton, 1, [] {
     currentAmountIndex = (currentAmountIndex - 1 + feedingLength) % feedingLength;  // Move up
    });
    checkButtonPress(downButton, 2, [] {
      currentAmountIndex = (currentAmountIndex + 1) % feedingLength;  // Move down
    });
    checkButtonPress(enterButton, 3, [] {
      confirmAmountSelection();
    });
   checkButtonPress(modeButton, 0, [] {
     cancelEditing();
   });
   }
}

void increaseInterval() {
  feedingInterval = (feedingInterval + 1) % 24;  // You can adjust the range as needed 
} 

void decreaseInterval() { 
  feedingInterval = (feedingInterval - 1 + 24) % 24; // You can adjust the range as needed 
} 

void confirmInterval() { 
 isEditing = false; saveFeedingIntervalToFirebase(feedingInterval); showMessage("Saved!"); 
} 

void setInterval() {
  isEditing = true;
  while (isEditing) {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("Set Interval:");
    display.print("Hours: ");
    display.println(feedingInterval);
    display.display();

    checkButtonPress(upButton, 1, increaseInterval);
    checkButtonPress(downButton, 2, decreaseInterval);
    checkButtonPress(enterButton, 3, confirmInterval);
    checkButtonPress(modeButton, 0, cancelEditing);
  }
}

void saveFeedingIntervalToFirebase(int interval) { 
  String path = "/HISTORY/feedingInterval"; FirebaseJson json; 
  json.set("interval", interval); 
  
  if (!Firebase.RTDB.setJSON(&fbdo, path.c_str(), &json)) { 
   Serial.println("Error saving feeding interval:"); 
   Serial.println(fbdo.errorReason()); 
  } else {
    Serial.println("Feeding interval saved successfully!"); 
  }

}

void increaseAmount() {
 currentAmountIndex = (currentAmountIndex - 1 + 3) % 3;
}

void decreaseAmount() {
  currentAmountIndex = (currentAmountIndex + 1) % 3;
}

void confirmAmountSelection() {

 if (currentAmountIndex == 0) {
   feedDuration = 3;  // Little
  } else if (currentAmountIndex == 1) {
    feedDuration = 5;  // Just Right
  } else if (currentAmountIndex == 2) {
    feedDuration = 10;  // A Lot
  }

 saveFeedingAmountToFirebase(currentAmountIndex);
 isEditing = false;
 display.println("Saved!");
}


void saveFeedingAmountToFirebase(int amountIndex) {
  String feedingAmountStr;

    if (amountIndex == 0) {
      feedingAmountStr = "Little";
    } else if (amountIndex == 1) {
      feedingAmountStr = "Just Right";
    } else if (amountIndex == 2) {
      feedingAmountStr = "A Lot";
    }

  String path = "/HISTORY/feedingAmount";
  FirebaseJson json;
  json.set("amount", feedingAmountStr);
  json.set("duration", feedDuration);

    if (!Firebase.RTDB.setJSON(&fbdo, path.c_str(), &json)) {
      Serial.println("Error saving feeding amount:");
      Serial.println(fbdo.errorReason());
    } else {
      Serial.println("Feeding amount and duration saved successfully!");
    }
}

void saveFeedingTimeToFirebase(int hour, int minute) {

  String formattedTime = String(hour) + ":" + (minute < 10 ? "0" + String(minute) : String(minute));
  String path = "/HISTORY/feedingTime";
  FirebaseJson json;
  json.set("time", formattedTime);
    if (!Firebase.RTDB.setJSON(&fbdo, path.c_str(), &json)) {
      Serial.println("Error saving feeding time:");
      Serial.println(fbdo.errorReason());
    } else {
       Serial.println("Feeding time saved successfully!");
    }

 }