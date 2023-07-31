const { contextBridge, ipcRenderer, shell } = require("electron");
const marked = require("marked");
const path = require("path");
const fs = require("fs");

contextBridge.exposeInMainWorld("api", {
  	on: (channel, callback) => ipcRenderer.on(channel, callback),
	send: (channel, ...args) => ipcRenderer.send(channel, ...args),
	invoke: (channel, ...args) => ipcRenderer.invoke(channel, args),

	newWindow: (paths) => ipcRenderer.send("window:open-new", paths),

	setTitle: (t) => ipcRenderer.send("window:set-title", t),
	setTheme: (t) => ipcRenderer.send("window:set-theme", t),
	setActiveMenubar: () => ipcRenderer.send("menubar:activate"),
	setDocumentEdited: (e) => ipcRenderer.send("window:doc-edited", e),

  	showOpenFileDialog: (options) => ipcRenderer.invoke("dialog:open-file", options),
	showSaveFileDialog: (options) => ipcRenderer.invoke("dialog:save-file", options),
	showMessageBox: (options) => ipcRenderer.invoke("dialog:message-box", options),

	showFileInFinder: (path) => { if (path != "") shell.showItemInFolder(path); },

  	decodeBuffer: (buffer) => {
		const decoder = new TextDecoder("utf-8");
		const decodedString = decoder.decode(buffer);
		return decodedString;
	},
	readFile: (path, callback) => fs.readFile(path, callback),
	readFileSync: (path) => fs.readFileSync(path).toString(),
	writeFile: (path, content, callback) => fs.writeFile(path, content, { encoding: "utf-8" }, callback),
	MDtoHTML: (text) => { return marked.marked(text, { async: false, mangle: false, headerIds: false }); },

	wait: (ms) => {
		return new Promise(resolve => setTimeout(resolve, ms));
	},

  	getSettings: () => ipcRenderer.invoke("store:load-settings"),
	storeSetting: (key, value, store) => ipcRenderer.send("store:set-setting", key, value, store),

  	path: path
});