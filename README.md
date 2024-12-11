# Automated Fish Feeder Project

Welcome to the Automated Fish Feeder project repository! This project was developed as part of our **APPSDEV** and **HCI** subjects.

## Overview

The Automated Fish Feeder is an IoT-based solution designed to automate the feeding process for fish. By utilizing an ESP32 microcontroller and a React-based application, this project aims to make fish care more convenient and reliable for pet owners.

## Features

- **Automated Feeding Schedule:** Set specific feeding times for your fish.
- **Manual Feeding Option:** Trigger feeding manually via the React app.
- **Mobile-Friendly UI:** User-friendly interface accessible from any device.
- **Feed Quantity Adjustment:** Control the amount of food dispensed.
- **Monitoring:** Keep track of feeding history and system status.

## Technologies Used

- **Hardware:**
  - ESP32 Microcontroller
  - Servo Motor for dispensing feed
  - Hopper for fish feed storage
- **Software:**
  - React (Frontend)
  - Firebase (Backend and Realtime Database)
  - Arduino IDE (ESP32 Programming)
  - CSS for UI Styling

## Installation

### Hardware Setup

1. Assemble the fish feeder using the ESP32, a servo motor, and a hopper.
2. Connect the ESP32 to your computer for programming.
3. Ensure proper wiring and test the servo motor for functionality.

### Software Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/virgocerco/Automated-Fish-Feeder
   ```
2. Navigate to the frontend directory and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Configure Firebase:
   - Add your Firebase project credentials to the `.env` file.
4. Deploy the React app:
   ```bash
   npm start
   ```
5. Upload the ESP32 code to the microcontroller using the Arduino IDE.

## Usage

1. Open the React app in your browser.
2. Log in or sign up to create an account.
3. Set up feeding schedules or manually trigger feed dispensing.
4. Monitor feeding history and adjust settings as needed.

## Acknowledgments

We would like to thank our professors and peers for their guidance and support throughout this project.

