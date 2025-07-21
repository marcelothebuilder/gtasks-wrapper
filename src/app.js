const {
  app, BrowserWindow, protocol, session, net,
} = require('electron');
const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const storage = require('electron-json-storage');
const { chrome } = require('process');

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

  splash.loadFile('src/splash.html');
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
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  session.defaultSession.setProxy({ proxyRules: 'http=127.0.0.1:8888' }).then(() => {
    console.log('Proxy configurado.');
  }).catch((error) => {
    console.error('Erro ao configurar o proxy:', error);
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

  // const filter = {
  //   urls: ['<all_urls>']
  // };

  // session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
  //   console.log('URL requisitada:', details.url);

  //   // if requesting file, ignore
  //   if (details.url.startsWith('file://')) {
  //     callback({ cancel: false });
  //     return;
  //   }

  //   const request = net.request(details.url);

  //   request.on('response', (response) => {
  //     let body = [];
  //     response.on('data', (chunk) => {
  //       body.push(chunk);
  //     });
  //     response.on('end', () => {
  //       body = Buffer.concat(body);
  //       console.log('Body da resposta:', body.toString());
  //     });
  //   });

  //   request.end();
  //   callback({ cancel: true }); // Cancela a requisição original para substituir pela nossa.
  // });

  // session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
  //   console.log('URL requisitada:', details.url);
  //   callback({ cancel: false });
  // });

  // session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
  //   console.log('Headers sendo enviados:', details.requestHeaders);
  //   callback({ requestHeaders: details.requestHeaders });
  // });

  // session.defaultSession.webRequest.onCompleted(filter, (details) => {
  //   console.log('Requisição completa:', details.url);
  // });

  // session.defaultSession.webRequest.onErrorOccurred(filter, (details) => {
  //   console.log('Erro na requisição:', details.url, 'Erro:', details.error);
  // });

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

  app.on('ready', () => {
    protocol.handle('app', (req) => {
      const { host, pathname } = new URL(req.url);
      console.log(host);
      // if (host === 'bundle') {
      //   if (pathname === '/') {
      //     return new Response('<h1>hello, world</h1>', {
      //       headers: { 'content-type': 'text/html' },
      //     });
      //   }
      //   // NB, this checks for paths that escape the bundle, e.g.
      //   // app://bundle/../../secret_file.txt
      //   const pathToServe = path.resolve(__dirname, pathname);
      //   const relativePath = path.relative(__dirname, pathToServe);
      //   const isSafe = relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
      //   if (!isSafe) {
      //     return new Response('bad', {
      //       status: 400,
      //       headers: { 'content-type': 'text/html' },
      //     });
      //   }

      //   return net.fetch(pathToFileURL(pathToServe).toString());
      // } if (host === 'api') {
      //   return net.fetch(`https://api.my-server.com/${pathname}`, {
      //     method: req.method,
      //     headers: req.headers,
      //     body: req.body,
      //   });
      // }
    });

    protocol.interceptHttpProtocol('http', (request, callback) => {
      // const parsedUri = url.parse(request.url);

      // const filePath = path.join(__dirname, parsedUri.pathname);
      // request.url = `file://${filePath}`;

      console.log(request);
      callback(request);
    });

    protocol.interceptHttpProtocol('https', (request, callback) => {
      // const parsedUri = url.parse(request.url);

      // const filePath = path.join(__dirname, parsedUri.pathname);
      // request.url = `file://${filePath}`;

      console.log(request);
      callback(request);
    });
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

    protocol.registerSchemesAsPrivileged([
      {
        scheme: 'app',
        privileges: {
          standard: true,
          secure: true,
          supportFetchAPI: true,
        },
      },
    ]);

    app.whenReady().then(() => {
      startApp();

      let currentTab;
      const version = '1.0';

      console.log(chrome);

      chrome.tabs.query( // get current Tab
        {
          currentWindow: true,
          active: true,
        },
        (tabArray) => {
          currentTab = tabArray[0];
          chrome.debugger.attach({ // debug at current tab
            tabId: currentTab.id,
          }, version, onAttach.bind(null, currentTab.id));
        },
      );

      function onAttach(tabId) {
        chrome.debugger.sendCommand({ // first enable the Network
          tabId,
        }, 'Network.enable');

        chrome.debugger.onEvent.addListener(allEventHandler);
      }

      function allEventHandler(debuggeeId, message, params) {
        if (currentTab.id != debuggeeId.tabId) {
          return;
        }

        if (message == 'Network.responseReceived') { // response return
          chrome.debugger.sendCommand({
            tabId: debuggeeId.tabId,
          }, 'Network.getResponseBody', {
            requestId: params.requestId,
          }, (response) => {
            // you get the response body here!
            // you can close the debugger tips by:
            chrome.debugger.detach(debuggeeId);
          });
        }
      }
    });
  }

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
};

module.exports = { bootstrap };
