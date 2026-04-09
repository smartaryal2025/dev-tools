document.addEventListener('DOMContentLoaded', () => {
    function packLogic(rawCode) {
        const encodedData = window.btoa(unescape(encodeURIComponent(rawCode)));
        return `(function(_0x1a2b,_0x3c4d){eval(decodeURIComponent(escape(atob(_0x1a2b))));})("${encodedData}");`;
    }

    function unpackLogic(packedCode) {
        try {
            const match = packedCode.match(/\(\"([A-Za-z0-9+/=]+)\"\)/);
            if (match && match[1]) return decodeURIComponent(escape(window.atob(match[1])));
            throw new Error("Could not find valid Base64 payload.");
        } catch (e) { throw new Error("Error unpacking: " + e.message); }
    }

    document.getElementById('packer-btn-pack').onclick = () => {
        const input = document.getElementById('packer-input').value.trim();
        if (!input) return;
        try { document.getElementById('packer-output').value = packLogic(input); window.logMsg('packer', 'Successfully Packed.', 'success');} 
        catch (e) { document.getElementById('packer-output').value = "Error packing code."; }
    };

    document.getElementById('packer-btn-unpack').onclick = () => {
        const input = document.getElementById('packer-input').value.trim();
        if (!input) return;
        try { document.getElementById('packer-output').value = unpackLogic(input); window.logMsg('packer', 'Successfully Unpacked.', 'success');}
        catch (e) { document.getElementById('packer-output').value = e.message; }
    };

    document.getElementById('packer-btn-clear').onclick = () => {
        document.getElementById('packer-input').value = '';
        document.getElementById('packer-output').value = '';
        window.logMsg('packer', 'Cleared fields.', 'info');
    };

    const dz = document.getElementById("packer-drop-zone");
    const fi = document.getElementById("packer-file-input");
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
            document.getElementById('packer-input').value = await files[0].text();
            window.logMsg('packer', `Loaded ${files[0].name} into Input box.`, 'info');
            return;
        }

        const mode = document.querySelector('input[name="packer-batch-mode"]:checked').value;
        window.logMsg('packer', `Building ${mode} ZIP archive...`, "info");
        window.activeZips['packer'] = new JSZip();

        for (let file of Array.from(files)) {
            if (!file.name.endsWith('.js')) { window.logMsg('packer', `Skipped ${file.name} (Not JS)`, 'error'); continue; }
            try {
                const rawCode = await file.text();
                const result = mode === 'pack' ? packLogic(rawCode) : unpackLogic(rawCode);

                // EXACT FILENAME PRESERVATION
                window.activeZips['packer'].file(file.name, result);
                window.logMsg('packer', `Processed: ${file.name}`, 'success');
            } catch (err) { window.logMsg('packer', `Failed [${file.name}]: ${err.message}`, 'error'); }
        }
        window.logMsg('packer', "ZIP Archive Ready! Click 'Zip Download' below.", "success");
    }
});