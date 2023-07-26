const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");
const resizeImg = require("resize-img");

process.env.NODE_ENV = "production";

const isDev = process.env.NODE_ENV !== "production";

//checling if os is mac or not as electrons works differently in that
const isMac = process.platform === "darwin";
let mainWindow;
function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "Image Resizer",
    width: isDev ? 1000 : 500,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // preload defines the script that loads before any other script here its prreloadjs as we need to bring the context bridge features
      nodeIntegration: true,
      contextIsolation: true,
    },
  });
  // open dev tools when in dev mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  //load the index html of main page
  mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"));
}

//template for menu bar
// const menu = [
//   {
//     label: "File",
//     submenu: [
//       {
//         label: "Quit",
//         click: () => app.quit(),
//         accelerator: "CmdOrCtrl+W", //accelators are shortcuts
//       },
//     ],
//   },
// ];
//built in menu bar template
const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  {
    role: "fileMenu",
  },
  //now for non mac
  ...(!isMac
    ? [
        {
          label: "Help",
          submenu: [
            {
              label: "About",
              click: createAboutWindow, //function to be run on clicking
            },
          ],
        },
      ]
    : []),
];

function createAboutWindow() {
  const aboutWindow = new BrowserWindow({
    title: "About Image Resizer",
    width: 300,
    height: 300,
  });

  aboutWindow.loadFile(path.join(__dirname, "./renderer/about.html"));
}

app.whenReady().then(() => {
  createMainWindow();
  //create menu
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  //remove mainwindow after closing app
  mainWindow
    .on("closed", () => {
      mainWindow = null;
    })

    //create window if not present but  app was still running in bg like in mac
    .app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

//response to ipcRenderer resize
ipcMain.on("image:resize", (e, options) => {
  options.dest = path.join(os.homedir(), "imageresizer");
  resizeImage(options);
});

async function resizeImage({ imgPath, height, width, dest }) {
  try {
    const newPath = await resizeImg(fs.readFileSync(imgPath), {
      width: +width,
      height: +height, //height comes as a string so we add + sign to it to make it a number
    });

    const filename = path.basename(imgPath);
    //create dest folder if it does not exits
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    //write file to dest
    fs.writeFileSync(path.join(dest, filename), newPath);
    //send success message
    mainWindow.webContents.send("image:done");
    //open destination folder
    shell.openPath(dest);
  } catch (error) {
    console.log(error);
  }
}

// To close on macOS as mac keeps app running in bg even if the no window is present note that window is the box on whcih we interact
app.on("window-all-closed", () => {
  if (!isMac) app.quit();
});
