#include <FirebaseClient.h>

#include <WiFiClientSecure.h>

#include "database.h"

#include "env.h"

WiFiClientSecure wiFiClientSecure;
DefaultNetwork network;
AsyncClientClass client(wiFiClientSecure, getNetwork(network));

FirebaseApp app;
RealtimeDatabase Database;
UserAuth userAuth(FIREBASE_API_KEY, FIREBASE_USER_EMAIL, FIREBASE_USER_PASSWORD);
AsyncResult aResultNoCallback;

int count = 0;
bool signupOK = false;

void printResult(AsyncResult &aResult) {
    if (aResult.isEvent()) {
        Firebase.printf("[DB] Event task: %s, msg: %s, code: %d\n", aResult.uid().c_str(), aResult.appEvent().message().c_str(), aResult.appEvent().code());
    }

    if (aResult.isDebug()) {
        Firebase.printf("[DB] Debug task: %s, msg: %s\n", aResult.uid().c_str(), aResult.debug().c_str());
    }

    if (aResult.isError()) {
        Firebase.printf("[DB] Error task: %s, msg: %s, code: %d\n", aResult.uid().c_str(), aResult.error().message().c_str(), aResult.error().code());
    }
}

void waitForAuthenticationDB() {
    unsigned long ms = millis();
    while (app.isInitialized() && !app.ready() && millis() - ms < 120 * 1000) {
        JWT.loop(app.getAuth());
        printResult(aResultNoCallback);
    }
}

void printError(int code,
  const String & msg) {
  Serial.println();
  Firebase.printf("[DB] Error, msg: %s, code: %d\n", msg.c_str(), code);
}

void createDBRecord(const String & path, object_t json) {
  Serial.println();
  Serial.print("[DB] Creating record ...");

  bool status = Database.push<object_t>(client, path, json);
  if (status) {
    Serial.println();
    Serial.print("[DB] Record was created...");
    Serial.println();
  } else {
    printError(client.lastError().code(), client.lastError().message());
  }
}

RealtimeDatabase& connectToDB() {
  wiFiClientSecure.setInsecure();
  initializeApp(client, app, getAuth(userAuth), aResultNoCallback);
  app.getApp<RealtimeDatabase>(Database);
  Database.url(FIREBASE_DATABASE_URL);
  client.setAsyncResult(aResultNoCallback);
  return Database;
}