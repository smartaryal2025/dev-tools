// ==========================================
// PRO DEVELOPER TOOLS - MONACO EDITION
// ==========================================

const fileNameDisplay = document.getElementById('file-name-display');
const cursorPositionDisplay = document.getElementById('cursor-position');
const toast = document.getElementById('editor-toast');
const langSelector = document.getElementById('language-selector');

let fileHandle = null;
let currentFileName = 'untitled.js';

function showToast(msg, isError = false) {
    toast.textContent = msg;
    toast.style.color = isError ? 'var(--color-danger)' : 'var(--color-success)';
    setTimeout(() => toast.textContent = '', 3000);
}

window.editor.onDidChangeCursorPosition((e) => {
    cursorPositionDisplay.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
});

// --- 2. LANGUAGE SWITCHER ---
langSelector.addEventListener('change', (e) => {
    monaco.editor.setModelLanguage(window.editor.getModel(), e.target.value);
});

function updateSyntaxFromFilename(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    let lang = 'plaintext';
    if(ext === 'js') lang = 'javascript';
    if(ext === 'html') lang = 'html';
    if(ext === 'css') lang = 'css';
    if(ext === 'json') lang = 'json';
    
    monaco.editor.setModelLanguage(window.editor.getModel(), lang);
    langSelector.value = lang; // Updates the UI dropdown to match!
}

// --- 3. KEYBINDINGS ---
window.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function() {
    document.getElementById('btn-save').click();
});
// (Removed buggy Tab overrides - Monaco will handle smart tabbing natively!)

// --- 3.5 UI CONTROLS & FULLSCREEN ---

document.getElementById('btn-fullscreen').onclick = () => {
    // Target the main wrapper so the toolbar stays visible in fullscreen!
    const workspaceElement = document.querySelector('.workspace-container');
    
    if (!document.fullscreenElement) {
        workspaceElement.requestFullscreen().catch(err => {
            showToast("Fullscreen not supported", true);
        });
    } else {
        document.exitFullscreen();
    }
};

// Listen for resize events to force Monaco to redraw perfectly
window.addEventListener('resize', () => {
    if (window.editor) {
        window.editor.layout();
    }
});

// --- 4. FILE OPERATIONS ---
document.getElementById('btn-open').onclick = async () => {
    if (window.showOpenFilePicker) {
        try {
            const [handle] = await window.showOpenFilePicker({ 
                id: 'ProDevWorkspaceOS', 
                startIn: 'documents' // Fallback for file:// protocol
            });
            fileHandle = handle;
            const file = await fileHandle.getFile();
            window.editor.setValue(await file.text()); 
            currentFileName = file.name;
            fileNameDisplay.textContent = currentFileName;
            updateSyntaxFromFilename(currentFileName);
            showToast("📂 File loaded securely.");
        } catch (e) {}
    } else {
        document.getElementById('file-input').click();
    }
};

document.getElementById('file-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        window.editor.setValue(evt.target.result); 
        currentFileName = file.name;
        fileNameDisplay.textContent = currentFileName;
        fileHandle = null; 
        updateSyntaxFromFilename(currentFileName);
        showToast("📂 File loaded (Fallback).");
    };
    reader.readAsText(file);
    this.value = ''; 
});

document.getElementById('btn-save').onclick = async () => {
    const content = window.editor.getValue(); 
    if (!content) return showToast("File is empty.", true);
    if (window.showSaveFilePicker) {
        try {
            if (!fileHandle) fileHandle = await window.showSaveFilePicker({ 
                id: 'ProDevWorkspaceOS', 
                suggestedName: currentFileName 
            });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            const file = await fileHandle.getFile();
            currentFileName = file.name;
            fileNameDisplay.textContent = currentFileName;
            showToast("✅ File overwritten successfully!");
        } catch (e) { if (e.name !== 'AbortError') showToast("Save permission denied.", true); }
    } else document.getElementById('btn-save-as').click();
};

document.getElementById('btn-save-as').onclick = async () => {
    const content = window.editor.getValue();
    if (!content) return showToast("File is empty.", true);
    if (window.showSaveFilePicker) {
        try {
            fileHandle = await window.showSaveFilePicker({ 
                id: 'ProDevWorkspaceOS', 
                suggestedName: currentFileName 
            });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            const file = await fileHandle.getFile();
            currentFileName = file.name;
            fileNameDisplay.textContent = currentFileName;
            showToast("✅ Saved as new file.");
        } catch (e) {}
    } else {
        let newName = prompt("Save file as:", currentFileName);
        if (!newName) return;
        currentFileName = newName;
        fileNameDisplay.textContent = currentFileName;
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = currentFileName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
        showToast("✅ File copy downloaded.");
    }
};

document.getElementById('btn-copy').onclick = () => navigator.clipboard.writeText(window.editor.getValue()).then(() => showToast("📋 Copied to clipboard!"));
document.getElementById('btn-clear').onclick = () => { if (confirm("Clear editor?")) window.editor.setValue(''); };

// --- 5. SMART SNIPPETS (IntelliSense) ---

monaco.languages.registerCompletionItemProvider('javascript', {
    provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
        return {
            suggestions: [
                { label: 'cl', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'console.log(${1});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Log to console', range: range },
                { label: 'fn', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'function ${1:name}(${2:params}) {\n\t${3}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Standard Function', range: range },
                { label: 'afn', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'const ${1:name} = (${2:params}) => {\n\t${3}\n};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Arrow Function', range: range },
                { label: 'for', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t${3}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'For Loop', range: range },
                { label: 'try', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'try {\n\t${1}\n} catch (error) {\n\tconsole.error(error);\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Try/Catch Block', range: range },
                { label: 'qs', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'document.querySelector(\'${1}\');', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'DOM Query Selector', range: range },
                { label: 'ael', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '${1:element}.addEventListener(\'${2:click}\', (e) => {\n\t${3}\n});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Event Listener', range: range },
                { label: 'fetch', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'fetch(\'${1:url}\')\n\t.then(res => res.json())\n\t.then(data => {\n\t\t${2}\n\t})\n\t.catch(err => console.error(err));', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Fetch API Boilerplate', range: range }
            ]
        };
    }
});

monaco.languages.registerCompletionItemProvider('html', {
    provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
        return {
            suggestions: [
                { label: 'html', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<meta charset="UTF-8">\n\t<meta name="viewport" content="width=device-width, initial-scale=1.0">\n\t<title>${1:Document}</title>\n</head>\n<body>\n\t${2}\n</body>\n</html>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'HTML5 Boilerplate', range: range },
                { label: 'style', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '<style>\n\t${1}\n</style>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Internal CSS Style Block', range: range },
                { label: 'script', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '<script>\n\t${1}\n</script>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Internal JavaScript Block', range: range },
                { label: 'scriptsrc', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '<script src="${1:app.js}"></script>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'External Script Link', range: range },
                { label: 'link', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '<link rel="stylesheet" href="${1:style.css}">', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'External CSS Link', range: range },
                { label: 'div', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '<div class="${1:container}">\n\t${2}\n</div>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Div with Class', range: range },
                { label: 'a', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '<a href="${1:#}">${2:Link Text}</a>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Hyperlink', range: range }
            ]
        };
    }
});