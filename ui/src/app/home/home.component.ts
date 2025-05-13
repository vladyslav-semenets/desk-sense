import { Component, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { getDatabase, ref, objectVal, query, orderByChild, startAt, endAt, limitToLast } from '@angular/fire/database';
import { FirebaseApp } from '@angular/fire/app';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { PusherService } from '../pusher/pusher.service';
import { CommonModule, NgIf } from '@angular/common';
import { Channel } from 'pusher-js';
import { fromUnixTime, startOfDay, endOfDay, differenceInSeconds, differenceInMinutes } from 'date-fns';
import { ElectronService } from '../core/services/electron.service';
import { take } from 'rxjs';

@Component({
    selector: 'app-home',
    imports: [MatButtonModule, MatDividerModule, MatIconModule, NgIf, CommonModule],
    standalone: true,
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
    public isWorking: WritableSignal<boolean> = signal(false);
    public isStanding: WritableSignal<boolean> = signal(false);
    public elapsedTime: WritableSignal<string | null> = signal(null);
    public isTimerOnPause: WritableSignal<boolean> = signal(false);
    public elapsedTimeTimer!: any;
    public items: Array<{
        date: number;
        distance: number;
        state: string;
    }> = [];
    public lastState!: { date: number; distance: number; state: string; };
    private _cachedTimes: Record<'sitting' | 'standing', string | null> = {sitting: null, standing: null};
    private _deskAppPusherChannel!: Channel;
    private readonly database;

    constructor(
        private readonly _pusherService: PusherService,
        private readonly _electronService: ElectronService,
    ) {
        this.database = getDatabase(inject(FirebaseApp));
    }

    public ngOnInit(): void {
        this._deskAppPusherChannel = this._pusherService.pusher.subscribe('private-desk-sense-channel') as Channel;
        this._electronService.beforeCloseWindow$.pipe(take(1)).subscribe(
            {
                next: () => this.ngOnDestroy(),
            },
        );
    }

    public ngOnDestroy(): void {
        this.stopWorking();
        this._deskAppPusherChannel?.unsubscribe();
    }

    public startWorking(): void {
        this.isWorking.set(true);
        this._deskAppPusherChannel.trigger('client-start-measuring', {});
        this.getLastState();
    }

    public stopWorking(): void {
        this._deskAppPusherChannel?.trigger('client-stop-measuring', {});
        this.isWorking.set(false);
        this.elapsedTime.set(null);
        this.isStanding.set(false);
        this._cachedTimes.sitting = null;
        this._cachedTimes.standing = null;
        this._deskAppPusherChannel?.unsubscribe();
        this.stopTimer();
    }

    public toggleTimer(): void {
        this.isTimerOnPause.set(!this.isTimerOnPause());
    }

    public getLastState(): void {
        const dbRef = query(
            ref(this.database, '/items'),
            orderByChild('date'),
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
                    if (this.items?.length) {
                        this.lastState = this.items?.[0];
                        this.stopTimer();
                        this.isStanding.set(this.lastState.state === 'stading');
                        this.startTimer(this.lastState.date);
                    }
                }
            },
            error: (error) => {
                console.error(error)
            },
        });
    }

    public startTimer(date: number): void {
        this.elapsedTime.set(this.isStanding() ? this._cachedTimes.sitting : this._cachedTimes.standing);
        let cachedElapsedTime = this.elapsedTime();
        let cachedElapsedTimeMinutes = 0;
        let cachedElapsedTimeSeconds = 0;

        if (cachedElapsedTime?.includes('minute')) {
            cachedElapsedTimeMinutes = parseInt(cachedElapsedTime, 10);
        } else if (cachedElapsedTime?.includes('second')) {
            cachedElapsedTimeSeconds = parseInt(cachedElapsedTime, 10);
        }

        this.elapsedTimeTimer = setInterval(() => {
            if (this.isTimerOnPause()) {
                return;
            }

            const now = new Date();
            const lastCreatedDate = fromUnixTime(date);
            const secondsDiff = Math.floor(differenceInSeconds(now, lastCreatedDate)) + cachedElapsedTimeSeconds;
            const minutesDiff = Math.floor(differenceInMinutes(now, lastCreatedDate)) + cachedElapsedTimeMinutes;
            this.elapsedTime.set(
                minutesDiff > 0 || minutesDiff === 1
                    ? `${minutesDiff} minute${minutesDiff > 1 ? 's' : ''}`
                    : `${secondsDiff} second${secondsDiff > 1 ? 's' : ''}`
            );

        }, 1000);
    }

    public stopTimer(): void {
        clearInterval(this.elapsedTimeTimer);

        if (this.isStanding()) {
            this._cachedTimes.sitting = this.elapsedTime();
        } else {
            this._cachedTimes.standing = this.elapsedTime();
        }
    }
}
