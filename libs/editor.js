document.addEventListener('DOMContentLoaded', () => {
    const btnCompare = document.getElementById('btn-compare');
    const btnClear = document.getElementById('btn-clear');
    const diffOriginal = document.getElementById('diff-original');
    const diffModified = document.getElementById('diff-modified');
    const resultWrapper = document.getElementById('diff-result-wrapper');
    const outLeft = document.getElementById('diff-out-left');
    const outRight = document.getElementById('diff-out-right');

    // Secure code from HTML injection before rendering
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag] || tag));
    }

    // Heuristic Line-by-Line Diff Engine
    function calculateDiff(oldStr, newStr) {
        const oldLines = oldStr.split('\n');
        const newLines = newStr.split('\n');
        let oldHTML = '';
        let newHTML = '';
        
        let i = 0, j = 0;
        
        while (i < oldLines.length || j < newLines.length) {
            const lineOld = oldLines[i];
            const lineNew = newLines[j];

            if (lineOld === lineNew && lineOld !== undefined) {
                // Lines are identical
                oldHTML += `<span class="diff-line diff-unchanged"><span class="diff-line-number">${i+1}</span>${escapeHTML(lineOld)}</span>`;
                newHTML += `<span class="diff-line diff-unchanged"><span class="diff-line-number">${j+1}</span>${escapeHTML(lineNew)}</span>`;
                i++; j++;
            } else {
                // Code mismatch found. Scan ahead to find where they sync back up.
                let resyncI = -1;
                let resyncJ = -1;
                const LOOKAHEAD = 50; // How many lines to scan ahead

                for (let offset = 1; offset < LOOKAHEAD; offset++) {
                    if (i + offset < oldLines.length && oldLines[i + offset] === lineNew) { resyncI = i + offset; break; }
                    if (j + offset < newLines.length && lineOld === newLines[j + offset]) { resyncJ = j + offset; break; }
                }

                if (resyncI !== -1) {
                    // Lines were REMOVED from the original code
                    while (i < resyncI) {
                        oldHTML += `<span class="diff-line diff-removed"><span class="diff-line-number">${i+1}</span>${escapeHTML(oldLines[i])}</span>`;
                        newHTML += `<span class="diff-line spacer-line"><span class="diff-line-number">-</span>-</span>`;
                        i++;
                    }
                } else if (resyncJ !== -1) {
                    // Lines were ADDED to the new code
                    while (j < resyncJ) {
                        oldHTML += `<span class="diff-line spacer-line"><span class="diff-line-number">-</span>-</span>`;
                        newHTML += `<span class="diff-line diff-added"><span class="diff-line-number">${j+1}</span>${escapeHTML(newLines[j])}</span>`;
                        j++;
                    }
                } else {
                    // Line was MODIFIED (Treat as one deleted, one added)
                    if (i < oldLines.length) {
                        oldHTML += `<span class="diff-line diff-removed"><span class="diff-line-number">${i+1}</span>${escapeHTML(oldLines[i])}</span>`;
                        i++;
                    } else {
                        oldHTML += `<span class="diff-line spacer-line"><span class="diff-line-number">-</span>-</span>`;
                    }
                    
                    if (j < newLines.length) {
                        newHTML += `<span class="diff-line diff-added"><span class="diff-line-number">${j+1}</span>${escapeHTML(newLines[j])}</span>`;
                        j++;
                    } else {
                        newHTML += `<span class="diff-line spacer-line"><span class="diff-line-number">-</span>-</span>`;
                    }
                }
            }
        }
        
        return { left: oldHTML, right: newHTML };
    }

    // Connect the Compare Button
    btnCompare.onclick = () => {
        if (!diffOriginal.value && !diffModified.value) return;
        
        const result = calculateDiff(diffOriginal.value, diffModified.value);
        outLeft.innerHTML = result.left;
        outRight.innerHTML = result.right;
        resultWrapper.style.display = "block";
    };

    // Synchronized Dual-Scrolling
    let isSyncingLeftScroll = false;
    let isSyncingRightScroll = false;

    outLeft.addEventListener('scroll', function() {
        if (!isSyncingLeftScroll) {
            isSyncingRightScroll = true;
            outRight.scrollTop = this.scrollTop;
            outRight.scrollLeft = this.scrollLeft;
        }
        isSyncingLeftScroll = false;
    });

    outRight.addEventListener('scroll', function() {
        if (!isSyncingRightScroll) {
            isSyncingLeftScroll = true;
            outLeft.scrollTop = this.scrollTop;
            outLeft.scrollLeft = this.scrollLeft;
        }
        isSyncingRightScroll = false;
    });

    // Clear Button
    btnClear.onclick = () => {
        diffOriginal.value = '';
        diffModified.value = '';
        resultWrapper.style.display = "none";
        outLeft.innerHTML = '';
        outRight.innerHTML = '';
    };
    // --- File Loading Logic ---
    function handleFileLoad(inputElement, textAreaElement) {
        inputElement.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(evt) {
                textAreaElement.value = evt.target.result;
            };
            reader.readAsText(file);
            this.value = ''; // Reset input
        });
    }

    handleFileLoad(document.getElementById('diff-file-original'), diffOriginal);
    handleFileLoad(document.getElementById('diff-file-modified'), diffModified);
});