import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  public ipcRenderer!: typeof ipcRenderer;
  public webFrame!: typeof webFrame;
  public childProcess!: typeof childProcess;
  public fs!: typeof fs;
  public beforeCloseWindow$: ReplaySubject<void> = new ReplaySubject<void>(1);

  constructor() {
    if (this.isElectron) {
      this.ipcRenderer = (window as any).require('electron').ipcRenderer;
      this.webFrame = (window as any).require('electron').webFrame;

      this.fs = (window as any).require('fs');

      this.childProcess = (window as any).require('child_process');
      this.childProcess.exec('node -v', (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout:\n${stdout}`);
      });

      this.ipcRenderer.once('window:before-close', () => this.beforeCloseWindow$.next());
    }
  }

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }
}
