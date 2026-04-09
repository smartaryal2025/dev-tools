document.addEventListener('DOMContentLoaded', () => {

    // The exact proprietary copyright block
    const COPYRIGHT_TEXT = `/*!
 * Copyright (c) 2026 Kishor Aryal. All rights reserved.
 * Application: Utility Studio
 * Website: https://kishoraryal.com.np
 * * PROPRIETARY AND CONFIDENTIAL
 * This source code and associated documentation are proprietary to Kishor Aryal.
 * Unauthorized copying, reproduction, distribution, modification, or use of this 
 * file, via any medium, is strictly prohibited without express written permission.
 * * Violators will be prosecuted to the maximum extent possible under the law.
 */`;

    // Smart Removal Logic: Uses Regex to find the block regardless of slight whitespace/newline differences
    function removeCopyright(code) {
        if (!code) return "";
        const crRegex = /\/\*![\s\S]*?Copyright \(c\) 2026 Kishor Aryal[\s\S]*?Violators will be prosecuted[\s\S]*?\*\/\s*/i;
        return code.replace(crRegex, '').trim();
    }

    // Smart Injection Logic: Removes first (to prevent double-injection), then prepends text
    function injectCopyright(code) {
        if (!code) return "";
        const cleanCode = removeCopyright(code);
        return COPYRIGHT_TEXT + '\n\n' + cleanCode;
    }

    // --- UI BINDINGS ---
    document.getElementById('copyright-btn-inject').onclick = () => {
        const input = document.getElementById('copyright-input').value.trim();
        if (!input) return;
        document.getElementById('copyright-output').value = injectCopyright(input); 
        window.logMsg('copyright', 'Success: Proprietary header injected.', 'success');
    };

    document.getElementById('copyright-btn-remove').onclick = () => {
        const input = document.getElementById('copyright-input').value.trim();
        if (!input) return;
        document.getElementById('copyright-output').value = removeCopyright(input); 
        window.logMsg('copyright', 'Success: Proprietary header completely stripped.', 'success');
    };

    document.getElementById('copyright-btn-clear').onclick = () => {
        document.getElementById('copyright-input').value = '';
        document.getElementById('copyright-output').value = '';
        window.logMsg('copyright', 'Cleared fields.', 'info');
    };


    // --- BATCH DRAG & DROP LOGIC ---
    const dz = document.getElementById("copyright-drop-zone");
    const fi = document.getElementById("copyright-file-input");
    
    if (dz && fi) {
        dz.onclick = () => fi.click();
        dz.ondragover = e => { e.preventDefault(); dz.style.borderColor = "#38bdf8"; };
        dz.ondragleave = () => dz.style.borderColor = "#1e293b";
        dz.ondrop = e => { e.preventDefault(); dz.style.borderColor = "#1e293b"; processFiles(e.dataTransfer.files); };
        fi.onchange = e => { processFiles(e.target.files); fi.value = ''; };
    }

    async function processFiles(files) {
        if(files.length === 0) return;

        // SMART SINGLE FILE MODE
        if(files.length === 1) {
            document.getElementById('copyright-input').value = await files[0].text();
            window.logMsg('copyright', `Loaded ${files[0].name} into Input box.`, 'info');
            return;
        }

        // SMART BATCH MODE
        if(typeof JSZip === 'undefined') return window.logMsg('copyright', "Missing jszip.min.js in libs folder.", "error");

        const mode = document.querySelector('input[name="copyright-batch-mode"]:checked').value;
        window.logMsg('copyright', `Building ZIP archive (Mode: ${mode.toUpperCase()})...`, "info");
        window.activeZips['copyright'] = new JSZip();

        for (let file of Array.from(files)) {
            try {
                const text = await file.text();
                let result = mode === 'inject' ? injectCopyright(text) : removeCopyright(text);
                
                // EXACT FILENAME PRESERVATION (As requested by user)
                window.activeZips['copyright'].file(file.name, result);
                window.logMsg('copyright', `Processed: ${file.name}`, 'success');
            } catch (err) { 
                window.logMsg('copyright', `Failed [${file.name}]: ${err.message}`, 'error'); 
            }
        }
        window.logMsg('copyright', "ZIP Archive Ready! Click 'Zip Download' below.", "success");
    }
});