document.addEventListener('DOMContentLoaded', () => {
    let libsReady = false;

    async function loadFormatScript(name){
      return new Promise((resolve) => {
        const s = document.createElement("script");
        s.src = "libs/" + name;
        s.onload = () => resolve(true);
        s.onerror = () => {
            window.logMsg('minify', `Warning: Could not load ${name}. Make sure it is in the libs folder.`, "error");
            resolve(false); 
        };
        document.head.appendChild(s);
      });
    }

    async function initMinify(){
      window.logMsg('minify', "Loading local formatting libraries...", "info");
      await loadFormatScript("standalone.js");
      await loadFormatScript("parser-babel.js");
      await loadFormatScript("parser-html.js");
      await loadFormatScript("parser-postcss.js");
      await loadFormatScript("bundle.min.js");
      await loadFormatScript("csso.min.js");
      await loadFormatScript("htmlminifier.umd.bundle.min.js");
      libsReady = true;
      window.logMsg('minify', "All local formatting systems Ready.", "success");
    }
    initMinify();

    async function formatCodeCore(code, type, action) {
        if(!code) return "";
        if(type === "txt") return code.trim();

        if(action === "beautify"){
            if(type === "js") return prettier.format(code, { parser:"babel", plugins:prettierPlugins, tabWidth:2 });
            if(type === "css") return prettier.format(code, { parser:"css", plugins:prettierPlugins, tabWidth:2 });
            if(type === "html") return prettier.format(code, { parser:"html", plugins:prettierPlugins, tabWidth:2, htmlWhitespaceSensitivity:"ignore" });
        } else {
            if(type === "js") return (await Terser.minify(code)).code;
            if(type === "css") return csso.minify(code).css;
            if(type === "html") return await HTMLMinifier.minify(code, { collapseWhitespace: true, removeComments: true, minifyCSS: true, minifyJS: true, keepClosingSlash: true });
        }
    }

    document.getElementById('minify-btn-min').onclick = async () => {
        if(!libsReady) return alert("Libraries still loading...");
        const input = document.getElementById('minify-input').value;
        const type = document.getElementById('minify-type').value;
        if(!input) return;
        try { document.getElementById('minify-output').value = await formatCodeCore(input, type, 'minify'); window.logMsg('minify', 'Successfully Minified.', 'success'); } 
        catch(e) { document.getElementById('minify-output').value = "Error: " + e.message; }
    };

    document.getElementById('minify-btn-beautify').onclick = async () => {
        if(!libsReady) return alert("Libraries still loading...");
        const input = document.getElementById('minify-input').value;
        const type = document.getElementById('minify-type').value;
        if(!input) return;
        try { document.getElementById('minify-output').value = await formatCodeCore(input, type, 'beautify'); window.logMsg('minify', 'Successfully Beautified.', 'success'); } 
        catch(e) { document.getElementById('minify-output').value = "Error: " + e.message; }
    };

    document.getElementById('minify-btn-clear').onclick = () => {
        document.getElementById('minify-input').value = '';
        document.getElementById('minify-output').value = '';
        window.logMsg('minify', 'Cleared fields.', 'info');
    };

    const dz = document.getElementById("minify-drop-zone");
    const fi = document.getElementById("minify-file-input");
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
            const file = files[0];
            document.getElementById('minify-input').value = await file.text();
            const ext = file.name.split('.').pop().toLowerCase();
            if(['js','css','html','htm','txt'].includes(ext)) {
                document.getElementById('minify-type').value = ext === 'htm' ? 'html' : ext;
            }
            window.logMsg('minify', `Loaded ${file.name} into Input box.`, 'info');
            return;
        }

        if(!libsReady) return window.logMsg('minify', "Libraries still loading...", "error");

        const action = document.querySelector('input[name="minify-batch-mode"]:checked').value;
        window.logMsg('minify', `Building ${action} ZIP archive...`, "info");
        
        window.activeZips['minify'] = new JSZip();

        for(let file of Array.from(files)) {
            const ext = file.name.split('.').pop().toLowerCase();
            let type = ext === 'htm' ? 'html' : ext;
            if(!['js','css','html','txt'].includes(type)) {
                window.logMsg('minify', `Skipped ${file.name} (unsupported)`, 'error'); continue;
            }
            try {
                const rawCode = await file.text();
                const result = await formatCodeCore(rawCode, type, action);
                
                // EXACT FILENAME PRESERVATION
                window.activeZips['minify'].file(file.name, result);
                window.logMsg('minify', `Processed: ${file.name}`, 'success');
            } catch(err) { window.logMsg('minify', `Failed [${file.name}]: ${err.message}`, 'error'); }
        }
        window.logMsg('minify', "ZIP Archive Ready! Click 'Zip Download' below.", "success");
    }
});