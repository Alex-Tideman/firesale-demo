const { app, BrowserWindow, Menu, dialog } = require('electron')
const fs = require('fs')
const windows = new Set()
const fileWatchers = new Map();

const createWindow = exports.createWindow = (file) => {
  let newWindow = new BrowserWindow({ show: false });
  windows.add(newWindow)

  newWindow.loadURL(`file://${__dirname}/index.html`);


  newWindow.once('ready-to-show', () => {
    if (file) {
      openFile(newWindow, file)
    }
    newWindow.show();
  });

  newWindow.on('close', (event) => {
    if(newWindow.isDocumentEdited()) {
      const result = dialog.showMessageBox(newWindow, {
        type: 'warning',
        title: 'Quit with Unsaved Changes?',
        message: 'You have unsaved changes. Are you sure you want to quit?',
        buttons: [
          'Quit Anyway',
          'Cancel'
        ],
        defaultId: 1,
        cancelId: 1
      })

      if(result === 0) newWindow.destroy()
    }
  });

  newWindow.on('closed', () => {
    windows.delete(newWindow)
    stopWatchingFile(newWindow);
    newWindow = null
  });
}

const getFileFromUserSelection = (targetWindow) => {
  let files = dialog.showOpenDialog(targetWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Markdown Files', extensions: ['md', 'markdown', 'txt'] }
    ]
  })

  if (!files) { return }

  return files[0]
}

const openFile = exports.openFile = (targetWindow, file = getFileFromUserSelection(targetWindow)) => {
  let content = fs.readFileSync(file).toString()
  app.addRecentDocument(file);
  startWatchingFile(targetWindow, file);

  targetWindow.webContents.send('file-opened', file, content)
  targetWindow.setRepresentedFilename(file)
}

const saveFile = exports.saveFile = (targetWindow, content) => {
  let fileName = dialog.showSaveDialog(targetWindow, {
    title: 'Save HTML Output',
    defaultPath: app.getPath('documents'),
    filters: [
      { name: 'HTML Files', extensions: ['html'] }
    ]
  });

  if (!fileName) { return }

  fs.writeFileSync(fileName, content)
};

const startWatchingFile = (targetWindow, file) => {
  stopWatchingFile(targetWindow);

  const watcher = fs.watch(file, (event) => {
    if (event === 'change') {
      const content = fs.readFileSync(file).toString();
      targetWindow.webContents.send('file-changed', file, content);
    }
  });

  fileWatchers.set(targetWindow, watcher);
};

const stopWatchingFile = (targetWindow) => {
  if (fileWatchers.has(targetWindow)) {
    console.log('filewatcher: ', fileWatchers)
    fileWatchers.get(targetWindow).close();
    fileWatchers.delete(targetWindow);
  }
};

app.on('ready', function () {
  console.log('The application is ready.')
  let menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  createWindow()
})

app.on('will-finish-launching', () => {
  app.on('open-file', (event, file) => {
    event.preventDefault();
    createWindow(file);
  });
});

const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open',
        accelerator: 'CmdOrCtrl+O',
        click() { openFile(); },
      },
      {
        label: 'Save',
        accelerator: 'CmdOrCtrl+S',
        click() { saveFile(); }
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        role: 'undo'
      },
      {
        label: 'Redo',
        accelerator: 'Shift+CmdOrCtrl+Z',
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut'
      },
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy'
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste'
      },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectall'
      },
    ]
  }
];

if (process.platform == 'darwin') {
  var name = app.getName();
  template.unshift({
    label: name,
    submenu: [
      {
        label: 'About ' + name,
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        label: 'Services',
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        label: 'Hide ' + name,
        accelerator: 'Command+H',
        role: 'hide'
      },
      {
        label: 'Hide Others',
        accelerator: 'Command+Alt+H',
        role: 'hideothers'
      },
      {
        label: 'Show All',
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click() { app.quit(); }
      },
    ]
  });
}
