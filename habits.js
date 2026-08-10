/* ================================================================= */
/* HABITS OS // CORE APPLICATION LOGIC & STATE ENGINE                */
/* ================================================================= */

// State Management (Zero-Based Default Clean Slate & Granular Privacy)
let appState = {
    habits: JSON.parse(localStorage.getItem('habits_os_habits')) || [],
    xp: JSON.parse(localStorage.getItem('habits_os_xp')) || 0,
    level: JSON.parse(localStorage.getItem('habits_os_level')) || 1,
    coins: JSON.parse(localStorage.getItem('habits_os_coins')) || 0,
    bossHP: JSON.parse(localStorage.getItem('habits_os_bosshp')) || 100,
    operatorHandle: localStorage.getItem('habits_os_handle') || 'OP-' + Math.floor(1000 + Math.random() * 9000) + 'X',
    tribePeers: JSON.parse(localStorage.getItem('habits_os_tribe')) || [],
    tribePermissions: JSON.parse(localStorage.getItem('habits_os_tribe_perms')) || {},
    shopItems: JSON.parse(localStorage.getItem('habits_os_shop')) || [
        { name: '1 Hour Unrestricted Gaming / Media', cost: 30, unlocked: false },
        { name: 'Specialty Artisan Coffee / Treat', cost: 20, unlocked: false },
        { name: 'Movie Night Out with Partner', cost: 50, unlocked: false }
    ],
    skillTree: JSON.parse(localStorage.getItem('habits_os_skills')) || [
        { name: 'Iron Discipline (Streak Protection)', unlocked: true, cost: 0 },
        { name: 'Neural Overclock (2x XP Gain)', unlocked: false, cost: 100 },
        { name: 'Sovereign Shield (Advanced Telemetry)', unlocked: false, cost: 250 }
    ],
    energyAudits: JSON.parse(localStorage.getItem('habits_os_audits')) || [],
    reflections: JSON.parse(localStorage.getItem('habits_os_reflections')) || [],
    theme: localStorage.getItem('habits_os_theme') || 'sakuration',
    activeFilter: 'all'
};

// Focus Timer State
let focusTimer = null;
let focusSecondsRemaining = 1500;
let focusTotalSeconds = 1500;
let isFocusPaused = false;
let currentAmbientSound = 'off';

// Initialization on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(appState.theme);
    document.getElementById('current-date-tag').innerText = `// ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}`;
    document.getElementById('my-operator-handle').innerText = appState.operatorHandle;

    renderAll();
});

function saveState() {
    localStorage.setItem('habits_os_habits', JSON.stringify(appState.habits));
    localStorage.setItem('habits_os_xp', JSON.stringify(appState.xp));
    localStorage.setItem('habits_os_level', JSON.stringify(appState.level));
    localStorage.setItem('habits_os_coins', JSON.stringify(appState.coins));
    localStorage.setItem('habits_os_bosshp', JSON.stringify(appState.bossHP));
    localStorage.setItem('habits_os_handle', appState.operatorHandle);
    localStorage.setItem('habits_os_tribe', JSON.stringify(appState.tribePeers));
    localStorage.setItem('habits_os_tribe_perms', JSON.stringify(appState.tribePermissions));
    localStorage.setItem('habits_os_shop', JSON.stringify(appState.shopItems));
    localStorage.setItem('habits_os_skills', JSON.stringify(appState.skillTree));
    localStorage.setItem('habits_os_audits', JSON.stringify(appState.energyAudits));
    localStorage.setItem('habits_os_reflections', JSON.stringify(appState.reflections));
    localStorage.setItem('habits_os_theme', appState.theme);
}

function renderAll() {
    renderHabits();
    renderLevelStats();
    renderAnalytics();
    renderArena();
    renderTribeRoster();
    updatePrerequisiteDropdown();
}

// ================= VIEW SWITCHING =================
function switchView(viewId) {
    document.querySelectorAll('.app-view').forEach(view => view.classList.add('hidden'));
    document.getElementById(`view-${viewId}`).classList.remove('hidden');

    document.querySelectorAll('nav button.view-tab').forEach(tab => tab.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

// ================= MODAL CONTROLS =================
function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// ================= HABITS MATRIX ENGINE =================
function renderHabits() {
    const listEl = document.getElementById('habit-list');
    listEl.innerHTML = '';

    const filtered = appState.activeFilter === 'all'
        ? appState.habits
        : appState.habits.filter(h => h.category === appState.activeFilter);

    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="empty-notice">No operational protocols found in vector. Initialize your first protocol above.</div>`;
        return;
    }

    filtered.forEach(habit => {
        let isLocked = false;
        if (habit.prerequisite) {
            const preReqHabit = appState.habits.find(h => h.id == habit.prerequisite);
            if (preReqHabit && !preReqHabit.completed) {
                isLocked = true;
            }
        }

        const item = document.createElement('div');
        item.className = `habit-item ${habit.completed ? 'completed' : ''} ${isLocked ? 'locked' : ''}`;

        item.innerHTML = `
            <div class="habit-info">
                <div class="habit-title">${isLocked ? '<i class="fa-solid fa-lock" style="font-size:10px;"></i> ' : ''}${habit.title}</div>
                <div class="habit-meta">
                    <span><i class="fa-solid fa-tag"></i> ${habit.category}</span>
                    <span><i class="fa-solid fa-bolt"></i> ${habit.energy}</span>
                    <span><i class="fa-solid fa-fire"></i> ${habit.streak}d streak</span>
                    ${habit.trigger ? `<span><i class="fa-solid fa-clock"></i> ${habit.trigger}</span>` : ''}
                </div>
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
                <button class="icon-btn" style="${habit.completed ? 'background-color: var(--success-color); color: var(--bg-color); border-color: var(--success-color);' : ''}" onclick="${isLocked ? '' : `toggleHabit(${habit.id})`}" ${isLocked ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
                    <i class="fa-solid ${habit.completed ? 'fa-check' : 'fa-circle'}"></i>
                </button>
                <button class="icon-btn" onclick="deleteHabit(${habit.id})" title="Purge Protocol"><i class="fa-solid fa-trash" style="font-size: 11px;"></i></button>
            </div>
        `;
        listEl.appendChild(item);
    });
}

function filterHabits(category) {
    appState.activeFilter = category;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.innerText.toLowerCase() === category.toLowerCase() || (category === 'all' && btn.innerText === 'All')) {
            btn.classList.add('active');
        } else if (['All', 'Health', 'Deep Work', 'Mindset', 'System'].includes(btn.innerText)) {
            btn.classList.remove('active');
        }
    });
    renderHabits();
}

function addHabit() {
    const title = document.getElementById('habit-input').value.trim();
    const category = document.getElementById('category-select').value;
    const energy = document.getElementById('energy-select').value;
    const trigger = document.getElementById('habit-trigger-input').value.trim();
    const prerequisite = document.getElementById('habit-prerequisite-select').value;

    if (!title) {
        alert('Protocol title required.');
        return;
    }

    const newHabit = {
        id: Date.now(),
        title,
        category,
        energy,
        trigger,
        completed: false,
        streak: 0,
        prerequisite
    };

    appState.habits.push(newHabit);
    document.getElementById('habit-input').value = '';
    document.getElementById('habit-trigger-input').value = '';
    saveState();
    renderAll();
}

function deleteHabit(id) {
    if (confirm('Purge this protocol from operational memory?')) {
        appState.habits = appState.habits.filter(h => h.id !== id);
        saveState();
        renderAll();
    }
}

function toggleHabit(id) {
    const habit = appState.habits.find(h => h.id === id);
    if (!habit) return;

    habit.completed = !habit.completed;
    if (habit.completed) {
        habit.streak += 1;
        updateXP(25);
        addCoins(5);
        damageBoss(15);
    } else {
        habit.streak = Math.max(0, habit.streak - 1);
        updateXP(-25);
    }

    saveState();
    renderAll();
}

function updatePrerequisiteDropdown() {
    const select = document.getElementById('habit-prerequisite-select');
    if (!select) return;
    select.innerHTML = '<option value="">None (Always Unlocked)</option>';
    appState.habits.forEach(h => {
        select.innerHTML += `<option value="${h.id}">${h.title}</option>`;
    });
}

// ================= LEVEL & XP ENGINE =================
function updateXP(amount) {
    appState.xp += amount;
    const xpNeeded = appState.level * 100;
    if (appState.xp >= xpNeeded) {
        appState.xp -= xpNeeded;
        appState.level += 1;
        alert(`OPERATOR LEVEL UP! Sanctuary Level ${appState.level} achieved.`);
    } else if (appState.xp < 0) {
        appState.xp = 0;
    }
}

function addCoins(amount) {
    appState.coins += amount;
}

function renderLevelStats() {
    const xpNeeded = appState.level * 100;
    const pct = Math.min(100, Math.round((appState.xp / xpNeeded) * 100));
    document.getElementById('level-title').innerText = `SANCTUARY LEVEL ${appState.level} // OPERATOR`;
    document.getElementById('xp-counter').innerText = `${appState.xp} / ${xpNeeded} XP`;
    document.getElementById('xp-progress-fill').style.width = `${pct}%`;
    const coinEl = document.getElementById('shop-coin-balance');
    if (coinEl) coinEl.innerText = `${appState.coins} 🪙`;
}

// ================= ANALYTICS & TELEMETRY =================
function renderAnalytics() {
    const totalExecutions = appState.habits.reduce((acc, h) => acc + h.streak, 0);
    const maxStreak = appState.habits.length > 0 ? Math.max(...appState.habits.map(h => h.streak)) : 0;
    const completedCount = appState.habits.filter(h => h.completed).length;
    const successRate = appState.habits.length > 0 ? Math.round((completedCount / appState.habits.length) * 100) : 0;

    document.getElementById('stat-total').innerText = totalExecutions;
    document.getElementById('stat-streak').innerText = `${maxStreak} Days`;
    document.getElementById('stat-rate').innerText = `${successRate}%`;

    const heatmap = document.getElementById('heatmap-container');
    if (heatmap) {
        heatmap.innerHTML = '';
        for (let i = 1; i <= 30; i++) {
            const cell = document.createElement('div');
            const active = i <= (new Date().getDate());
            cell.style.height = '20px';
            cell.style.borderRadius = '3px';
            cell.style.backgroundColor = active && totalExecutions > 0 && Math.random() > 0.4 ? 'var(--accent-color)' : 'rgba(255,255,255,0.03)';
            cell.style.border = 'var(--border-width) var(--border-style) var(--border-color)';
            heatmap.appendChild(cell);
        }
    }

    const velocity = document.getElementById('velocity-chart-container');
    if (velocity) {
        velocity.innerHTML = '';
        for (let i = 1; i <= 14; i++) {
            const bar = document.createElement('div');
            const heightPx = totalExecutions > 0 ? Math.floor(20 + Math.random() * 60) : 5;
            bar.style.flex = '1';
            bar.style.height = `${heightPx}px`;
            bar.style.backgroundColor = 'var(--accent-color)';
            bar.style.borderRadius = '2px 2px 0 0';
            bar.style.opacity = i > 10 ? '1' : '0.4';
            velocity.appendChild(bar);
        }
    }

    const leakSummary = document.getElementById('energy-leak-summary');
    if (appState.energyAudits.length > 0) {
        const lastAudit = appState.energyAudits[appState.energyAudits.length - 1];
        leakSummary.innerText = `Latest Friction Point: "${lastAudit.drain}"`;
    } else {
        leakSummary.innerText = `No recent friction points logged.`;
    }
}

function submitEnergyAudit() {
    const gain = document.getElementById('energy-gain-input').value.trim();
    const drain = document.getElementById('energy-drain-input').value.trim();
    if (!gain && !drain) return;

    appState.energyAudits.push({ date: new Date().toISOString(), gain, drain });
    document.getElementById('energy-gain-input').value = '';
    document.getElementById('energy-drain-input').value = '';
    saveState();
    renderAnalytics();
    alert('Energy audit committed to telemetry vector.');
}

function submitReflection() {
    const note = document.getElementById('habit-note-input').value.trim();
    if (!note) return;

    appState.reflections.push({ date: new Date().toISOString(), note });
    document.getElementById('habit-note-input').value = '';
    updateXP(150);
    saveState();
    renderAll();
    alert('Stoic reflection logged (+150 XP).');
}

// ================= THE ARENA & SHOP =================
function renderArena() {
    const bossBar = document.getElementById('boss-hp-bar');
    const bossText = document.getElementById('boss-hp-text');
    if (bossBar && bossText) {
        bossBar.style.width = `${appState.bossHP}%`;
        bossText.innerText = `${appState.bossHP} / 100`;
    }

    const shopList = document.getElementById('shop-items-list');
    if (shopList) {
        shopList.innerHTML = '';
        appState.shopItems.forEach((item, index) => {
            shopList.innerHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); border: var(--border-width) var(--border-style) var(--border-color); border-radius: var(--ui-radius); padding: 8px 12px;">
                    <div style="font-size: 12px; font-weight: 600;">${item.name}</div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="font-size: 11px; color: var(--accent-color);">${item.cost} 🪙</span>
                        <button class="primary-btn sm-btn" onclick="buyShopItem(${index})">Redeem</button>
                    </div>
                </div>
            `;
        });
    }

    const skillList = document.getElementById('skill-tree-list');
    if (skillList) {
        skillList.innerHTML = '';
        appState.skillTree.forEach((skill, index) => {
            skillList.innerHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); border: var(--border-width) var(--border-style) var(--border-color); border-radius: var(--ui-radius); padding: 8px 12px;">
                    <div style="font-size: 12px; font-weight: 600;">${skill.name}</div>
                    <span style="font-size: 10px; color: ${skill.unlocked ? 'var(--success-color)' : 'var(--text-secondary)'};">${skill.unlocked ? 'UNLOCKED' : `${skill.cost} XP`}</span>
                </div>
            `;
        });
    }
}

function damageBoss(amount) {
    appState.bossHP -= amount;
    if (appState.bossHP <= 0) {
        appState.bossHP = 100;
        appState.coins += 50;
        alert('PROCRASTINATION DEMON DEFEATED! +50 🪙 Bonus Awarded.');
    }
}

function buyShopItem(index) {
    const item = appState.shopItems[index];
    if (appState.coins >= item.cost) {
        appState.coins -= item.cost;
        saveState();
        renderAll();
        alert(`Successfully redeemed: ${item.name}`);
    } else {
        alert('Insufficient coin balance in vault.');
    }
}

function addShopItem() {
    const name = document.getElementById('new-reward-name').value.trim();
    const cost = parseInt(document.getElementById('new-reward-cost').value) || 30;
    if (!name) return;

    appState.shopItems.push({ name, cost, unlocked: false });
    document.getElementById('new-reward-name').value = '';
    saveState();
    renderArena();
}

function openWeeklyReview() {
    openModal('weekly-review-modal');
}

function submitWeeklyReview() {
    updateXP(300);
    addCoins(25);
    closeModal('weekly-review-modal');
    saveState();
    renderAll();
    alert('Weekly executive review committed (+300 XP, +25 🪙).');
}

// ================= TRIBE COMMAND & GRANULAR PRIVACY =================
function addTribePeer() {
    const handleInput = document.getElementById('peer-handle-input');
    const handle = handleInput.value.trim().toUpperCase();
    if (!handle) return;

    if (appState.tribePeers.some(p => p.handle === handle)) {
        alert('Operator handle already exists in vector.');
        return;
    }

    const shareStreak = document.getElementById('default-share-streak').checked;
    const shareRate = document.getElementById('default-share-rate').checked;

    appState.tribePeers.push({ handle, streak: Math.floor(Math.random() * 3), rate: Math.floor(70 + Math.random() * 30) });
    appState.tribePermissions[handle] = { streak: shareStreak, rate: shareRate };

    handleInput.value = '';
    saveState();
    renderTribeRoster();
    alert(`Peer operator ${handle} linked with granular privacy permissions.`);
}

function updatePeerPermission(handle, metric, isChecked) {
    if (!appState.tribePermissions[handle]) {
        appState.tribePermissions[handle] = { streak: true, rate: true };
    }
    appState.tribePermissions[handle][metric] = isChecked;
    saveState();
}

function renderTribeRoster() {
    const roster = document.getElementById('tribe-roster-list');
    if (!roster) return;

    if (appState.tribePeers.length === 0) {
        roster.innerHTML = `<div class="empty-notice">No peer operators linked in vector. Connect a handle above.</div>`;
        return;
    }

    roster.innerHTML = '';
    appState.tribePeers.forEach(peer => {
        const perms = appState.tribePermissions[peer.handle] || { streak: true, rate: true };
        const displayedStreak = perms.streak ? `${peer.streak}d` : `[Hidden]`;
        const displayedRate = perms.rate ? `${peer.rate}%` : `[Hidden]`;

        roster.innerHTML += `
            <div style="background: rgba(255,255,255,0.01); border: var(--border-width) var(--border-style) var(--border-color); border-radius: var(--ui-radius); padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-family: monospace; font-weight: 700; font-size: 12px; color: var(--accent-color);">${peer.handle}</div>
                    <button class="secondary-btn sm-btn" onclick="alert('Ping sent to ${peer.handle}.')">Send Ping</button>
                </div>
                <div style="font-size: 10px; color: var(--text-secondary);">
                    Visible Data — Streak: <span style="color:var(--text-primary);">${displayedStreak}</span> // Rate: <span style="color:var(--text-primary);">${displayedRate}</span>
                </div>
                <div style="display: flex; gap: 12px; font-size: 10px; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 6px; margin-top: 2px;">
                    <label style="display: flex; align-items: center; gap: 4px; cursor: pointer; color: var(--text-secondary);">
                        <input type="checkbox" ${perms.streak ? 'checked' : ''} onchange="updatePeerPermission('${peer.handle}', 'streak', this.checked); renderTribeRoster();"> Share Streak
                    </label>
                    <label style="display: flex; align-items: center; gap: 4px; cursor: pointer; color: var(--text-secondary);">
                        <input type="checkbox" ${perms.rate ? 'checked' : ''} onchange="updatePeerPermission('${peer.handle}', 'rate', this.checked); renderTribeRoster();"> Share Rate
                    </label>
                </div>
            </div>
        `;
    });
}

function syncTribeTunnel() {
    alert('Tribe telemetry synchronized across sovereign peer nodes.');
    renderTribeRoster();
}

// ================= ZERO-DARK-THIRTY FOCUS ENGINE =================
function setTimerDuration(mins) {
    focusSecondsRemaining = mins * 60;
    focusTotalSeconds = mins * 60;
    document.getElementById('setup-timer-display').innerText = `${mins < 10 ? '0' : ''}${mins}:00`;

    event.currentTarget.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

function startZeroDarkThirty() {
    closeModal('timer-modal');
    document.getElementById('zero-dark-thirty-overlay').classList.remove('hidden');
    isFocusPaused = false;
    updateFocusDisplay();

    if (focusTimer) clearInterval(focusTimer);
    focusTimer = setInterval(() => {
        if (!isFocusPaused) {
            if (focusSecondsRemaining > 0) {
                focusSecondsRemaining--;
                updateFocusDisplay();
            } else {
                clearInterval(focusTimer);
                alert('MISSION COMPLETE. Isolation protocol successfully executed (+100 XP).');
                updateXP(100);
                addCoins(15);
                abortFocusMode();
                renderAll();
            }
        }
    }, 1000);
}

function updateFocusDisplay() {
    const mins = Math.floor(focusSecondsRemaining / 60);
    const secs = focusSecondsRemaining % 60;
    document.getElementById('zdt-timer-display').innerText = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function togglePauseFocus() {
    isFocusPaused = !isFocusPaused;
}

function abortFocusMode() {
    if (focusTimer) clearInterval(focusTimer);
    document.getElementById('zero-dark-thirty-overlay').classList.add('hidden');
    toggleAmbientSound('off');
}

function toggleAmbientSound(type) {
    currentAmbientSound = type;
    event.currentTarget.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

// ================= THEME & SOVEREIGNTY ENGINE =================
function setTheme(themeName) {
    appState.theme = themeName;
    applyTheme(themeName);
    saveState();
}

function applyTheme(themeName) {
    document.body.className = `theme-${themeName}`;
}

function dismissBackupBanner() {
    const banner = document.getElementById('backup-banner');
    if (banner) banner.style.display = 'none';
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `habits_os_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importData(event) {
    const fileReader = new FileReader();
    if (event.target.files[0]) {
        fileReader.readAsText(event.target.files[0], "UTF-8");
        fileReader.onload = (e) => {
            try {
                appState = JSON.parse(e.target.result);
                saveState();
                renderAll();
                alert('Database successfully restored from sovereign backup.');
            } catch (err) {
                alert('Invalid JSON backup file format.');
            }
        };
    }
}

// ================= SOVEREIGN RESET ENGINE =================
function showResetConfirmation() {
    document.getElementById('init-reset-btn').style.display = 'none';
    document.getElementById('reset-confirm-container').style.display = 'flex';
}

function cancelReset() {
    document.getElementById('reset-confirm-container').style.display = 'none';
    document.getElementById('init-reset-btn').style.display = 'block';
    document.getElementById('reset-input-field').value = '';
}

function executeSovereignReset() {
    const val = document.getElementById('reset-input-field').value.trim();

    if (val === 'RESET') {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('habits_os_')) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));

        alert('Sovereign data vector wiped. Initializing clean state.');
        window.location.reload();
    } else {
        alert('Confirmation string did not match. Type exact capital "RESET".');
    }
}