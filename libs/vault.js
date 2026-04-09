document.addEventListener('DOMContentLoaded', () => {
    const VAULT_KEY = "utility_studio_vault";

    // Cryptographically secure password generator
    function generateSecurePassword() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><,./-=";
        let pass = "";
        let randomValues = new Uint32Array(16);
        window.crypto.getRandomValues(randomValues);
        for (let i = 0; i < 16; i++) {
            pass += chars[randomValues[i] % chars.length];
        }
        return pass;
    }

    // LocalStorage Handlers
    function getVault() {
        return JSON.parse(localStorage.getItem(VAULT_KEY) || "[]");
    }

    function saveToVault(entry) {
        const vault = getVault();
        vault.push(entry);
        localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
    }

    window.removeFromVault = function(id) {
        if(!confirm("Are you sure you want to delete this password?")) return;
        let vault = getVault();
        vault = vault.filter(e => e.id !== id);
        localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
        renderVault();
    };

    window.copyFromVault = function(password, btn) {
        navigator.clipboard.writeText(password).then(() => {
            const orig = btn.innerHTML;
            btn.innerHTML = "✔";
            setTimeout(() => { btn.innerHTML = orig; }, 1000);
        });
    };

    // Modal UI Logic
    const modal = document.getElementById('vault-modal');
    const list = document.getElementById('vault-list');

    document.getElementById('open-vault-btn').onclick = () => {
        renderVault();
        modal.classList.add('active');
    };

    document.getElementById('close-vault-btn').onclick = () => {
        modal.classList.remove('active');
    };

    function renderVault() {
        const vault = getVault();
        list.innerHTML = "";
        
        if (vault.length === 0) {
            list.innerHTML = `<div style="text-align:center; color:var(--text-secondary); padding: 20px;">Vault is empty. Generate a password to save it here.</div>`;
            return;
        }

        // Render newest first
        vault.slice().reverse().forEach(entry => {
            const div = document.createElement('div');
            div.className = "vault-item";
            // Mask the password visually with dots
            const maskedPass = "••••••••••••••••"; 
            
            div.innerHTML = `
                <div class="vault-item-info">
                    <span class="vault-item-title">${entry.label}</span>
                    <span class="vault-item-date">${entry.date} <span style="margin-left:10px; color:var(--accent-primary); font-family:monospace;">${maskedPass}</span></span>
                </div>
                <div class="vault-item-actions">
                    <button class="btn-primary" onclick="copyFromVault('${entry.password.replace(/'/g, "\\'")}', this)" title="Copy Password">📋</button>
                    <button class="btn-danger" onclick="removeFromVault(${entry.id})" title="Delete">🗑️</button>
                </div>
            `;
            list.appendChild(div);
        });
    }

    // Attach Auto-Gen behavior to Tab 3 and Tab 4
    ['crypto', 'custom'].forEach(prefix => {
        const btn = document.getElementById(`${prefix}-gen-btn`);
        if (btn) {
            btn.onclick = () => {
                const pass = generateSecurePassword();
                document.getElementById(`${prefix}-pass`).value = pass;
                
                let label = prompt("✅ Secure Password Generated!\n\nTo save it to your local Vault, enter a label (e.g., 'Client Database'):");
                
                if (label) {
                    saveToVault({ 
                        id: Date.now(), 
                        label: label, 
                        password: pass, 
                        date: new Date().toLocaleDateString() 
                    });
                    navigator.clipboard.writeText(pass);
                    window.logMsg(prefix, `Password saved to Vault as '${label}' and copied to clipboard.`, 'success');
                } else {
                    window.logMsg(prefix, 'Password generated and applied, but NOT saved to vault.', 'warning');
                }
            };
        }
    });
});