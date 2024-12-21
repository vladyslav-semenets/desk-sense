#include <Arduino.h>

#include <WiFi.h>

#define WIFI_SSID "PLAY_Swiatlowodowy_06C5"
#define WIFI_PASSWORD "Gx&8xX%hj9Gy"

void connectToWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.println();
  Serial.print("[Wi-Fi] Connecting...");
  Serial.println();
}

void waitForWiFiConnection() {
  while (WiFi.status() != WL_CONNECTED) {
    Serial.println();
    Serial.print("[Wi-Fi] Waiting for connection...");
    Serial.println();
    delay(300);
  }

  Serial.println();
  Serial.print("[Wi-Fi] Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();
}