document.addEventListener('DOMContentLoaded', () => {
    const btnEnc = document.getElementById('custom-btn-enc');
    if (!btnEnc) return; 

    // The Polyalphabetic Encrypt Logic
    function customEncrypt(text, pass) {
        if (!pass) throw new Error("Password required to run cipher.");
        let b64 = window.btoa(unescape(encodeURIComponent(text)));
        let shifted = '';
        for (let i = 0; i < b64.length; i++) {
            let passCharValue = pass.charCodeAt(i % pass.length);
            shifted += String.fromCharCode(b64.charCodeAt(i) + passCharValue);
        }
        return "KISH::" + window.btoa(shifted);
    }

    // The Polyalphabetic Decrypt Logic
    function customDecrypt(cipher, pass) {
        if (!pass) throw new Error("Password required to run cipher.");
        if (!cipher.startsWith("KISH::")) throw new Error("Invalid format. Missing KISH:: header.");
        let shifted;
        try { shifted = window.atob(cipher.substring(6)); } 
        catch(e) { throw new Error("Data is corrupted or modified."); }

        let unshifted = '';
        for (let i = 0; i < shifted.length; i++) {
            let passCharValue = pass.charCodeAt(i % pass.length);
            unshifted += String.fromCharCode(shifted.charCodeAt(i) - passCharValue);
        }
        try { return decodeURIComponent(escape(window.atob(unshifted))); } 
        catch (e) { throw new Error("Bad Password. The algorithm resulted in gibberish."); }
    }

    // --- UI BINDINGS ---
    document.getElementById('custom-btn-enc').onclick = () => {
        const input = document.getElementById('custom-input').value.trim();
        const pass = document.getElementById('custom-pass').value;
        if (!input) return;
        try { document.getElementById('custom-output').value = customEncrypt(input, pass); window.logMsg('custom', 'Algorithm Applied.', 'success'); } 
        catch(e) { document.getElementById('custom-output').value = "Error: " + e.message; window.logMsg('custom', e.message, 'error'); }
    };

    document.getElementById('custom-btn-dec').onclick = () => {
        const input = document.getElementById('custom-input').value.trim();
        const pass = document.getElementById('custom-pass').value;
        if (!input) return;
        try { document.getElementById('custom-output').value = customDecrypt(input, pass); window.logMsg('custom', 'Algorithm Reversed.', 'success'); } 
        catch(e) { document.getElementById('custom-output').value = "Error: " + e.message; window.logMsg('custom', e.message, 'error'); }
    };

    document.getElementById('custom-btn-clear').onclick = () => {
        document.getElementById('custom-input').value = '';
        document.getElementById('custom-output').value = '';
        window.logMsg('custom', 'Cleared fields.', 'info');
    };

    const dz = document.getElementById("custom-drop-zone");
    const fi = document.getElementById("custom-file-input");
    if (dz && fi) {
        dz.onclick = () => fi.click();
        dz.ondragover = e => { e.preventDefault(); dz.style.borderColor = "#38bdf8"; };
        dz.ondragleave = () => dz.style.borderColor = "#1e293b";
        dz.ondrop = e => { e.preventDefault(); dz.style.borderColor = "#1e293b"; processFiles(e.dataTransfer.files); };
        fi.onchange = e => { processFiles(e.target.files); fi.value = ''; };
    }

    async function processFiles(files) {
        if(files.length === 0) return;

        if(files.length === 1) {
            document.getElementById('custom-input').value = await files[0].text();
            window.logMsg('custom', `Loaded ${files[0].name} into Input box.`, 'info');
            return;
        }

        if(typeof JSZip === 'undefined') return window.logMsg('custom', "Missing jszip.min.js in libs folder.", "error");

        const mode = document.querySelector('input[name="custom-batch-mode"]:checked').value;
        let pass = document.getElementById('custom-pass').value;

        if (!pass) {
            pass = window.prompt(`Please enter your custom password to ${mode === 'encrypt' ? 'obfuscate' : 'reveal'} these files:`);
            if (!pass) { window.logMsg('custom', 'Operation cancelled. Password required.', 'error'); return; }
            document.getElementById('custom-pass').value = pass; 
        }

        window.logMsg('custom', `Building ${mode} ZIP archive with custom cipher...`, "info");
        window.activeZips['custom'] = new JSZip();

        for (let file of Array.from(files)) {
            try {
                const text = await file.text();
                let result = mode === 'encrypt' ? customEncrypt(text, pass) : customDecrypt(text.trim(), pass);
                
                // EXACT FILENAME PRESERVATION
                window.activeZips['custom'].file(file.name, result);
                window.logMsg('custom', `Processed: ${file.name}`, 'success');
            } catch (err) { window.logMsg('custom', `Failed [${file.name}]: ${err.message}`, 'error'); }
        }
        window.logMsg('custom', "ZIP Archive Ready! Click 'Zip Download' below.", "success");
    }
});