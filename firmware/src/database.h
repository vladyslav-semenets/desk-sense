#ifndef DATABASE_H
#define DATABASE_H
#include <Arduino.h>
#include <FirebaseClient.h>
RealtimeDatabase& connectToDB();
void createDBRecord(const String &path, object_t json);
void waitForAuthenticationDB();
#endif
