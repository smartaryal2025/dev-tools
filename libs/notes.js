document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('md-editor');
    const preview = document.getElementById('md-preview');

    // 1. LIVE RENDER ENGINE
    function renderMarkdown() {
        const rawText = editor.value;
        // Parse the markdown into HTML using marked.js
        if (typeof marked !== 'undefined') {
            preview.innerHTML = marked.parse(rawText);
        } else {
            preview.innerHTML = "<p style='color:red;'>Error: marked.min.js not found. Please download it and place it in the libs folder.</p>";
        }
        
        // Autosave to LocalStorage
        localStorage.setItem('dev_notes_autosave', rawText);
    }

    // Load previously autosaved notes
    const savedNotes = localStorage.getItem('dev_notes_autosave');
    if (savedNotes) {
        editor.value = savedNotes;
    }
    
    // Initial Render
    renderMarkdown();

    // Re-render on every keystroke
    editor.addEventListener('input', renderMarkdown);

    // 2. SMART TAB KEY (Allows indenting in Markdown lists)
    editor.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            
            // Insert 4 spaces
            document.execCommand('insertText', false, '    ');
            renderMarkdown();
        }
    });

    // 3. TOOLBAR ACTIONS
    
    // Download as .md file
    document.getElementById('btn-save').onclick = () => {
        if (!editor.value) return;
        const blob = new Blob([editor.value], { type: "text/markdown;charset=utf-8" });
        const a = document.createElement("a");
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = "developer_notes.md";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Copy the rendered HTML (useful for pasting into emails or blogs)
    document.getElementById('btn-copy-html').onclick = (e) => {
        if (!preview.innerHTML) return;
        navigator.clipboard.writeText(preview.innerHTML).then(() => {
            const orig = e.target.innerHTML;
            e.target.innerHTML = "✔✔ Copied HTML!";
            setTimeout(() => e.target.innerHTML = orig, 1500);
        });
    };

    // Clear Notes
    document.getElementById('btn-clear').onclick = () => {
        if (editor.value && confirm("Clear all notes? This cannot be undone.")) {
            editor.value = '';
            renderMarkdown();
        }
    };
});