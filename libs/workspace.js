document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('smart-editor');
    const lineNumbers = document.getElementById('line-numbers');
    const cursorDisplay = document.getElementById('cursor-position');
    const fileNameDisplay = document.getElementById('file-name-display');
    const toast = document.getElementById('editor-toast');
    
    let currentFileName = "untitled.txt";
    let fontSize = 15;
    let fileHandle = null; // Modern API File Handle

    function showToast(msg, isError = false) {
        toast.style.color = isError ? "var(--color-error)" : "var(--color-success)";
        toast.textContent = msg;
        setTimeout(() => toast.textContent = "", 3000);
    }

    // --- 1. DYNAMIC LINE NUMBERS & SYNC ---
    function updateLineNumbers() {
        const linesCount = editor.value.split('\n').length;
        const numbersArray = Array.from({ length: linesCount || 1 }, (_, i) => i + 1);
        lineNumbers.innerHTML = numbersArray.join('<br>');
    }

    // Sync scrolling so the numbers move with the code
    editor.addEventListener('scroll', () => {
        lineNumbers.scrollTop = editor.scrollTop;
    });

    // --- 2. LIVE CURSOR TRACKING ---
    function updateCursorPosition() {
        const text = editor.value;
        const pos = editor.selectionStart;
        const lines = text.substring(0, pos).split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;
        cursorDisplay.textContent = `Ln ${line}, Col ${col}`;
        updateLineNumbers();
    }

    editor.addEventListener('keyup', updateCursorPosition);
    editor.addEventListener('click', updateCursorPosition);
    editor.addEventListener('input', updateCursorPosition);

    // --- NEW: EXPANDED SMART SNIPPET DICTIONARY ---
    const snippets = {
        'cl':    { text: 'console.log();', offset: 2 },
        'ce':    { text: 'console.error();', offset: 2 },
        'cw':    { text: 'console.warn();', offset: 2 },
        'ct':    { text: 'console.table();', offset: 2 },
        'fn':    { text: 'function name() {\n    \n}', offset: 2 },
        'afn':   { text: 'const name = () => {\n    \n};', offset: 4 },
        'async': { text: 'async function name() {\n    \n}', offset: 2 },
        'prom':  { text: 'new Promise((resolve, reject) => {\n    \n});', offset: 4 },
        'if':    { text: 'if (condition) {\n    \n}', offset: 2 },
        'ife':   { text: 'if (condition) {\n    \n} else {\n    \n}', offset: 16 },
        'for':   { text: 'for (let i = 0; i < array.length; i++) {\n    \n}', offset: 2 },
        'forof': { text: 'for (const item of array) {\n    \n}', offset: 2 },
        'forin': { text: 'for (const key in object) {\n    \n}', offset: 2 },
        'try':   { text: 'try {\n    \n} catch (error) {\n    console.error(error);\n}', offset: 45 },
        'qs':    { text: "document.querySelector('');", offset: 3 },
        'qsa':   { text: "document.querySelectorAll('');", offset: 3 },
        'gid':   { text: "document.getElementById('');", offset: 3 },
        'cel':   { text: "document.createElement('');", offset: 3 },
        'ael':   { text: "element.addEventListener('click', (e) => {\n    \n});", offset: 4 },
        'st':    { text: 'setTimeout(() => {\n    \n}, 1000);', offset: 11 },
        'si':    { text: 'setInterval(() => {\n    \n}, 1000);', offset: 11 },
        'fetch': { text: "fetch('url')\n    .then(res => res.json())\n    .then(data => {\n        console.log(data);\n    })\n    .catch(err => console.error(err));", offset: 118 },
        'html':  { text: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n</head>\n<body>\n    \n</body>\n</html>', offset: 16 },
        'style': { text: '<style>\n    \n</style>', offset: 9 },
        'script':{ text: '<script>\n    \n</script>', offset: 10 }
    };

    // --- 4. SMART KEYSTROKES ---
    editor.addEventListener('keydown', function(e) {
        const start = this.selectionStart;
        const end = this.selectionEnd;

        // VS CODE: Duplicate Line Down
        if (e.shiftKey && e.altKey && e.key === 'ArrowDown') {
            e.preventDefault();
            const lineStart = this.value.lastIndexOf('\n', start - 1) + 1;
            let lineEnd = this.value.indexOf('\n', end);
            if (lineEnd === -1) lineEnd = this.value.length;
            const lineText = this.value.substring(lineStart, lineEnd);
            this.setSelectionRange(lineEnd, lineEnd);
            document.execCommand('insertText', false, '\n' + lineText);
            this.setSelectionRange(start + lineText.length + 1, end + lineText.length + 1);
            updateCursorPosition();
            return;
        }

        // VS CODE: Delete Line
        if (e.ctrlKey && e.shiftKey && (e.key === 'K' || e.key === 'k')) {
            e.preventDefault();
            const lineStart = this.value.lastIndexOf('\n', start - 1) + 1;
            let lineEnd = this.value.indexOf('\n', end);
            if (lineEnd !== -1) lineEnd++; 
            else if (lineEnd === -1) lineEnd = this.value.length;
            this.setSelectionRange(lineStart, lineEnd);
            document.execCommand('insertText', false, '');
            updateCursorPosition();
            return;
        }

        // Enter Key (Smart Indent)
        if (e.key === 'Enter') {
            e.preventDefault();
            const lineStart = this.value.lastIndexOf('\n', start - 1) + 1;
            const currentLine = this.value.substring(lineStart, start);
            const match = currentLine.match(/^\s+/);
            const spaces = match ? match[0] : '';
            document.execCommand('insertText', false, '\n' + spaces);
            updateCursorPosition();
            return;
        }

        // Tab & Shift+Tab (Includes Snippets)
        if (e.key === 'Tab') {
            e.preventDefault();

            if (start === end && !e.shiftKey) {
                const textBeforeCursor = this.value.substring(0, start);
                const wordMatch = textBeforeCursor.match(/([a-zA-Z0-9_]+)$/);
                if (wordMatch && snippets[wordMatch[1]]) {
                    const word = wordMatch[1];
                    this.setSelectionRange(start - word.length, start);
                    document.execCommand('insertText', false, snippets[word].text);
                    const newPos = this.selectionEnd - snippets[word].offset;
                    this.setSelectionRange(newPos, newPos);
                    updateCursorPosition();
                    return; 
                }
            }

            const firstLineStart = this.value.lastIndexOf('\n', start - 1) + 1;
            let lastLineEnd = this.value.indexOf('\n', end);
            if (lastLineEnd === -1) lastLineEnd = this.value.length;
            const selectedLines = this.value.substring(firstLineStart, lastLineEnd);

            if (e.shiftKey) {
                const lines = selectedLines.split('\n');
                const unindented = lines.map(line => line.replace(/^ {1,4}/, '')).join('\n');
                if (unindented !== selectedLines) {
                    this.setSelectionRange(firstLineStart, lastLineEnd);
                    document.execCommand('insertText', false, unindented);
                    this.setSelectionRange(firstLineStart, firstLineStart + unindented.length);
                }
            } else {
                if (start !== end) { 
                    const lines = selectedLines.split('\n');
                    const indented = lines.map(line => "    " + line).join('\n');
                    this.setSelectionRange(firstLineStart, lastLineEnd);
                    document.execCommand('insertText', false, indented);
                    this.setSelectionRange(firstLineStart, firstLineStart + indented.length);
                } else {
                    document.execCommand('insertText', false, '    ');
                }
            }
            updateCursorPosition();
            return;
        }

        // Auto-Close brackets
        const pairs = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
        if (pairs[e.key]) {
            e.preventDefault();
            const selectedText = this.value.substring(start, end);
            const wrappedText = e.key + selectedText + pairs[e.key];
            document.execCommand('insertText', false, wrappedText);
            this.selectionStart = this.selectionEnd = start + 1 + selectedText.length;
            updateCursorPosition();
        }
    });

    // --- 5. MODERN FILE OPERATIONS (Hybrid Mode) ---
    
    // 1. OPEN FILE (Uses Native OS Memory to remember folders perfectly)
    document.getElementById('btn-open').onclick = () => {
        document.getElementById('file-input').click();
    };

    document.getElementById('file-input').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            editor.value = evt.target.result;
            currentFileName = file.name;
            fileNameDisplay.textContent = currentFileName;
            fileHandle = null; // Reset modern handle on new file load
            updateCursorPosition();
            showToast("📂 File loaded.");
        };
        reader.readAsText(file);
        this.value = ''; 
    });

    // 2. TRUE SAVE (Upgrades to silent overwrite)
    document.getElementById('btn-save').onclick = async () => {
        if (!editor.value) return showToast("File is empty.", true);
        
        if (window.showSaveFilePicker) {
            try {
                if (!fileHandle) {
                    // First save after opening: Ask OS to link a handle to this file
                    fileHandle = await window.showSaveFilePicker({ suggestedName: currentFileName });
                }
                // We have the handle! Silently overwrite.
                const writable = await fileHandle.createWritable();
                await writable.write(editor.value);
                await writable.close();
                showToast("✅ File saved successfully!");
            } catch (e) {
                if (e.name !== 'AbortError') showToast("Save permission denied.", true);
            }
        } else {
            // Fallback for older browsers
            document.getElementById('btn-save-as').click();
        }
    };

    // 3. SAVE AS (Create Copy / New File)
    document.getElementById('btn-save-as').onclick = async () => {
        if (!editor.value) return showToast("File is empty.", true);
        
        if (window.showSaveFilePicker) {
            try {
                // Force a new dialog to pick a new location
                fileHandle = await window.showSaveFilePicker({ suggestedName: currentFileName });
                const writable = await fileHandle.createWritable();
                await writable.write(editor.value);
                await writable.close();
                const file = await fileHandle.getFile();
                currentFileName = file.name;
                fileNameDisplay.textContent = currentFileName;
                showToast("✅ Saved as new file.");
            } catch (e) {}
        } else {
            // Fallback old-school download
            let newName = prompt("Save file as:", currentFileName);
            if (!newName) return;
            currentFileName = newName;
            fileNameDisplay.textContent = currentFileName;
            const blob = new Blob([editor.value], { type: "text/plain;charset=utf-8" });
            const a = document.createElement("a");
            const url = URL.createObjectURL(blob);
            a.href = url; a.download = currentFileName;
            document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
            showToast("✅ File copy downloaded.");
        }
    };

    // --- 6. UTILITIES ---
    document.getElementById('btn-copy').onclick = (e) => {
        if (!editor.value) return;
        navigator.clipboard.writeText(editor.value).then(() => {
            const orig = e.target.innerHTML;
            e.target.innerHTML = "✔✔ Copied!";
            setTimeout(() => e.target.innerHTML = orig, 1500);
        });
    };

    document.getElementById('btn-clear').onclick = () => {
        if (editor.value && confirm("Clear entire workspace? Unsaved changes will be lost.")) {
            editor.value = '';
            currentFileName = "untitled.txt";
            fileNameDisplay.textContent = currentFileName;
            fileHandle = null;
            updateCursorPosition();
        }
    };

    document.getElementById('btn-font-inc').onclick = () => {
        if (fontSize < 30) fontSize += 2;
        editor.style.fontSize = fontSize + 'px';
        lineNumbers.style.fontSize = fontSize + 'px';
    };
    document.getElementById('btn-font-dec').onclick = () => {
        if (fontSize > 10) fontSize -= 2;
        editor.style.fontSize = fontSize + 'px';
        lineNumbers.style.fontSize = fontSize + 'px';
    };

    updateCursorPosition();
});