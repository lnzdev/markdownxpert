# MarkdownXpert
MarkdownXpert is a powerful and intuitive Markdown editor for content creators, writers, and developers.

## Getting started
Simply go in the [Releases Section](https://github.com/lnzdev/markdownxpert/releases) and download the compiled app for your system.
Instead, if you want to compile it yourself, download the repository and open a terminal inside.
Once this is done type the command:
`npm install`
to install all the necessary modules.

Once that is done type
`npm run start`
to start the application.

Then inside the **package.json** file there are several commands to compile the program for different platforms.
Such as:
- `build:win` - Compiles the source code into unpacked directories (so that later the setup can be created via Inno Setup)
- `build:mac` - Compiles the source code into APFS **.dmg**
- `build:linux` - Compiles the source code into **.deb** packages

## Features
- **Crossplatform:** MarkdownXpert is available for Windows (x64, x86, arm64), macOS (Universal) and Linux (amd64, arm64, armv7l).
- **Live Preview:** At the click of a button or through the menubar, you can now effortlessly toggle the Preview Window, which instantly renders your Markdown content into a beautifully formatted and easy-to-read display. No more guessing how your text will appear once it's published or shared!
- **HTML Export:** With just a simple click, you can instantly export your Markdown file as a standalone HTML file. But at the moment it doesn't provide any type of styling, we're working to provide the css style directly inside of the HTML file.
- **Toolbar:** With the toolbar, writing markdown files becomes even faster and more productive, in fact, if necessary, you can press buttons to insert parts of bold, italic, striked, code, etc. in the text.
