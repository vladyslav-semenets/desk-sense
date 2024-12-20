import { Injectable } from '@angular/core';
import Pusher from 'pusher-js';

@Injectable({ providedIn: 'root' })
export class PusherService {
  public readonly pusher: Pusher;
  constructor() {
    this.pusher = new Pusher(import.meta.env.NG_APP_PUSHER_APP_KEY, {
      cluster: import.meta.env.NG_APP_PUSHER_CLUSTER,
      authEndpoint: "http://127.0.0.1:8686/pusher/auth"
    });
  }
}
