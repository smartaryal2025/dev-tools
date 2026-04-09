document.addEventListener('DOMContentLoaded', () => {

    // Helper: JWT Decoder
    function decodeJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            return JSON.stringify(JSON.parse(jsonPayload), null, 4);
        } catch(e) { throw new Error("Invalid JWT token string."); }
    }

    // Helper: Native Crypto Hashing
    async function hashText(algo, str) {
        const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(str));
        return Array.prototype.map.call(new Uint8Array(buf), x=>(('00'+x.toString(16)).slice(-2))).join('');
    }

    // Central Data Processing Engine (Now Async for Crypto)
    async function processData(text, type, mode) {
        if (!text) return "";
        try {
            // ONE-WAY SAFEGUARDS
            if (mode === 'decode' && (type === 'sha256' || type === 'sha512')) {
                throw new Error("Hashing is a one-way function. You cannot decode a hash.");
            }
            if (mode === 'encode' && type === 'jwt') {
                throw new Error("This tool only decodes existing JWT payloads. It cannot sign new ones.");
            }

            // CORE CONVERSIONS
            if (type === 'base64') {
                return mode === 'encode' 
                    ? window.btoa(unescape(encodeURIComponent(text))) 
                    : decodeURIComponent(escape(window.atob(text)));
            }
            if (type === 'url') {
                return mode === 'encode' ? encodeURIComponent(text) : decodeURIComponent(text);
            }
            if (type === 'unicode') {
                return mode === 'encode'
                    ? text.replace(/[\s\S]/g, c => '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4))
                    : text.replace(/\\u([0-9a-fA-F]{4})/g, (m, p1) => String.fromCharCode(parseInt(p1, 16)));
            }
            if (type === 'hex') {
                if (mode === 'encode') {
                    return text.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
                } else {
                    let cleanHex = text.replace(/\s+/g, '');
                    let str = '';
                    for (let i = 0; i < cleanHex.length; i += 2) str += String.fromCharCode(parseInt(cleanHex.substr(i, 2), 16));
                    return str;
                }
            }
            if (type === 'ascii') {
                return mode === 'encode'
                    ? text.split('').map(c => c.charCodeAt(0)).join(' ')
                    : text.trim().split(/\s+/).map(n => String.fromCharCode(n)).join('');
            }
            if (type === 'html-entities') {
                if (mode === 'encode') {
                    let a = document.createElement('div');
                    a.textContent = text;
                    return a.innerHTML;
                } else {
                    let a = document.createElement('div');
                    a.innerHTML = text;
                    return a.textContent;
                }
            }
            if (type === 'svg') {
                return mode === 'encode'
                    ? "data:image/svg+xml," + text.replace(/"/g, "'").replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").replace(/[\r\n%#()<>?[\\\]^`{|}]/g, encodeURIComponent)
                    : decodeURIComponent(text.replace("data:image/svg+xml,", ""));
            }
            if (type === 'json') {
                return mode === 'encode'
                    ? JSON.stringify(JSON.parse(text)) // Minify
                    : JSON.stringify(JSON.parse(text), null, 4); // Format
            }
            if (type === 'jwt') return decodeJWT(text);
            if (type === 'sha256') return await hashText("SHA-256", text);
            if (type === 'sha512') return await hashText("SHA-512", text);

        } catch (e) {
            throw new Error(e.message || `Data is corrupted or invalid for ${mode}ing ${type}.`);
        }
    }

    // --- UI BINDINGS ---
    document.getElementById('converter-btn-enc').onclick = async () => {
        const input = document.getElementById('converter-input').value;
        const type = document.getElementById('converter-type').value;
        if (!input) return;
        try { 
            document.getElementById('converter-output').value = await processData(input, type, 'encode'); 
            window.logMsg('converter', `Success: Encoded to ${type.toUpperCase()}.`, 'success');
        } catch(e) { 
            document.getElementById('converter-output').value = "Error: " + e.message; 
            window.logMsg('converter', e.message, 'error');
        }
    };

    document.getElementById('converter-btn-dec').onclick = async () => {
        const input = document.getElementById('converter-input').value;
        const type = document.getElementById('converter-type').value;
        if (!input) return;
        try { 
            document.getElementById('converter-output').value = await processData(input, type, 'decode'); 
            window.logMsg('converter', `Success: Decoded from ${type.toUpperCase()}.`, 'success');
        } catch(e) { 
            document.getElementById('converter-output').value = "Error: " + e.message; 
            window.logMsg('converter', e.message, 'error');
        }
    };

    document.getElementById('converter-btn-clear').onclick = () => {
        document.getElementById('converter-input').value = '';
        document.getElementById('converter-output').value = '';
        window.logMsg('converter', 'Cleared fields.', 'info');
    };

    // --- BATCH DRAG & DROP LOGIC ---
    const dz = document.getElementById("converter-drop-zone");
    const fi = document.getElementById("converter-file-input");
    
    if (dz && fi) {
        dz.onclick = () => fi.click();
        dz.ondragover = e => { e.preventDefault(); dz.style.borderColor = "#14b8a6"; };
        dz.ondragleave = () => dz.style.borderColor = "#1e293b";
        dz.ondrop = e => { e.preventDefault(); dz.style.borderColor = "#1e293b"; processFiles(e.dataTransfer.files); };
        fi.onchange = e => { processFiles(e.target.files); fi.value = ''; };
    }

    async function processFiles(files) {
        if(files.length === 0) return;

        // SMART SINGLE FILE MODE
        if(files.length === 1) {
            document.getElementById('converter-input').value = await files[0].text();
            window.logMsg('converter', `Loaded ${files[0].name} into Input box.`, 'info');
            return;
        }

        // SMART BATCH MODE
        if(typeof JSZip === 'undefined') return window.logMsg('converter', "Missing jszip.min.js in libs folder.", "error");

        const mode = document.querySelector('input[name="converter-batch-mode"]:checked').value;
        const type = document.getElementById('converter-type').value;
        
        window.logMsg('converter', `Building ZIP archive (${mode}ing as ${type})...`, "info");
        window.activeZips['converter'] = new JSZip();

        for (let file of Array.from(files)) {
            try {
                const text = await file.text();
                const result = await processData(text, type, mode);
                
                // EXACT FILENAME PRESERVATION
                window.activeZips['converter'].file(file.name, result);
                window.logMsg('converter', `Processed: ${file.name}`, 'success');
            } catch (err) { 
                window.logMsg('converter', `Failed [${file.name}]: ${err.message}`, 'error'); 
            }
        }
        window.logMsg('converter', "ZIP Archive Ready! Click 'Zip Download' below.", "success");
    }
});