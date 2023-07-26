// this file brings the facilities of npm packages to vanilla js cile i.e RendererJs using context bridges
const { contextBridge, ipcRenderer } = require("electron");
const os = require("os");
const path = require("path");
const Toastify = require("toastify-js");
contextBridge.exposeInMainWorld("versions", {
  homedir: () => os.homedir(), // homedir will do the following operation usde like versions.homedir
});
contextBridge.exposeInMainWorld("path", {
  join: (...args) => path.join(...args), //path.join works as path.join taking args
});
contextBridge.exposeInMainWorld("Toastify", {
  toast: (options) => Toastify(options).showToast(), //toast command of toastify will be used to handle errors
});
contextBridge.exposeInMainWorld("ipcRenderer", {
  // ipcRenderer is an event emitter basically it defines what action needs to be done on occurence of some event (defined by user)
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) =>
    ipcRenderer.on(channel, (event, ...args) => func(...args)),
});
