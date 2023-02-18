const { app, BrowserWindow } = require('electron');
const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const storage = require('electron-json-storage');

const gtasks = {
  mainWindow: null,
  isMainWindowHidden: true,
  tray: null,
  isQuiting: false,
  isStartingMinimized: false,
  icon: nativeImage.createFromPath(path.join(__dirname, '../resources/gtasks.png')),
};

const gotTheLock = app.requestSingleInstanceLock();

function hideMainWindow() {
  gtasks.mainWindow.hide();
}

function showMainWindow() {
  gtasks.mainWindow.show();
}

function refreshMenu() {
  gtasks.mainWindow.setMenu(Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Preferences',
      submenu: [
        // eslint-disable-next-line no-use-before-define
        getStartingMinimizedSubmenu(),
      ],
    },
  ]));
}

function getStartingMinimizedSubmenu() {
  if (!gtasks.isStartingMinimized) {
    return {
      label: 'Start minimized',
      type: 'checkbox',
      checked: false,
      click: async () => {
        gtasks.isStartingMinimized = true;
        await new Promise((resolve, reject) => {
          storage.set('isStartingMinimized', { value: true }, (error) => {
            if (error) return reject(error);
            return resolve();
          });
        });
        refreshMenu();
      },
    };
  }

  return {
    label: 'Start minimized',
    type: 'checkbox',
    checked: true,
    click: async () => {
      gtasks.isStartingMinimized = false;
      await new Promise((resolve, reject) => {
        storage.set('isStartingMinimized', { value: false }, (error) => {
          if (error) return reject(error);
          return resolve();
        });
      });
      refreshMenu();
    },
  };
}

const createWindow = () => {
  const splash = new BrowserWindow({
    width: 400,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    closable: false,
  });

  splash.loadFile('splash.html');
  splash.center();

  gtasks.mainWindow = new BrowserWindow({
    width: 600,
    height: 600,
    darkTheme: true,
    // maxWidth: 600,
    show: false,
    // webPreferences: {
    //     contextIsolation: false,
    //     nodeIntegration: true,
    //     preload: path.join(__dirname, 'inject.js')
    // },
    maximizable: false,
    icon: gtasks.icon,
    fullscreenable: false,
  });

  gtasks.mainWindow.once('ready-to-show', () => {
    setTimeout(() => splash.close(), 1000);

    new Promise((resolve, reject) => {
      storage.get('isStartingMinimized', true, (error, data) => {
        if (error) return reject(error);
        return resolve(data);
      });
    })
      .then((data) => {
        console.log('GOT DATA ========>', data);
        if (data.value) {
          gtasks.isStartingMinimized = true;
          console.log('MINIMIZING DATA ========>', data.value);
          // win.minimize();
        } else {
          gtasks.isStartingMinimized = false;
          console.log('SHOWING =>>>>>>>>>>>>>>>');
          showMainWindow();
        }
        refreshMenu(gtasks.mainWindow);
      })
      .catch((error) => {
        console.log('ERROR =========>', error);
      });
  });

  // win.setMenuBarVisibility(false)

  gtasks.mainWindow.loadURL('https://tasks.google.com/embed/?origin=https://calendar.google.com&fullWidth=1&forcehl=1&usegapi=1');
};

const startApp = () => {
  createWindow();

  app.on('before-quit', () => {
    gtasks.isQuiting = true;
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  gtasks.tray = new Tray(gtasks.icon);
  gtasks.tray.setToolTip('gTasks');
  gtasks.tray.setTitle('gTasks');

  gtasks.mainWindow.on('minimize', (event) => {
    event.preventDefault();
    hideMainWindow();
  });

  gtasks.mainWindow.on('close', (event) => {
    if (!gtasks.isQuiting) {
      event.preventDefault();
      hideMainWindow();
    }

    return false;
  });

  gtasks.tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Show App',
      click() {
        showMainWindow();
      },
    },
    {
      label: 'Quit',
      click() {
        gtasks.isQuiting = true;
        app.quit();
      },
    },
  ]));
};

const bootstrap = () => {
  if (!gotTheLock) {
    console.log('Couldn\'t get the lock');
    app.quit();
  } else {
    app.on('second-instance', () => {
      console.log('Someone is trying to open a second instance');
      console.log('myWindow', gtasks.mainWindow);
      // Someone tried to run a second instance, we should focus our window.
      if (gtasks.mainWindow) {
        console.log('isMinimized', gtasks.isMainWindowHidden);
        if (gtasks.isMainWindowHidden) {
          showMainWindow();
          gtasks.mainWindow.restore();
        }
        gtasks.mainWindow.focus();
      } else {
        console.log('no myWindow', gtasks.mainWindow);
      }
    });

    // Create env.myWindow, load the rest of the app, etc...

    app.whenReady().then(() => {
      startApp();
    });
  }

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
};

module.exports = { bootstrap };
