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

Because this suite is entirely client-side, there is no Node.js server to spin up, no packages to install, and no build process to wait for.

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/YOUR-USERNAME/pro-dev-tools.git](https://github.com/YOUR-USERNAME/pro-dev-tools.git)
