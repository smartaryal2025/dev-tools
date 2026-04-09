# 🛠️ Pro Developer Tools

A blazing-fast, lightweight, and **100% offline** suite of developer tools built with HTML, CSS, and Vanilla JavaScript. 

No backend. No tracking. No forced cloud syncing. Just powerful local tools that run directly in your browser using modern File System APIs, making it completely portable—you can even run it off a USB drive!

---

## ✨ Core Features

### 💻 1. Code Editor Workspace
A distraction-free, high-performance text editor engineered to mimic the best parts of modern IDEs without the bloat.
* **Smart Snippet Engine:** Type triggers like `fn`, `for`, or `fetch` and hit `TAB` to instantly generate boilerplate code.
* **VS Code Hotkeys:** Built-in support for line duplication (`Shift + Alt + Down`), line deletion (`Ctrl + Shift + K`), and smart indenting/outdenting.
* **True File Overwrite:** Uses the modern `showOpenFilePicker` API to seamlessly overwrite local files without triggering annoying "Save As" browser popups.

### 📝 2. Dev Notes & Documentation
A split-pane Markdown editor that renders your technical notes into beautiful HTML in real-time.
* **Live Preview:** Powered by the lightweight `marked.js` engine.
* **Autosave Vault:** Every keystroke is instantly saved to your browser's offline `localStorage`. You can close the tab mid-sentence and never lose your work.
* **Instant Export:** One-click buttons to download as a `.md` file or copy the fully rendered HTML to your clipboard.

### ⚖️ 3. Local Diff Editor
* Quickly upload two files to highlight the exact line-by-line differences directly in your browser.

### 🕸️ 4. Offline Data Scraper
* A localized scraping engine designed to parse data directly from your machine.

---
## 🚀 Getting Started

This suite uses modern Web APIs (like `showOpenFilePicker` and `showSaveFilePicker`) to enable true, silent file overwriting without triggering browser download popups. 

Because modern browsers enforce strict security protocols on local `file:///` URLs, **you must run this suite on a local server** to unlock its full memory capabilities (like remembering your last opened folder).

**How to run locally (takes 5 seconds):**

**Option 1: Using Python (Mac/Windows)**
1. Open your terminal and navigate to this project folder.
2. Run the command: `python -m http.server 8000`
3. Open your browser and go to `http://localhost:8000`

**Option 2: Using VS Code**
1. Open this project folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html` and click **"Open with Live Server"**.

*(Note: You can still open `index.html` directly in your browser without a server, but the Code Editor will default to your OS Documents folder every time you click 'Open File'.)*
