import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'node:url';
import * as fs from 'fs';
import { spawn } from 'child_process';
let win = null;
const args = process.argv.slice(1), serve = args.some(val => val === '--serve');
let serverProcess;
function runServer() {
    console.log('runServer');
    serverProcess = spawn('node', [
        path.join(fileURLToPath(import.meta.url), '../../../server/index.js'),
    ]);
}
function stopServer() {
    serverProcess?.kill('SIGINT');
}
function createWindow() {
    win = new BrowserWindow({
        x: 0,
        y: 0,
        width: 400,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            allowRunningInsecureContent: (serve),
            contextIsolation: false,
        },
    });
    runServer();
    if (serve) {
        import('electron-debug').then(electronDebug => {
            electronDebug.default();
        });
        import('electron-reloader').then((electronReloader) => {
            const module = {
                filename: fileURLToPath(import.meta.url),
                children: [],
            };
            electronReloader.default(module);
        });
        void win.loadURL('http://localhost:4200');
    }
    else {
        let pathIndex = './index.html';
        if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
            pathIndex = '../dist/index.html';
        }
        const url = new URL(path.join('file:', __dirname, pathIndex));
        void win.loadURL(url.href);
    }
    win?.on('close', () => {
        win?.webContents?.send('window:before-close');
        setTimeout(() => {
            win?.destroy();
        }, 1000);
    });
    win.on('closed', () => win = null);
    return win;
}
try {
    app.on('ready', () => setTimeout(createWindow, 400));
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
            stopServer();
        }
    });
    app.on('activate', () => {
        if (win === null) {
            createWindow();
        }
    });
}
catch (e) {
    console.error(e);
}
//# sourceMappingURL=main.mjs.map