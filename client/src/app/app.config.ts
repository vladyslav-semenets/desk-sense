import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp({"projectId":"esp32-943ad","appId":"1:377441967702:web:03463434486955e10865f7","databaseURL":"https://esp32-943ad-default-rtdb.europe-west1.firebasedatabase.app","storageBucket":"esp32-943ad.firebasestorage.app","apiKey":"AIzaSyAaszM8XuzMKlEa8sFb5A1tWPqAF3Zj29Q","authDomain":"esp32-943ad.firebaseapp.com","messagingSenderId":"377441967702","measurementId":"G-MPFQ2XFSX9"})),
    provideAuth(() => getAuth()),
    provideDatabase(() => getDatabase()), provideAnimationsAsync()],
};
