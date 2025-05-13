import { Component, inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import cookies from 'js-cookie';
import { GoogleAuthProvider, signInWithPopup, beforeAuthStateChanged, onIdTokenChanged } from 'firebase/auth';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { UserCredential } from '@firebase/auth';

@Component({
  selector: 'app-auth',
  standalone: true,
  template: `
    <button mat-raised-button (click)="loginWithGoogle()">Log in with Google</button>
  `,
  imports: [MatButtonModule, CommonModule]
})
export class AuthComponent implements OnDestroy {
  private readonly _auth = inject(Auth);
  private readonly _router = inject(Router);
  private readonly _unsubscribeFromOnIdTokenChanged: (() => void) | undefined;
  private readonly _unsubscribeFromBeforeAuthStateChanged: (() => void) | undefined;

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      this._unsubscribeFromOnIdTokenChanged = onIdTokenChanged(this._auth, async (user) => {
        if (user) {
          const idToken = await user.getIdToken();
          cookies.set('__session', idToken);
          void this._router.navigate(['home']);
        } else {
          cookies.remove('__session');
        }
      });

      let priorCookieValue: string|undefined;
      this._unsubscribeFromBeforeAuthStateChanged = beforeAuthStateChanged(this._auth, async (user) => {
        priorCookieValue = cookies.get('__session');
        const idToken = await user?.getIdToken();
        if (idToken) {
          cookies.set('__session', idToken);
        } else {
          cookies.remove('__session');
        }
      }, async () => {
        if (priorCookieValue) {
          cookies.set('__session', priorCookieValue);
        } else {
          cookies.remove('__session');
        }
      });
    }
  }

  public ngOnDestroy(): void {
    this._unsubscribeFromBeforeAuthStateChanged?.();
    this._unsubscribeFromOnIdTokenChanged?.();
  }

  public async loginWithGoogle(): Promise<UserCredential> {
    return await signInWithPopup(this._auth, new GoogleAuthProvider());
  }
}
