const { app, BrowserWindow, Menu, ipcMain, nativeTheme, dialog, shell } = require("electron");
const store = require("../utils/store");
const path = require("path");

/*App Informations*/
const appInfo = {
  name: "MarkdownXpert",
  version: app.getVersion(),
  os: {
    mac: process.platform === "darwin",
    win: process.platform === "win32",
    linux: process.platform === "linux"
  }
}

/*URLs*/
const URLs = {
	bugs: "https://github.com/lnzdev/markdownxpert/issues",
	repo: "https://github.com/lnzdev/markdownxpert",
	twitter: "https://twitter.com/lnzdev"
}

/*Window Data Store*/
const windowData = new store({
	configName: "win-data",
	defaults: {
		windowConfig: {
			x: undefined,
			y: undefined,
			width: 900,
			height: 600,
			maximized: false,
		},
	},
});

/*User Data Store*/
const userData = new store({
	configName: "user-data",
	defaults: {
		previewConfig: {
			x: undefined,
			y: undefined,
			width: 400,
			height: 600,
			alwaysOnTop: true
		},
		appConfig: {
			theme: "system",
			statusbar: true,
			toolbar: true
		},
		editorConfig: {
			fontSize: 15,
			lineCounter: false,
			indentGuides: false,
			wordwrap: true,
			tabSpaces: 4
		}
	}
});

/*Create Window*/
let pathsToOpen = undefined;
function initWindow(callerwin, filePaths = []) {
	let { x, y, width, height, maximized } = windowData.get("windowConfig");
	pathsToOpen = filePaths;

	const win = new BrowserWindow({
		...x && { x },
		...y && { y },
		icon: appInfo.os.mac ?
		path.join(__dirname, "../../build/icon.icns") : appInfo.os.win ?
		path.join(__dirname, "../../build/icon.ico") :
		path.join(__dirname, "../../build/icon.png"),
		title: appInfo.name,
		width: width,
		height: height,
		minWidth: 400,
		minHeight: 400,
		webPreferences: {
			devTools: false,
			webSecurity: true,
			nodeIntegration: true,
			contextIsolation: true,
			preload: path.join(__dirname, "../utils/preload.js")
		}
	});

	if (callerwin) {
		win.setPosition(
			callerwin.getPosition()[0] + 30,
			callerwin.getPosition()[1] + 30);
	}

  	win.loadFile(path.join(__dirname, "../renderer/index.html"));
	win.webContents.on("before-input-event", (event, input) => win.webContents.send("window:keyboard-input", input));

	win.on("focus", () => win.webContents.send("window:focus"));
	win.on("moved", () => {
		const { x, y, width, height } = win.getBounds();
		const prev = windowData.get("windowConfig");
		windowData.set("windowConfig", {
			...prev,
			...{ x, y, width, height },
		});
	});
	win.on("resized", () => {
		const { x, y, width, height } = win.getBounds();
		const prev = windowData.get("windowConfig");
		windowData.set("windowConfig", {
			...prev,
			...{ x, y, width, height },
		});
	});

	win.once("ready-to-show", () => {
		win.show();
		if (maximized) { win.maximize(); }
  	});

	win.on("close", (e) => {
		if (win.documentEdited) {
			e.preventDefault();
			e.returnValue = "";

			win.webContents.send("window:want-close");
		}
	});
}

/*Window*/
ipcMain.on("window:can-close", (event) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	win.webContents.send("livepreview:closed");
	previewWin = undefined;
	win.destroy();
});
ipcMain.on("window:open-new", (event, filePaths) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	initWindow(win, filePaths);
});
ipcMain.on("window:set-title", (event, title) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	win.setTitle(title);
});
ipcMain.on("window:set-theme", (event, theme) => nativeTheme.themeSource = theme);
ipcMain.on("window:doc-edited", (event, edited) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	win.setDocumentEdited(edited);
});
ipcMain.on("window:add-file-to-recent", (e, filepath) => app.addRecentDocument(filepath));

/*User Store*/
ipcMain.handle("store:load-settings", () => {
	const appConfig = userData.get("appConfig");
	const editorConfig = userData.get("editorConfig");
	const configsPath = userData.getFilePath();
	return {
		appConfig,
		editorConfig,
		configsPath,
		pathsToOpen,
		appInfo,
		URLs
	};
});
ipcMain.on("store:set-setting", (_, key, value, store) => {
	const conf = userData.get(store);
	conf[key] = value;
	userData.set(store, conf);
});

/*Dialogs*/
ipcMain.handle("dialog:open-file", (event, options) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	return dialog.showOpenDialog(win, options);
});
ipcMain.handle("dialog:save-file", (event, options) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	return dialog.showSaveDialog(win, options);
});
ipcMain.handle("dialog:message-box", (event, options) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	return dialog.showMessageBox(win, options);
});

/*About*/
function showAboutPopup(caller) {
	dialog.showMessageBox(caller, {
		type: "info",
		title: "About " + appInfo.name,
		message: appInfo.name,
		detail: `MarkdownXpert is a powerful and intuitive Markdown editor for content creators, writers, and developers.\n\nApp Version: ${appInfo.version}\nElectron: ${process.versions.electron}\nChromium: ${process.versions.chrome}\nNode.js: ${process.versions.node}\nv8: ${process.versions.v8}`
	});
}

/*Menubar*/
ipcMain.on("menubar:activate", (event) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	const meta = appInfo.os.mac ? "Cmd+" : "CTRL+";

	const menubar = Menu.buildFromTemplate([
		...(appInfo.os.mac ? [{
			label: appInfo.name,
			role: "appMenu",
			submenu: [
				{
					label: "About " + appInfo.name,
					click: () => showAboutPopup(win)
				},
				{ type: "separator" },
				{
					label: "Settings",
					accelerator: meta + ",",
					click: () => win.webContents.send("app:settings")
				},
				{ type: "separator" },
				{ role: "services" },
				{ type: "separator" },
				{ role: "hide" },
				{ role: "hideOthers" },
				{ role: "unhide" },
				{ type: "separator" },
				{
					label: "Quit " + appInfo.name,
					role: "quit"
				}
			]
		}] : []),
		{
			label: "File",
			role: "fileMenu",
			submenu: [
				{
					label: "New...",
					accelerator: meta + "N",
					click: () => win.webContents.send("file:new")
				},
				{
					label: "New Window",
					accelerator: meta + "SHIFT+N",
					click: () => win.webContents.send("file:new-window")
				},
				{ type: "separator" },
				{
					label: "Open...",
					accelerator: meta + "O",
					click: () => win.webContents.send("file:open")
				},
				...(appInfo.os.mac ? [{
					label: "Open Recent",
					role: "recentdocuments",
					submenu: [
						{
							label: "Clear Recent",
							role: "clearrecentdocuments"
						}
					]
				}] : []),
				{ type: "separator" },
				{
					label: "Save",
					accelerator: meta + "S",
					click: () => win.webContents.send("file:save")
				},
				{
					label: "Save As...",
					accelerator: meta + "SHIFT+S",
					click: () => win.webContents.send("file:save-as")
				},
				{ type: "separator" },
				{
					label: `Reveal in ${appInfo.os.mac ? "Finder" : "File Explorer"}`,
					accelerator: meta + "ALT+R",
					click: () => win.webContents.send("file:reveal")
				},
				{ type: "separator" },
				{
					label: "Export HTML",
					click: () => win.webContents.send("file:export-html")
				},
				{ type: "separator" },
				{
					label: appInfo.os.mac ? "Close Window" : appInfo.os.win ? "Exit" : "Close " + appInfo.name,
					role: appInfo.os.mac ? "close" : "quit"
				}
			]
		},
		{
			label: "Edit",
			role: "editMenu",
			submenu: [
				{
					label: "Undo",
					accelerator: meta + "Z",
					click: () => win.webContents.send("edit:undo")
				},
				{
					label: "Redo",
					accelerator: appInfo.os.win ? meta + "Y" : meta + "SHIFT+Z",
					click: () => win.webContents.send("edit:redo")
				},
				{ type: "separator" },
				{
					label: "Copy",
					accelerator: meta + "C",
					role: "copy"
				},
				{
					label: "Cut",
					accelerator: meta + "X",
					role: "cut"
				},
				{
					label: "Paste",
					accelerator: meta + "V",
					role: "paste"
				},
				{
					label: "Delete",
					accelerator: "DELETE",
					role: "delete"
				},
				{ type: "separator" },
				{
					label: "Find",
					accelerator: meta + "F",
					click: () => win.webContents.send("edit:find")
				},
				{
					label: "Replace",
					accelerator: meta + "ALT+F",
					click: () => win.webContents.send("edit:replace")
				},
				...(!appInfo.os.mac ? [
					{ type: "separator" },
					{
						label: "Settings",
						accelerator: meta + ",",
						click: () => win.webContents.send("app:settings")
					}
				] : [])
			]
		},
		{
			label: "Selection",
			submenu: [
				{
					label: "Select All",
					accelerator: meta + "A",
					role: "selectAll"
				},
				{ type: "separator" },
				{
					label: "Move Cursor Up",
					accelerator: "UP",
					click: () => win.webContents.send("selection:move-cursor-up")
				},
				{
					label: "Move Cursor Down",
					accelerator: "DOWN",
					click: () => win.webContents.send("selection:move-cursor-down")
				},
				{
					label: "Move Cursor Left",
					accelerator: "LEFT",
					click: () => win.webContents.send("selection:move-cursor-left")
				},
				{
					label: "Move Cursor Right",
					accelerator: "RIGHT",
					click: () => win.webContents.send("selection:move-cursor-right")
				}
			]
		},
		{
			label: "View",
			role: "viewMenu",
			submenu: [
				{
					label: "Fullscreen",
					role: "togglefullscreen"
				},
				{ type: "separator" },
				{
					id: "toggle-toolbar",
					label: "Toolbar",
					type: "checkbox",
					click: () => win.webContents.send("view:toggle-toolbar")
				},
				{
					id: "toggle-statusbar",
					label: "Statusbar",
					type: "checkbox",
					click: () => win.webContents.send("view:toggle-statusbar")
				}
			]
		},
		{
			label: "Editor",
			submenu: [
				{
					label: "Zoom In",
					accelerator: meta + "PLUS",
					click: () => win.webContents.send("editor:zoom-in")
				},
				{
					label: "Zoom Out",
					accelerator: meta + "-",
					click: () => win.webContents.send("editor:zoom-out")
				},
				{
					label: "Restore Default Zoom",
					accelerator: meta + ("0" || "num0"),
					click: () => win.webContents.send("editor:restore-zoom")
				},
				{ type: "separator" },
				{
					id: "toggle-linecounter",
					label: "Line Counter",
					type: "checkbox",
					click: () => win.webContents.send("editor:toggle-linecounter")
				},
				{
					id: "toggle-indentguides",
					label: "Indent Guides",
					type: "checkbox",
					click: () => win.webContents.send("editor:toggle-indentguides")
				},
				{ type: "separator" },
				{
					label: "Insert Bold",
					click: () => win.webContents.send("editor:insert-bold")
				},
				{
					label: "Insert Italic",
					click: () => win.webContents.send("editor:insert-italic")
				},
				{
					label: "Insert Strikethrough",
					click: () => win.webContents.send("editor:insert-strikethrough")
				},
				{
					label: "Insert Blockquote",
					click: () => win.webContents.send("editor:insert-blockquote")
				},
				{
					label: "Insert Table",
					click: () => win.webContents.send("editor:insert-table")
				},
				{
					label: "Insert Code",
					click: () => win.webContents.send("editor:insert-code")
				},
				{ type: "separator" },
				{
					id: "toggle-wordwrap",
					label: "Word Wrap",
					type: "checkbox",
					click: () => win.webContents.send("editor:toggle-wordwrap")
				}
			]
		},
		{
			label: "Preview",
			submenu: [
				{
					label: "Start Preview",
					click: () => win.webContents.send("preview:start")
				},
				{
					label: "Stop Preview",
					click: () => win.webContents.send("preview:close")
				},
				{ type: "separator" },
				{
					id: "toggle-alwaysontop",
					label: "Always on top",
					type: "checkbox",
					checked: userData.get("previewConfig").alwaysOnTop,
					click: () => win.webContents.send("preview:toggle-alwaysontop")
				}
			]
		},
		{
			label: "Window",
			role: "windowMenu"
		},
		{
			label: "Help",
			role: "help",
			submenu: [
				{
					label: "Join Me on Twitter",
					click: () => shell.openExternal(URLs.twitter)
				},
				{
					label: "GitHub Repository",
					click: () => shell.openExternal(URLs.repo)
				},
				{
					label: "Report Issue",
					click: () => shell.openExternal(URLs.bugs)
				},
				...(!appInfo.os.mac ? [
					{ type: "separator" },
					{
						label: "About " + appInfo.name,
						click: () => showAboutPopup(win)
					},
				] : [])
			]
		}
	]);

	Menu.setApplicationMenu(menubar);
});
ipcMain.on("window:show-editor-menu", (event) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	const meta = appInfo.os.mac ? "Cmd+" : "CTRL+";

	const contextmenu = Menu.buildFromTemplate([
		{
			label: "Undo",
			accelerator: meta + "Z",
			click: () => win.webContents.send("edit:undo")
		},
		{
			label: "Redo",
			accelerator: appInfo.os.win ? meta + "Y" : meta + "SHIFT+Z",
			click: () => win.webContents.send("edit:redo")
		},
		{ type: "separator" },
		{
			label: "Copy",
			accelerator: meta + "C",
			role: "copy"
		},
		{
			label: "Cut",
			accelerator: meta + "X",
			role: "cut"
		},
		{
			label: "Paste",
			accelerator: meta + "V",
			role: "paste"
		},
		{
			label: "Delete",
			accelerator: "DELETE",
			role: "delete"
		},
		{ type: "separator" },
		{
			label: "Select All",
			accelerator: meta + "A",
			role: "selectAll"
		},
		{ type: "separator" },
		{
			label: `Reveal in ${appInfo.os.mac ? "Finder" : "File Explorer"}`,
			accelerator: meta + "ALT+R",
			click: () => win.webContents.send("file:reveal")
		},
	]);

	contextmenu.popup();
});

/*Menubar IPCs*/
ipcMain.on("menubar:check-item", (event, id, checked) => {
	const menubar = Menu.getApplicationMenu();
	menubar.getMenuItemById(id).checked = checked;
});

/*Preview*/
let previewWin = undefined;
ipcMain.on("livepreview:start", (event) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	Menu.setApplicationMenu(Menu.buildFromTemplate([]))

	let { x, y, width, height, alwaysOnTop } = userData.get("previewConfig");

	if (previewWin === undefined) {
		previewWin = new BrowserWindow({
			...x && { x },
			...y && { y },
			width: width,
			height: height,
			minWidth: 400,
			minHeight: 600,
			title: "Live Preview",
			parent: win,
			fullscreenable: false,
			autoHideMenuBar: true,
			alwaysOnTop: alwaysOnTop,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: true,
				preload: path.join(__dirname, "../utils/preload.js")
			}
		});
	
		previewWin.loadFile(path.join(__dirname, "../renderer/preview/index.html"));

		previewWin.webContents.on('will-navigate', (event, url) => {
			event.preventDefault();
			shell.openExternal(url);
		});

		previewWin.on("moved", () => {
			const { x, y, width, height } = previewWin.getBounds();
			const prev = userData.get("previewConfig");
			userData.set("previewConfig", {
				...prev,
				...{ x, y, width, height },
			});
		});
		previewWin.on("resized", () => {
			const { x, y, width, height } = previewWin.getBounds();
			const prev = userData.get("previewConfig");
			userData.set("previewConfig", {
				...prev,
				...{ x, y, width, height },
			});
		});	
		previewWin.on("focus", () => Menu.setApplicationMenu(Menu.buildFromTemplate([])));

		previewWin.on("ready-to-show", () => win.webContents.send("livepreview:opened"));
		previewWin.on("close", () => {
			win.webContents.send("livepreview:closed");
			previewWin = undefined;
		});
	} else { previewWin.focus(); }
});
ipcMain.on("livepreview:toggle-pin", (e) => {
	let { alwaysOnTop } = userData.get("previewConfig");
	alwaysOnTop = !alwaysOnTop;

	if (previewWin !== undefined) {
		previewWin.setAlwaysOnTop(alwaysOnTop);
		Menu.getApplicationMenu().getMenuItemById("toggle-alwaysontop").checked = alwaysOnTop;
		const prev = userData.get("previewConfig");
		userData.set("previewConfig", {
			...prev,
			...{ alwaysOnTop },
		});
	}
});
ipcMain.on("livepreview:close", (e) => {
	if (previewWin !== undefined) {
		previewWin.close();
		previewWin = undefined;    
	}
});
ipcMain.on("livepreview:updated", (e, prevContent) => {
	if (previewWin !== undefined) {
		previewWin.webContents.send("livepreview:updated-prev-content", prevContent);
	}
});
ipcMain.on("livepreview:theme", (e, theme) => {
	if (previewWin !== undefined) {
		previewWin.webContents.send("livepreview:updated-theme", theme);
	}
});

ipcMain.on("window:show-spaces-popup", (event) => {
	const win = BrowserWindow.fromWebContents(event.sender);

	let totalSpaces = [
		{
			label: "1",
			returnval: 1
		},
		{
			label: "2",
			returnval: 2
		},
		{
			label: "3",
			returnval: 3
		},
		{
			label: "4 (Default)",
			returnval: 4
		},
		{
			label: "5",
			returnval: 5
		},
		{
			label: "6",
			returnval: 6
		},
		{
			label: "7",
			returnval: 7
		},
		{
			label: "8",
			returnval: 8
		}];

	const spacesmenuTemplate = totalSpaces.map(space => {
		return {
			label: space.label,
			click: () => win.webContents.send("window:spaces-popup-callback", space.returnval)
		};
	});

	const spacesmenu = Menu.buildFromTemplate(spacesmenuTemplate);

	spacesmenu.popup();
});

/*Entry Point*/
app.on("open-file", (e, path) => {
	if (appInfo.os.mac) {
		if (app.isReady()) {
			if (BrowserWindow.getFocusedWindow() !== null) {
				BrowserWindow.getFocusedWindow().webContents.send("file:open-recent", path);
			}
		} else {
			process.argv.push(path);
		}
	}
});
app.whenReady().then(() => {
	const num = app.isPackaged ? 1 : 2;
	initWindow(null, process.argv.slice(num));

  	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) initWindow();
	});
});