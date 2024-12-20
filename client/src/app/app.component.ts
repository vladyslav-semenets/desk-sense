import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { getDatabase, ref, objectVal, query, orderByChild, startAt, endAt, limitToLast } from '@angular/fire/database';
import { FirebaseApp } from '@angular/fire/app';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { PusherService } from './pusher/pusher.service';
import { CommonModule, NgIf } from '@angular/common';
import { Channel } from 'pusher-js';
import { fromUnixTime, startOfDay, endOfDay, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatButtonModule, MatDividerModule, MatIconModule, NgIf, CommonModule],
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  public isWorking: WritableSignal<boolean> = signal(false);
  public isStading: WritableSignal<boolean> = signal(false);
  public elapsedTime: WritableSignal<string> = signal('0');
  public elapsedTimeTimer!: any;
  public items: Array<{
    date: number;
    distance: number;
    state: string;
  }> = [];
  // protected readonly testObjectValue$;
  private _deskAppPusherChannel!: Channel;
  private readonly database;
  constructor(private _pusherService: PusherService) {
    this.database = getDatabase(inject(FirebaseApp));
    //
    // this.testObjectValue$ = objectVal(ref(this.database, "/")).subscribe({
    //   next: (data) => {console.log(data)},
    // })
  }

  public ngOnInit(): void {
    this._deskAppPusherChannel = this._pusherService.pusher.subscribe('private-desk-sense-channel') as Channel;
  }

  public startWorking(): void {
    this.isWorking.set(true);
    this.isStading.set(true);
    this._deskAppPusherChannel.trigger('client-start-measuring', {});
    this.getItems();
  }

  public stopWorking(): void {
    this.isWorking.set(!this.isWorking());
    this._deskAppPusherChannel.trigger('client-stop-measuring', {});
    this.elapsedTime.set('0');
    this.stopTimer();
  }

  public getItems(): void {
    const dbRef = query(
      ref(this.database, "/items"),
      orderByChild("date"),
      startAt(Math.floor(startOfDay(new Date()).getTime() / 1000)),
      endAt(Math.floor(endOfDay(new Date()).getTime() / 1000)),
      limitToLast(1),
    );

    objectVal(dbRef).subscribe({
      next: (data) => {
        if (data) {
          this.items = Object.entries(data).map(([key, value]: [string, any]) => ({
            id: key,
            ...value,
          }));
          this.isStading.set(this.items?.[0]?.state === 'stading');
          this.stopTimer();
          this.startTimer(this.items?.[0]?.date);
        }
      },
      error: (err) => console.error(err),
    });
  }

  public startTimer(date: number): void {
    this.elapsedTimeTimer = setInterval(() => {
      const now = new Date();
      const last = fromUnixTime(date);
      const secondsDiff = differenceInSeconds(now, last);
      this.elapsedTime.set(`${Math.floor(secondsDiff/60)}`);
    }, 1000);
  }

  public stopTimer(): void {
    clearInterval(this.elapsedTimeTimer);
  }
}
