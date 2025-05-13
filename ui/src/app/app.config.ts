import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthGuardModule } from '@angular/fire/auth-guard';

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({eventCoalescing: true}),
        provideRouter(routes),
        provideFirebaseApp(() => initializeApp({
            projectId: import.meta.env.NG_APP_FIREBASE_PROJECT_ID,
            appId: import.meta.env.NG_APP_FIREBASE_APP_ID,
            databaseURL: import.meta.env.NG_APP_FIREBASE_DATABASE_URL,
            storageBucket: import.meta.env.NG_APP_FIREBASE_STORAGE_BUCKET,
            apiKey: import.meta.env.NG_APP_FIREBASE_API_KEY,
            authDomain: import.meta.env.NG_APP_FIREBASE_AUTH_DOMAIN,
            messagingSenderId: import.meta.env.NG_APP_FIREBASE_MESSAGING_SENDER_ID,
            measurementId: import.meta.env.NG_APP_FIREBASE_MEASUREMENT_ID,
        })),
        provideAuth(() => getAuth()),
        provideDatabase(() => getDatabase()), provideAnimationsAsync(),
        importProvidersFrom(AuthGuardModule),
    ],
};
