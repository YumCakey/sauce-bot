var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

var AutoUpdater = require('auto-updater');

var autoupdater = new AutoUpdater({
    pathToJson: './app/',
    autoupdate: false,
    checkgit: true,
    jsonhost: 'raw.githubusercontent.com/YumCakey/sauce-bot/master/app/package.json',
    contenthost: 'github.com/YumCakey/sauce-bot/archive/master.zip',
    progressDebounce: 0,
    devmode: false
});

// State the events
autoupdater.on('git-clone', function() {
    console.log("You have a clone of the repository. Use 'git pull' to be up-to-date");
});
autoupdater.on('check.up-to-date', function(v) {
    console.info("You have the latest version: " + v);
});
autoupdater.on('check.out-dated', function(v_old, v) {
    console.warn("Your version is outdated. " + v_old + " of " + v);
    autoupdater.fire('download-update'); // If autoupdate: false, you'll have to do this manually.
    // Maybe ask if the'd like to download the update.
});
autoupdater.on('update.downloaded', function() {
    console.log("Update downloaded and ready for install");
    autoupdater.fire('extract'); // If autoupdate: false, you'll have to do this manually.
});
autoupdater.on('update.not-installed', function() {
    console.log("The Update was already in your folder! It's read for install");
    autoupdater.fire('extract'); // If autoupdate: false, you'll have to do this manually.
});
autoupdater.on('update.extracted', function() {
    console.log("Update extracted successfully!");
    console.warn("RESTART THE APP!");
});
autoupdater.on('download.start', function(name) {
    console.log("Starting downloading: " + name);
});
autoupdater.on('download.progress', function(name, perc) {
    process.stdout.write("Downloading " + perc + "% \033[0G");
});
autoupdater.on('download.end', function(name) {
    console.log("Downloaded " + name);
});
autoupdater.on('download.error', function(err) {
    console.error("Error when downloading: " + err);
});
autoupdater.on('end', function() {
    console.log("The app is ready to function");
});
autoupdater.on('error', function(name, e) {
    console.error(name, e);
});

// Start checking
autoupdater.fire('check');

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({resizable: true, frame: true, width: 510, height: 368, webPreferences: {plugins:true},icon: __dirname + '/images/SauceBotIcon.ico'});

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');
  /*mainWindow.webContents.openDevTools();
  mainWindow.webContents.on('devtools-opened', () => {
        setImmediate(() => {
            // do whatever you want to do after dev tool completely opened here
            mainWindow.focus();
        });
    });*/
  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});
