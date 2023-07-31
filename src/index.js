//App
let appInfo = undefined;
let appConfig = undefined;
let editorConfig = undefined;

let darkTheme = undefined;

//Editor
var editor = undefined;
var editorElement = document.getElementById("texteditor");

//Elements
const wintoolbar = document.getElementById("toolbar");
const winstatusbar = document.getElementById("statusbar");

const settingsPopup = document.getElementById("settings-popup");
const closeSettingsPopup = document.getElementById("close-settings");
const toolbarCheckbox = document.getElementById("toggle-toolbar");
const statusbarCheckbox = document.getElementById("toggle-statusbar");
const zoomInButton = document.getElementById("font-increase");
const zoomOutButton = document.getElementById("font-decrease");
const fontSizeRange = document.getElementById("font-range");
const lineCounterCheckbox = document.getElementById("toggle-linecounter");
const indentGuidesCheckbox = document.getElementById("toggle-indentguides");
const wordwrapCheckbox = document.getElementById("toggle-wordwrap");

const undo = document.getElementById("undo");
const redo = document.getElementById("redo");
const insBold = document.getElementById("ins-bold");
const insItalic = document.getElementById("ins-italic");
const insStriked = document.getElementById("ins-striked");
const insBlockQuote = document.getElementById("ins-blockquote");
const insTable = document.getElementById("ins-table");
const insCode = document.getElementById("ins-code");
const startPrev = document.getElementById("start-preview");
const stopPrev = document.getElementById("stop-preview");

const totLines = document.getElementById("total-lines");
const currLineCol = document.getElementById("ln-col-pos");
const tabSpaces = document.getElementById("select-indentation");

//File
const file = {
    name: "NewDocument.md",
    path: "",
    saved: true
}

//Dialogs Templates
const openFileTemplate = {
	properties: [
		"openFile",
		"createDirectory"
	],
    filters: [ { name: "Markdown Document", extensions: ["md"] }]
};
const saveFileTemplate = {
	...!file.path != null ? { defaultPath: file.name, }: {},
	properties: [
		"createDirectory",
		"treatPackageAsDirectory",
	],
	filters: [ { name: "Markdown Document", extensions: ["md"] }]
};
const saveasFileTemplate = {
	properties: [
		"createDirectory",
		"treatPackageAsDirectory",
	],
	filters: [{ name: "All Files", extensions: ["*"] }]
};
const messageTemplate = {
	type: "question",
	buttons: ["Save", "Don't Save", "Cancel"],
	defaultId: 0,
	noLink: true,
	title: "Unsaved Content",
	message: "Do you want to save " + file.name + "?",
	detail: "You will loose the edited content.",
};

/*------ Main ------*/
//Custom Widgets
function checkCustomCheckbox(item, check) {
	var itemToCheck = document.getElementById(item);

	if (check) {
		itemToCheck.checked = true;
		document.querySelector("#" + item + " .checkmark").style.display = "block";
	} else {
		itemToCheck.checked = false;
		document.querySelector("#" + item + " .checkmark").style.display = "none";
	}
}

//Window Title
function updateTitle() {
	if (file.saved) {
        setWindowTitle(file.name);
        window.api.setDocumentEdited(false);
	} else {
		setWindowTitle(`*${file.name}`);
		window.api.setDocumentEdited(true);
	}
}
function setWindowTitle(title) {
	window.api.setTitle(title + " — " + appInfo.name);
    document.title = title + " — " + appInfo.name;
}

//Settings
function initSettings() {
	setWindowTheme(appConfig.theme);

	setEditorSize(editorConfig.fontSize);
    showLineCounter(editorConfig.lineCounter);
    showIndentGuides(editorConfig.indentGuides);
    setWordWrap(editorConfig.wordwrap);
	setEditorSpaces(editorConfig.tabSpaces);

    showToolbar(appConfig.toolbar);
    showStatusbar(appConfig.statusbar);
}
function openSettings() {
	settingsPopup.classList.remove("hide");
	settingsPopup.classList.add("show");
	document.body.classList.add("showing-popup");
	editor.blur();
}
async function closeSettings() {
	settingsPopup.classList.add("hide");
	await window.api.wait(500);
	settingsPopup.classList.remove("show");
	document.body.classList.remove("showing-popup");
	editor.focus()
}
//Settings->Editor
function showLineCounter(state) {
    editor.setOptions({
        showLineNumbers: state,
        showGutter: state
    });

    checkCustomCheckbox("toggle-linecounter", state);

    window.api.send("menubar:check-item", "toggle-linecounter", state);
    window.api.storeSetting("lineCounter", state, "editorConfig");
}
function showIndentGuides(state) {
    editor.setOptions({ displayIndentGuides: state });

    checkCustomCheckbox("toggle-indentguides", state);

    window.api.send("menubar:check-item", "toggle-indentguides", state);
    window.api.storeSetting("indentGuides", state, "editorConfig");
}
function setWordWrap(state) {
    editor.session.setUseWrapMode(state);

	checkCustomCheckbox("toggle-wordwrap", state);

    window.api.send("menubar:check-item", "toggle-wordwrap", state);
    window.api.storeSetting("wordwrap", state, "editorConfig");
}
function toggleLineCounter() {
    editorConfig.lineCounter = !editorConfig.lineCounter;
    showLineCounter(editorConfig.lineCounter);
}
function toggleIndentGuides() {
    editorConfig.indentGuides = !editorConfig.indentGuides;
    showIndentGuides(editorConfig.indentGuides);
}
function toggleWordWrap() {
    editorConfig.wordwrap = !editorConfig.wordwrap;
    setWordWrap(editorConfig.wordwrap);
}
//Settings->View
function showToolbar(state) {
    wintoolbar.style.display = state ? "flex": "none";

	checkCustomCheckbox("toggle-toolbar", state);
	
    window.api.send("menubar:check-item", "toggle-toolbar", state);
    window.api.storeSetting("toolbar", state, "appConfig");
}
function showStatusbar(state) {
	winstatusbar.style.display = state ? "flex": "none";

	checkCustomCheckbox("toggle-statusbar", state);

    window.api.send("menubar:check-item", "toggle-statusbar", state);
    window.api.storeSetting("statusbar", state, "appConfig");
}
function toggleToolbar() {
    appConfig.toolbar = !appConfig.toolbar;
    showToolbar(appConfig.toolbar);
}
function toggleStatusbar() {
    appConfig.statusbar = !appConfig.statusbar;
    showStatusbar(appConfig.statusbar);
}

//Theme
function setWindowTheme(state) {
    if (state === "system") {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            document.body.classList.add("dark");
            darkTheme = true;
        } else {
            document.body.classList.remove("dark");
            darkTheme = false;
        }

        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", event => {
            if (event.matches) {
                document.body.classList.add("dark");
                darkTheme = true;
            } else {
                document.body.classList.remove("dark");
                darkTheme = false;
            }
        });
    }
    if (state === "dark") {
        document.body.classList.add("dark");
        darkTheme = true;
    }
    if (state === "light") {
        document.body.classList.remove("dark");
        darkTheme = false;
    }

	window.api.send("livepreview:theme", appConfig.theme);

    window.api.setTheme(state);
    window.api.storeSetting("theme", state, "appConfig");
}

//Editor
function setEditorValue(content) {
    editor.setValue(content, -1);
	editor.session.setUndoManager(new ace.UndoManager());
}
function setEditorSize(fontsize) {
	editor.setOption("fontSize", fontsize);
	fontSizeRange.value = fontsize;
	window.api.storeSetting("fontSize", fontsize, "editorConfig");
}
function setEditorSpaces(spaces) {
    tabSpaces.textContent = "Spaces: " + String(spaces);
	editor.session.setOptions({
		tabSize: spaces,
		useSoftTabs: false
	});

	window.api.storeSetting("tabSpaces", spaces, "editorConfig")
}
function moveCursorUp() {
	const currentPosition = editor.getCursorPosition();
	const newPosition = {
        row: currentPosition.row - 1,
        column: currentPosition.column
	};
	editor.moveCursorToPosition(newPosition);
}
function moveCursorDown() {
	const currentPosition = editor.getCursorPosition();
	const newPosition = {
        row: currentPosition.row + 1,
        column: currentPosition.column
	};
	editor.moveCursorToPosition(newPosition);
}
function zoomIn() {
	let size = editor.getFontSize() + 1;
	size = Math.min(Math.max(size, 5), 30);
	setEditorSize(size);
}
function zoomOut() {
	let size = editor.getFontSize() - 1;
	size = Math.min(Math.max(size, 5), 30);
	setEditorSize(size);
}
function restoreZoom() {
	let size = 15;
	setEditorSize(size);
}

//File Logic
function newWindow(filePaths = []) {
	const filePathsArray = Array.isArray(filePaths) ? filePaths: [filePaths];
	window.api.newWindow(filePathsArray);
}
function newFile(saved) {
	if (saved) {
		file.name = "NewDocument.txt";
		file.extension = ".txt";
		file.path = "";

		updateStatusbar();
		setEditorValue("");
		file.saved = true;
		editor.setReadOnly(false);
		updateTitle();
	} else {
		window.api.showMessageBox(messageTemplate).then(async res => {
			switch (res.response) {
				case 0:
					saveFileDialog(false, function() {
						newFile(true);
					});
					break;
				case 1:
					newFile(true);
					break;
				case 2:
					return;
			}
		});
	}
}
function openFiles(filePaths = []) {
	const filesArray = Array.isArray(filePaths) ? filePaths: [filePaths];

	if (file.saved) {
		const fileToOpen = filesArray.shift();
		if (window.api.path.extname(fileToOpen) === ".md") {
			window.api.readFile(fileToOpen, (err, data) => {
				if (err) {
					console.error(err);
					return;
				}
	
				setEditorValue(window.api.decodeBuffer(data));
				setFileProps(fileToOpen);
				window.api.send("window:add-file-to-recent", fileToOpen);
			});
		} else {
			window.api.showMessageBox({
				title: appInfo.name,
				message: appInfo.name,
				detail: "This File is unsupported, consider opening only Markdown documents"
			});
		}
	}

	if (filesArray.length) {
		newWindow(filesArray);
	}
}
async function openFileDialog() {
	window.api.showOpenFileDialog(openFileTemplate).then(result => {
		if (!result.canceled) {
			openFiles(result.filePaths);
		}
	});
}
async function saveFileDialog(saveas = false, savedcallback = function() {}) {
	if (saveas) {
		window.api.showSaveFileDialog(saveasFileTemplate).then(result => {
			if (!result.canceled) {
				window.api.writeFile(result.filePath, editor.getValue(), (err) => {
					if (err) {
						console.error(err);
						return;
					}

					setFileProps(result.filePath);
				});
			}
		});
	} else {
		if (file.path != "") {
			window.api.writeFile(file.path, editor.getValue(), (err) => {
				if (err) {
					console.error(err);
					return;
				}

				setFileProps(file.path);
				savedcallback();
			});
		} else {
			window.api.showSaveFileDialog(saveFileTemplate).then(result => {
				if (!result.canceled) {
					window.api.writeFile(result.filePath, editor.getValue(), (err) => {
						if (err) {
							console.error(err);
							return;
						}

						setFileProps(result.filePath);
						savedcallback();
					});
				}
			});
		}
	}
}
function setFileProps(filePath) {
	file.path = filePath;
	file.extension = window.api.path.extname(filePath);
	file.name = window.api.path.basename(filePath, file.extension) + file.extension;
	file.saved = true;

	updateStatusbar();
	updateTitle();
}

//Preview
function updateLivePreview() {
	const htmlText = window.api.MDtoHTML(editor.getValue());
	window.api.send("livepreview:updated", htmlText);
}

//Statusbar
function updateStatusbar() {
    totLines.innerText = "Lines: " + editor.session.getLength();
    currLineCol.innerText = "Line: " + (editor.selection.getCursor().row + 1) + ", " + "Column: " + editor.selection.getCursor().column;
}

//Callbacks
function initCallbacks() {
    //Toolbar
    undo.addEventListener("click", () => editor.execCommand("undo"));
    redo.addEventListener("click", () => editor.execCommand("redo"));
    insBold.addEventListener("click", () => insertBold(editor));
    insItalic.addEventListener("click", () => insertItalic(editor));
    insStriked.addEventListener("click", () => insertStriked(editor));
    insBlockQuote.addEventListener("click", () => insertBlockQuote(editor));
    insTable.addEventListener("click", () => insertTable(editor));
    insCode.addEventListener("click", () => insertCode(editor));
	startPrev.addEventListener("click", () => window.api.send("livepreview:start"));
	stopPrev.addEventListener("click", () => window.api.send("livepreview:close"));
	
	//Menubar->App
	window.api.on("app:settings", openSettings);

    //Menubar->File
    window.api.on("file:new", () => newFile(file.saved));
	window.api.on("file:new-window", () => newWindow([]));
    window.api.on("file:open", () => openFileDialog());
	window.api.on("file:open-recent", (e, path) => openFiles(path));
    window.api.on("file:save", () => saveFileDialog(false));
    window.api.on("file:save-as", () => saveFileDialog(true));
	window.api.on("file:reveal", () => window.api.showFileInFinder(file.path));
	window.api.on("file:export-html", async () => {
		window.api.showSaveFileDialog({
			defaultPath: window.api.path.parse(file.name).name,
			properties: [
				"createDirectory",
				"treatPackageAsDirectory",
			],
			filters: [{ name: "HTML Document", extensions: ["html"] }]		
		}).then(result => {
			if (!result.canceled) {
				window.api.writeFile(result.filePath, window.api.MDtoHTML(editor.getValue()), (err) => {
					if (err) {
						console.error(err);
						return;
					}
				});
			}
		});
	});

    //Menubar->Edit
	window.api.on("edit:undo", () => editor.execCommand("undo"));
	window.api.on("edit:redo", () => editor.execCommand("redo"));
    window.api.on("edit:find", () => editor.execCommand("find"));
    window.api.on("edit:replace", () => editor.execCommand("replace"));

	//Menubar->Selection
	window.api.on("selection:move-cursor-up", moveCursorUp);
	window.api.on("selection:move-cursor-down", moveCursorDown);
	window.api.on("selection:move-cursor-left", () => editor.navigateLeft());
	window.api.on("selection:move-cursor-right", () => editor.navigateRight());

    //Menubar->Editor
	window.api.on("editor:zoom-in", zoomIn);
	window.api.on("editor:zoom-out", zoomOut);
	window.api.on("editor:restore-zoom", restoreZoom);
    window.api.on("editor:toggle-linecounter", toggleLineCounter);
    window.api.on("editor:toggle-indentguides", toggleIndentGuides);
    window.api.on("editor:insert-bold", () => insertBold(editor));
    window.api.on("editor:insert-italic", () => insertItalic(editor));
    window.api.on("editor:insert-strikethrough", () => insertStriked(editor));
    window.api.on("editor:insert-blockquote", () => insertBlockQuote(editor));
    window.api.on("editor:insert-table", () => insertTable(editor));
    window.api.on("editor:insert-code", () => insertCode(editor));
    window.api.on("editor:toggle-wordwrap", toggleWordWrap);

	//Menubar->Preview
	window.api.on("preview:start", () => window.api.send("livepreview:start"));
	window.api.on("preview:close", () => window.api.send("livepreview:close"));
	window.api.on("preview:toggle-alwaysontop", () => window.api.send("livepreview:toggle-pin"));
    
    //Menubar->View
    window.api.on("view:toggle-toolbar", toggleToolbar);
    window.api.on("view:toggle-statusbar", toggleStatusbar);
    
	//Live Preview
	window.api.on("livepreview:opened", () => {
        window.api.send("livepreview:theme", appConfig.theme);
        updateLivePreview();
    });
	window.api.on("livepreview:closed", () => showPreviewWin(false));

	//Settings
	toolbarCheckbox.addEventListener("click", toggleToolbar);
	statusbarCheckbox.addEventListener("click", toggleStatusbar);
	zoomInButton.addEventListener("click", zoomIn);
	zoomOutButton.addEventListener("click", zoomOut);
	lineCounterCheckbox.addEventListener("click", toggleLineCounter);
	indentGuidesCheckbox.addEventListener("click", toggleIndentGuides);
	wordwrapCheckbox.addEventListener("click", toggleWordWrap);

    //Tab Spaces
    tabSpaces.addEventListener("click", () => window.api.send("window:show-spaces-popup"));
    window.api.on("window:spaces-popup-callback", (e, cb) => setEditorSpaces(cb));

	//Shortcuts
	window.api.on("window:keyboard-input", (e, input) => {
		setTimeout(() => {
			if (appInfo.os.mac ? input.meta : input.control) {
				if (!input.shift) {
					if (input.key === ",") {
						openSettings();
					}
				}
			}
		}, 500);
	});
}

//Application
async function initApp() {
    //Settings
	const settings = await window.api.getSettings();
	appInfo = settings.appInfo;
	appConfig = settings.appConfig;
	editorConfig = settings.editorConfig;

    window.api.setActiveMenubar();

    editor = ace.edit(editorElement);
    editor.setTheme("ace/theme/github");
    editor.setKeyboardHandler("ace/keyboard/vscode");
    editor.setOptions({
        mode: "ace/mode/markdown",
        fontSize: editorConfig.fontSize,
        showLineNumbers: editorConfig.lineCounter,
        showGutter: editorConfig.lineCounter,
        displayIndentGuides: editorConfig.indentGuides,
        highlightActiveLine: false,
        showPrintMargin: false,
        scrollPastEnd: 1,
        cursorStyle: "smooth",
        selectionStyle: "text",
        fixedWidthGutter: true,
        fadeFoldWidgets: true,
        copyWithEmptySelection: true,
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true
    });
    editor.on("change", () => {
        file.saved = false;

        updateTitle();
        updateStatusbar();
        updateLivePreview();
    });
    editor.on("keyboardActivity", updateStatusbar);
	editor.session.selection.on("changeCursor", updateStatusbar);
	editor.container.addEventListener("contextmenu", (e) => window.api.send("window:show-editor-menu"));

    updateTitle();
    updateStatusbar();
	updateLivePreview();

    /*Open Argv*/
	if (settings.pathsToOpen.length) {
		openFiles(settings.pathsToOpen);
	}

	settingsPopup.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation(); //Prevent close callback when pressing on the window itself
    });
	document.addEventListener("click", closeSettings);
	closeSettingsPopup.addEventListener("click", closeSettings);

	editor.container.addEventListener("dragover", (e) => {
		e.preventDefault();
		e.stopPropagation();

		if (e.dataTransfer.types) {
			for (var i = 0; i < e.dataTransfer.types.length; i++) {
				if (e.dataTransfer.types[i] == "Files") {
					editor.container.classList.add("dragover");
					break;
				}
			}
		}
	});
	editor.container.addEventListener("dragleave", (e) => {
        e.preventDefault();
        e.stopPropagation();
        editor.container.classList.remove("dragover");
	});
	editor.container.addEventListener("dragend", (e) => {
        e.preventDefault();
        e.stopPropagation();
        editor.container.classList.remove("dragover");
	});
	editor.container.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const fileList = Array.from(e.dataTransfer.files);
        const filePaths = fileList.map((file) => file.path);

        openFiles(filePaths);

        editor.container.classList.remove("dragover");
	});

    window.api.on("window:focus", () => {
        window.api.setActiveMenubar();
        initSettings(); //For updating even checked items
    });
    window.api.on("window:want-close", (e) => {
        window.api.showMessageBox(messageTemplate).then(async res => {
            switch (res.response) {
            case 0:
                saveFileDialog(false, function() {
                    window.api.setDocumentEdited(false);
                    window.api.send("window:can-close");
                });

                break;
            case 1:
                window.api.setDocumentEdited(false);
                window.api.send("window:can-close");

                break;
            case 2:
                return;
            }
        });
  });

  initSettings();
  initCallbacks();
}

//Document Ready
document.addEventListener("DOMContentLoaded", initApp);