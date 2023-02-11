const { app, BrowserWindow, application } = require('electron')
const { Tray, Menu, nativeImage } = require('electron')
const path = require('path');


let isQuiting;
let tray;

const icon = nativeImage.createFromPath('resources/gtasks.png');

const createWindow = () => {

    var splash = new BrowserWindow({
        width: 400,
        height: 400,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        closable: false
    });

    splash.loadFile('splash.html');
    splash.center();


    const win = new BrowserWindow({
        width: 600,
        height: 600,
        darkTheme: true,
        maxWidth: 600,
        show: false,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            preload: path.join(__dirname, 'inject.js')
        },
        maximizable: false,
        icon: icon,
        fullscreenable: false,
    })
    win.once('ready-to-show', () => {
        setTimeout(() => splash.close(), 1000);
        win.show();
    })

    win.setMenuBarVisibility(false)

    win.loadURL('https://tasks.google.com/embed/?origin=https://calendar.google.com&fullWidth=1&forcehl=1&usegapi=1');

    return win;
}

app.whenReady().then(() => {
    const win = createWindow()

    app.on('before-quit', function () {
        isQuiting = true;
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })


    tray = new Tray(icon)
    tray.setToolTip('gTasks')
    tray.setTitle('gTasks')

    win.on('minimize', function (event) {
        event.preventDefault();
        win.hide();
    });

    win.on('close', function (event) {
        if (!isQuiting) {
            event.preventDefault();
            win.hide();
        }

        return false;
    })

    tray.setContextMenu(Menu.buildFromTemplate([
        {
            label: 'Show App', click: function () {
                win.show();
            }
        },
        {
            label: 'Quit', click: function () {
                isQuiting = true;
                app.quit();
            }
        }
    ]));

})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

