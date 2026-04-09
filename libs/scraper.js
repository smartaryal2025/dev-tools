document.addEventListener('DOMContentLoaded', () => {

    const rulesContainer = document.getElementById('rules-container');
    const logArea = document.getElementById('scrape-log-area');
    let ruleCount = 0;

    // Logging system
    function logMsg(msg, type="info"){
        const div = document.createElement("div");
        div.className = `log-${type}`;
        div.textContent = "> " + msg;
        logArea.appendChild(div);
        logArea.scrollTop = logArea.scrollHeight;
    }

    // Add a new extraction rule row
    function addRuleRow(nameStr = "", selectorStr = "", attrStr = "innerText") {
        ruleCount++;
        const rowId = `rule-${ruleCount}`;
        const div = document.createElement('div');
        div.className = 'rule-row';
        div.id = rowId;
        
        div.innerHTML = `
            <input type="text" class="custom-input rule-name" placeholder="Field Name (e.g. Title)" value="${nameStr}" style="flex: 1;">
            <input type="text" class="custom-input rule-selector" placeholder="CSS Selector (e.g. h2.title)" value="${selectorStr}" style="flex: 2;">
            <select class="custom-input rule-attr" style="flex: 1; padding: 0 5px;">
                <option value="innerText" ${attrStr==='innerText'?'selected':''}>Text Content</option>
                <option value="innerHTML" ${attrStr==='innerHTML'?'selected':''}>Inner HTML</option>
                <option value="href" ${attrStr==='href'?'selected':''}>Link (href)</option>
                <option value="src" ${attrStr==='src'?'selected':''}>Image (src)</option>
            </select>
            <button class="btn-remove-rule" onclick="document.getElementById('${rowId}').remove()">X</button>
        `;
        rulesContainer.appendChild(div);
    }

    // Initialize with two default rules to show the user how it works
    addRuleRow("Item_Title", "h2", "innerText");
    addRuleRow("Item_Link", "a", "href");

    document.getElementById('btn-add-rule').onclick = () => addRuleRow();

    // CORE EXTRACTION LOGIC
    document.getElementById('btn-extract').onclick = () => {
        const rawHTML = document.getElementById('scrape-html').value.trim();
        if (!rawHTML) return logMsg("Error: Please paste target HTML first.", "error");

        const parentSelector = document.getElementById('parent-selector').value.trim();
        const ruleRows = document.querySelectorAll('.rule-row');
        
        if (ruleRows.length === 0) return logMsg("Error: You need at least one extraction rule.", "error");

        // 1. Create a Virtual DOM from the pasted string
        logMsg("Parsing Virtual DOM...", "info");
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawHTML, 'text/html');

        // 2. Identify the target blocks (or the whole document)
        let items = [];
        if (parentSelector) {
            items = Array.from(doc.querySelectorAll(parentSelector));
            if (items.length === 0) return logMsg(`Error: Parent selector '${parentSelector}' found 0 matches.`, "error");
        } else {
            items = [doc]; // If no parent, search the whole doc once
        }

        // 3. Build the Rules Array
        const rules = [];
        ruleRows.forEach(row => {
            const name = row.querySelector('.rule-name').value.trim();
            const selector = row.querySelector('.rule-selector').value.trim();
            const attr = row.querySelector('.rule-attr').value;
            if (name && selector) rules.push({ name, selector, attr });
        });

        // 4. Extract Data
        logMsg(`Extracting ${rules.length} fields from ${items.length} item(s)...`, "info");
        const extractedData = [];

        items.forEach(item => {
            let rowData = {};
            rules.forEach(rule => {
                const el = item.querySelector(rule.selector);
                if (el) {
                    if (rule.attr === 'innerText') rowData[rule.name] = el.innerText.trim();
                    else if (rule.attr === 'innerHTML') rowData[rule.name] = el.innerHTML.trim();
                    else rowData[rule.name] = el.getAttribute(rule.attr) || "";
                } else {
                    rowData[rule.name] = null; // Element not found in this specific item
                }
            });
            // Only add if row has data
            if (Object.keys(rowData).length > 0 && Object.values(rowData).some(v => v !== null)) {
                extractedData.push(rowData);
            }
        });

        // 5. Output
        document.getElementById('scrape-output').value = JSON.stringify(extractedData, null, 4);
        logMsg(`Success: Extracted ${extractedData.length} records.`, "success");
    };


    // --- EXPORT & COPY HANDLERS ---
    
    document.getElementById('btn-copy-json').onclick = (e) => {
        const val = document.getElementById('scrape-output').value;
        if(!val) return;
        navigator.clipboard.writeText(val).then(() => {
            const orig = e.target.innerHTML; e.target.innerHTML = "✔ Copied!";
            setTimeout(() => { e.target.innerHTML = orig; }, 1500);
        });
    };

    document.getElementById('btn-dl-json').onclick = () => {
        const val = document.getElementById('scrape-output').value;
        if(!val) return logMsg("No data to download.", "error");
        const blob = new Blob([val], { type: 'application/json' });
        triggerDownload(blob, 'scraped_data.json');
    };

    document.getElementById('btn-dl-csv').onclick = () => {
        const val = document.getElementById('scrape-output').value;
        if(!val) return logMsg("No data to convert to CSV.", "error");
        
        try {
            const arr = JSON.parse(val);
            if (!arr.length) return;
            
            // Generate CSV Headers
            const keys = Object.keys(arr[0]);
            let csv = keys.map(k => `"${k}"`).join(',') + '\n';
            
            // Generate Rows
            arr.forEach(row => {
                csv += keys.map(k => {
                    let cell = row[k] === null ? "" : String(row[k]);
                    cell = cell.replace(/"/g, '""'); // Escape double quotes
                    return `"${cell}"`;
                }).join(',') + '\n';
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            triggerDownload(blob, 'scraped_data.csv');
            logMsg("CSV Downloaded successfully.", "success");
        } catch(e) {
            logMsg("Failed to generate CSV: Invalid JSON.", "error");
        }
    };

    function triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }
});