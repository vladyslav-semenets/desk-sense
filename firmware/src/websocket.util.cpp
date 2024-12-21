#include <Arduino.h>

#include <ArduinoJson.h>

#include <WebSocketsClient.h>

#include <HTTPClient.h>

#include <Crypto.h>

#include "websocket.util.h"

WebSocketsClient ws;
ProcessWebSocketMessageCallback processWebSocketMessageCallback;

const char * pusherKey = "366d78f54727f5e9b7d1";
const char * pusherSecret = "eda2fe887b30a107b7c3";
const char * pusherCluster = "eu";
String pusherConnectionEstablishedEventName = "pusher:connection_established";
String pusherSubscribeEventName = "pusher:subscribe";
String pusherSocketId;

String getAuthCode(String channelName) {
  SHA256HMAC hmac((const byte * ) pusherSecret, strlen(pusherSecret));
  String dataToHash = pusherSocketId + ":" + channelName;
  hmac.doUpdate((byte * ) dataToHash.c_str(), strlen(dataToHash.c_str()));

  byte authCode[SHA256HMAC_SIZE];
  hmac.doFinal(authCode);

  char hmacResult[SHA256HMAC_SIZE * 2 + 1];
  for (size_t i = 0; i < SHA256HMAC_SIZE; i++) {
    sprintf( & hmacResult[i * 2], "%02x", authCode[i]);
  }

  return String(pusherKey) + ":" + String(hmacResult);
}

bool subscribeOnWebsocketChannel(String channelName, WebSocketsClient * webSocketsClient) {
  if (pusherSocketId.isEmpty()) {
    return false;
  }

  JsonDocument jsonDoc;
  String jsonString;

  jsonDoc["event"] = pusherSubscribeEventName;
  JsonObject data = jsonDoc["data"].to<JsonObject> ();
  data["auth"] = getAuthCode(channelName);
  data["channel"] = channelName;

  serializeJson(jsonDoc, jsonString);

  return webSocketsClient->sendTXT(jsonString);
}

void onWebSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  JsonDocument doc;
  DeserializationError error;
  String payloadString;

  switch (type) {
  case WStype_DISCONNECTED:
    Serial.println("[WB] Disconnected!");
    break;
  case WStype_CONNECTED: {
    Serial.println("[WB] Connected to WebSocket server");
    break;
  }
  case WStype_TEXT: {
    error = deserializeJson(doc, payload);

    if (error) {
      Serial.print("[WB] deserializeJson() failed: ");
      Serial.println(error.c_str());
      return;
    }

    const String event = doc["event"];

    if (event == pusherConnectionEstablishedEventName) {
      JsonDocument pusherResponse;
      JsonDocument pusherData;
      deserializeJson(pusherData, doc["data"]);
      pusherSocketId = (const char *) pusherData["socket_id"];
    }
    processWebSocketMessageCallback(doc);
    break;
  }
  case WStype_BIN:
    Serial.println("[WB] Binary message received");
    break;
  case WStype_ERROR:
    Serial.println("[WB] error");
    break;
  }
}

WebSocketsClient & connectToWebsocketServer(ProcessWebSocketMessageCallback callback) {
  processWebSocketMessageCallback = callback;

  String host = String("ws-" + String(pusherCluster) + ".pusher.com");
  String path = String("/app/" + String(pusherKey) + "?protocol=7&client=js&version=8.4.0-rc2&flash=false");

  Serial.println();
  Serial.print("[WB] Connecting to WebSocket server...");
  Serial.println();

  ws.setExtraHeaders(WEBSOCKETS_STRING("Origin: http://192.168.0.103"));
  ws.beginSSL(host.c_str(), 443, path.c_str(), "", "");
  ws.onEvent(onWebSocketEvent);
  ws.setReconnectInterval(2000);
  ws.enableHeartbeat(1000, 2000, 2);

  return ws;
}