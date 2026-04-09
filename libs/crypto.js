document.addEventListener('DOMContentLoaded', () => {
    async function getCryptoKey(password, salt) {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
        return crypto.subtle.deriveKey(
            { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
            keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
        );
    }

    async function logicEncrypt(text, pass) {
        if (!pass) throw new Error("Password required.");
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await getCryptoKey(pass, salt);
        const encryptedBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, new TextEncoder().encode(text));
        
        const combined = new Uint8Array(28 + encryptedBuf.byteLength);
        combined.set(salt, 0); combined.set(iv, 16); combined.set(new Uint8Array(encryptedBuf), 28);
        return "AES::" + window.btoa(String.fromCharCode.apply(null, combined));
    }

    async function logicDecrypt(cipher, pass) {
        if (!pass) throw new Error("Password required.");
        if (!cipher.startsWith("AES::")) throw new Error("Invalid format.");
        const combined = new Uint8Array(atob(cipher.replace("AES::", "")).split("").map(c => c.charCodeAt(0)));
        const salt = combined.slice(0, 16), iv = combined.slice(16, 28), data = combined.slice(28);
        
        const key = await getCryptoKey(pass, salt);
        const decryptedBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, data);
        return new TextDecoder().decode(decryptedBuf);
    }

    document.getElementById('crypto-btn-enc').onclick = async () => {
        const input = document.getElementById('crypto-input').value.trim();
        const pass = document.getElementById('crypto-pass').value;
        if (!input) return;
        try { document.getElementById('crypto-output').value = await logicEncrypt(input, pass); window.logMsg('crypto', 'Successfully Encrypted.', 'success');}
        catch(e) { document.getElementById('crypto-output').value = "Error: " + e.message; }
    };

    document.getElementById('crypto-btn-dec').onclick = async () => {
        const input = document.getElementById('crypto-input').value.trim();
        const pass = document.getElementById('crypto-pass').value;
        if (!input) return;
        try { document.getElementById('crypto-output').value = await logicDecrypt(input, pass); window.logMsg('crypto', 'Successfully Decrypted.', 'success');}
        catch(e) { document.getElementById('crypto-output').value = "Error: " + e.message; }
    };

    document.getElementById('crypto-btn-clear').onclick = () => {
        document.getElementById('crypto-input').value = '';
        document.getElementById('crypto-output').value = '';
        window.logMsg('crypto', 'Cleared fields.', 'info');
    };

    const dz = document.getElementById("crypto-drop-zone");
    const fi = document.getElementById("crypto-file-input");
    if(dz && fi){
        dz.onclick = () => fi.click();
        dz.ondragover = e => { e.preventDefault(); dz.style.borderColor = "#38bdf8"; };
        dz.ondragleave = () => dz.style.borderColor = "#1e293b";
        dz.ondrop = e => { e.preventDefault(); dz.style.borderColor = "#1e293b"; processFiles(e.dataTransfer.files); };
        fi.onchange = e => { processFiles(e.target.files); fi.value = ''; };
    }

    async function processFiles(files) {
        if(files.length === 0) return;

        if(files.length === 1) {
            document.getElementById('crypto-input').value = await files[0].text();
            window.logMsg('crypto', `Loaded ${files[0].name} into Input box.`, 'info');
            return;
        }

        const mode = document.querySelector('input[name="crypto-batch-mode"]:checked').value;
        let pass = document.getElementById('crypto-pass').value;

        if (!pass) {
            pass = window.prompt(`Please enter your secure password to ${mode} these files:`);
            if (!pass) { window.logMsg('crypto', 'Operation cancelled. Password required.', 'error'); return; }
            document.getElementById('crypto-pass').value = pass; 
        }

        window.logMsg('crypto', `Building ${mode} ZIP archive...`, "info");
        window.activeZips['crypto'] = new JSZip();

        for (let file of Array.from(files)) {
            try {
                const text = await file.text();
                let result = mode === 'encrypt' ? await logicEncrypt(text, pass) : await logicDecrypt(text.trim(), pass);
                
                // EXACT FILENAME PRESERVATION
                window.activeZips['crypto'].file(file.name, result);
                window.logMsg('crypto', `Processed: ${file.name}`, 'success');
            } catch (err) { window.logMsg('crypto', `Failed [${file.name}]: Bad password/file`, 'error'); }
        }
        window.logMsg('crypto', "ZIP Archive Ready! Click 'Zip Download' below.", "success");
    }
});