#ifndef WEBSOCKET_UTIL_H
#define WEBSOCKET_UTIL_H
#include <Arduino.h>
#include <ArduinoJson.h>
#include <SocketIOclient.h>
typedef void (*ProcessWebSocketMessageCallback)(JsonDocument payload);
WebSocketsClient& connectToWebsocketServer(ProcessWebSocketMessageCallback callback);
bool subscribeOnWebsocketChannel(String channelName, WebSocketsClient *webSocketsClient);
#endif
