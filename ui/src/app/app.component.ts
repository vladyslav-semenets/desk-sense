import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Auth, signOut, User, user } from '@angular/fire/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatButtonModule, MatDividerModule, MatIconModule, CommonModule],
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  public readonly currentUser: WritableSignal<User | null> = signal(null);
  private readonly _auth = inject(Auth);
  private readonly _router = inject(Router);

  public ngOnInit(): void {
    user(this._auth).subscribe(
      {
        next: (user) => {
          this.currentUser.set(user);
        },
      },
    );
  }

  async logout(): Promise<void> {
     await signOut(this._auth);
     void this._router.navigate(['auth']);
  }
}
