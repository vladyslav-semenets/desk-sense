#include <Arduino.h>

#include <ArduinoJson.h>

#include <WiFiClientSecure.h>

#include <FirebaseClient.h>

#include <SocketIOclient.h>

#include "time.h"

#include <math.h>

#include "wifi.util.h"

#include "database.h"

#include "websocket.util.h"

#define SOUND_SPEED 0.034
#define CM_TO_INCH 0.393701
#define SITTING_DISTANCE 70
#define STANDING_DISTANCE 90

WebSocketsClient webSocket;
RealtimeDatabase realtimeDBInstance;
String webSocketChannelName = "private-desk-sense-channel";
String startMeasuringEventName = "client-start-measuring";
String stopMeasuringEventName = "client-stop-measuring";
const int trigPin = 5;
const int echoPin = 18;
long duration;
float distanceCm = 0;
float prevDistanceCm = 0;
float distanceInch;
const char * ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 0;
const int daylightOffset_sec = 3600;
bool isSubscribed = false;
bool isNeedRunMeasuring = false;
unsigned long previousMillis = 0; // Stores the last time runMeasuring was executed
const unsigned long interval = 5000; // Interval in milliseconds (5 seconds)


int getTimestamp() {
  struct tm timeInfo;

  getLocalTime( & timeInfo);

  time_t timestamp = mktime(&timeInfo);

  return static_cast<int> (timestamp);
}

void processWebSockertMessage(JsonDocument payload) {
  const String event = payload["event"];

  if (event == startMeasuringEventName) {
    isNeedRunMeasuring = true;
  }

  if (event == stopMeasuringEventName) {
    isNeedRunMeasuring = false;
  }
}

void runMeasuring() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  duration = pulseIn(echoPin, HIGH);

  prevDistanceCm = distanceCm;
  distanceCm = duration * SOUND_SPEED / 2;

  if (
    prevDistanceCm == 0 ||
    (floor(distanceCm) != floor(prevDistanceCm) && abs(floor(distanceCm) - floor(prevDistanceCm)) > 1.0)
  ) {
    JsonWriter writer;

    object_t json, obj1, obj2, obj3;

    const int timestamp = getTimestamp();

    String state;

    if (floor(distanceCm) <= SITTING_DISTANCE) {
      state = "sitting";
    } else if (
      floor(distanceCm) >= STANDING_DISTANCE ||
      (floor(distanceCm) >= SITTING_DISTANCE && floor(distanceCm) <= STANDING_DISTANCE)
    ) {
      state = "stading";
    }

    writer.create(obj1, "distance", distanceCm);
    writer.create(obj2, "date", timestamp);
    writer.create(obj3, "state", state);
    writer.join(json, 3, obj1, obj2, obj3);

    createDBRecord("items", json);
  }

  Serial.print("Distance (cm): ");
  Serial.println(distanceCm);
}

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);

  connectToWifi();
  waitForWiFiConnection();

  webSocket = connectToWebsocketServer(processWebSockertMessage);

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  realtimeDBInstance = connectToDB();
}

void loop() {
  waitForAuthenticationDB(); 

  realtimeDBInstance.loop();
  webSocket.loop();

  if (webSocket.isConnected() && !isSubscribed) {
    isSubscribed = subscribeOnWebsocketChannel(webSocketChannelName, & webSocket);
  }

  unsigned long currentMillis = millis();

  if (isNeedRunMeasuring && (currentMillis - previousMillis >= interval)) {
    previousMillis = currentMillis;
    runMeasuring();
  }
}