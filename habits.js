// ==========================================
// HABITS OS // SYSTEM V1.5
// ==========================================

let state = {
    habits: [],
    categories: ['Health', 'Deep Work', 'Mindset', 'System'],
    bundles: [
        { id: 'b_morning', name: 'Morning Launch Sequence', habits: [] },
        { id: 'b_deepwork', name: 'Deep Work habit', habits: [] }
    ],
    energyAudits: [],
    xp: 0,
    level: 1,
    theme: 'sakuration',
    reflections: []
};

let currentFilter = 'all';
let activeSelectingBundleId = null;
let focusTimerInterval = null;
let focusSecondsLeft = 25 * 60;
let focusTotalSeconds = 25 * 60;
let isFocusPaused = false;
let clickCount = 0;
let clickTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    const triggerElement = document.getElementById('secret-trigger');
    if (!triggerElement) return;

    triggerElement.addEventListener('click', () => {
        clickCount++;
        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => {
            clickCount = 0;
        }, 600);

        if (clickCount >= 5) {
            clickCount = 0;
            clearTimeout(clickTimer);
            toggleSecretTerminal();
        }
    });
});

function toggleSecretTerminal() {
    const terminal = document.getElementById('secret-terminal');
    if (terminal) {
        terminal.classList.toggle('hidden');
    }
}

// Initialization & Storage
window.addEventListener('DOMContentLoaded', () => {
    loadState();
    checkDailyRollover();
    setTheme(state.theme, false);
    updateDateTag();
    renderAll();
});

function loadState() {
    const saved = localStorage.getItem('habits_os_sovereign_state');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state = { ...state, ...parsed };
        } catch (e) {
            console.error('Failed to parse state, initializing clean defaults.', e);
        }
    }

    if (!state.bundles || state.bundles.length === 0) {
        state.bundles = [{ id: 'b_morning', name: 'Morning Launch Sequence', habits: [] }];
    }
}

function saveState() {
    localStorage.setItem('habits_os_sovereign_state', JSON.stringify(state));
}

// Tactile Haptic Feedback Helper
function triggerHaptic(duration = 35) {
    if (window.navigator && typeof window.navigator.vibrate === 'function') {
        window.navigator.vibrate(duration);
    }
}

// Daily Rollover Check
function checkDailyRollover() {
    const today = new Date().toISOString().slice(0, 10);
    const lastActive = localStorage.getItem('habits_os_last_date');

    if (!lastActive) {
        localStorage.setItem('habits_os_last_date', today);
        return;
    }

    if (lastActive !== today) {
        const lastDateObj = new Date(lastActive);
        const currentDateObj = new Date(today);
        const diffTime = Math.abs(currentDateObj - lastDateObj);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        state.habits.forEach(habit => {
            if (!habit.completedToday) {
                if (diffDays > 1) {
                    habit.streak = 0;
                }
            }
            habit.completedToday = false;
        });

        localStorage.setItem('habits_os_last_date', today);
        saveState();
    }
}

function updateDateTag() {
    const tag = document.getElementById('current-date-tag');
    if (tag) {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        tag.textContent = '// ' + new Date().toLocaleDateString('en-US', options).toUpperCase();
    }
}

// Master Render Controller
function renderAll() {
    renderHabits();
    renderCategoriesUI();
    renderLevelAndXP();
    renderAnalytics();
    populatePrerequisiteSelect();
}

// View Switcher
function switchView(viewName, event) {
    document.querySelectorAll('.app-view').forEach(v => v.classList.add('hidden'));
    document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));

    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) targetView.classList.remove('hidden');

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    triggerHaptic(15);

    if (viewName === 'analytics') {
        renderAnalytics();
    } else if (viewName === 'habits') {
        renderHabits();
    }
}

// ================= VIEW 1: HABITS MATRIX =================

function togglehabitCreator() {
    const card = document.getElementById('habit-creator-card');
    const icon = document.getElementById('creator-toggle-icon');
    const text = document.getElementById('creator-toggle-text');

    if (!card) return;

    // Check if the card is currently hidden
    const isHidden = card.style.display === 'none' || card.style.display === '';

    if (isHidden) {
        card.style.display = 'flex';
        if (icon) icon.className = 'fa-solid fa-minus';
        if (text) text.textContent = 'Cancel';
    } else {
        card.style.display = 'none';
        if (icon) icon.className = 'fa-solid fa-plus';
        if (text) text.textContent = 'New habit';
    }
}

function addHabit() {
    const nameInput = document.getElementById('habit-input');
    const categorySelect = document.getElementById('category-select');
    const energySelect = document.getElementById('energy-select');
    const timeblockSelect = document.getElementById('timeblock-select');
    const triggerInput = document.getElementById('habit-trigger-input');
    const prereqSelect = document.getElementById('habit-prerequisite-select');

    const name = nameInput.value.trim();
    if (!name) return;

    const newHabit = {
        id: 'habit_' + Date.now(),
        name: name,
        category: categorySelect.value,
        energy: energySelect.value,
        timeblock: timeblockSelect ? timeblockSelect.value : 'Morning',
        trigger: triggerInput.value.trim() || 'Unspecified anchor',
        prerequisite: prereqSelect.value || '',
        streak: 0,
        completedToday: false,
        history: {}
    };

    state.habits.push(newHabit);
    saveState();

    nameInput.value = '';
    triggerInput.value = '';
    triggerHaptic(30);
    renderAll();
}

function toggleHabit(id) {
    const habit = state.habits.find(h => h.id === id);
    if (!habit) return;

    if (habit.prerequisite) {
        const prereqHabit = state.habits.find(h => h.id === habit.prerequisite);
        if (prereqHabit && !prereqHabit.completedToday) {
            alert(`Locked: Complete prerequisite habit "${prereqHabit.name}" first.`);
            return;
        }
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    if (!habit.completedToday) {
        habit.completedToday = true;
        habit.streak += 1;
        habit.history[todayStr] = true;
        addXP(25);
        triggerHaptic(50);
    } else {
        habit.completedToday = false;
        habit.streak = Math.max(0, habit.streak - 1);
        delete habit.history[todayStr];
        addXP(-25);
        triggerHaptic(20);
    }

    saveState();
    renderAll();
}

function filterHabits(category, event) {
    currentFilter = category;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
    renderHabits();
}

function renderHabits() {
    const list = document.getElementById('habit-list');
    if (!list) return;

    let filtered = currentFilter === 'all'
        ? [...state.habits]
        : state.habits.filter(h => h.category === currentFilter);

    filtered.sort((a, b) => (a.completedToday === b.completedToday) ? 0 : a.completedToday ? 1 : -1);

    if (filtered.length === 0) {
        list.innerHTML = `<div class="stat-card" style="text-align: center; color: var(--text-secondary); font-size: 11px; padding: 20px;">No active habits found here.</div>`;
        return;
    }

    list.innerHTML = filtered.map(habit => {
        let isLocked = false;
        if (habit.prerequisite) {
            const prereq = state.habits.find(h => h.id === habit.prerequisite);
            if (prereq && !prereq.completedToday) {
                isLocked = true;
            }
        }

        return `
            <div class="habit-card ${habit.completedToday ? 'completed' : ''}" style="${isLocked ? 'opacity: 0.5;' : ''}">
                <div class="habit-info">
                    <div class="habit-title">${escapeHtml(habit.name)}</div>
                    <div class="habit-meta">
                        <span><i class="fa-solid fa-bolt"></i> ${habit.energy}</span>
                        <span><i class="fa-solid fa-fire" style="color: var(--accent-primary);"></i> ${habit.streak}d</span>
                        ${isLocked ? `<span style="color: var(--danger);"><i class="fa-solid fa-lock"></i> Locked</span>` : `<span><i class="fa-solid fa-clock"></i> ${escapeHtml(habit.trigger)}</span>`}
                    </div>
                </div>
                <div style="display: flex; gap: 6px; align-items: center;">
                    <button class="check-habit-btn" onclick="${isLocked ? `alert('Locked behind prerequisite habit!')` : `toggleHabit('${habit.id}')`}" aria-label="Execute habit">
                        <i class="fa-solid ${habit.completedToday ? 'fa-check' : 'fa-play'}"></i>
                    </button>
                    <button onclick="openEditHabitModal('${habit.id}')" title="Edit habit" style="background: transparent; border: 1px solid var(--border-glass); color: var(--text-secondary); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 11px;" aria-label="Edit habit">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button onclick="deleteHabit('${habit.id}')" title="Delete habit" style="background: transparent; border: 1px solid var(--border-glass); color: var(--text-secondary); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 11px;" aria-label="Delete habit">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function populatePrerequisiteSelect() {
    const select = document.getElementById('habit-prerequisite-select');
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = `<option value="">None (Always Unlocked)</option>` +
        state.habits.map(h => `<option value="${h.id}">${escapeHtml(h.name)}</option>`).join('');
    select.value = currentVal;
}

// XP & Leveling Engine
function addXP(amount) {
    state.xp += amount;
    const requiredXP = state.level * 100;
    if (state.xp >= requiredXP) {
        state.xp -= requiredXP;
        state.level += 1;
        triggerHaptic(100);
        alert(`LEVEL UP! Operator reached Level ${state.level}.`);
    }
    if (state.xp < 0) state.xp = 0;
    renderLevelAndXP();
}

function renderLevelAndXP() {
    const titleEl = document.getElementById('level-title');
    const counterEl = document.getElementById('xp-counter');
    const fillEl = document.getElementById('xp-progress-fill');

    if (!titleEl || !counterEl || !fillEl) return;

    const requiredXP = state.level * 100;
    titleEl.textContent = `SANCTUARY LEVEL ${state.level} // OPERATOR`;
    counterEl.textContent = `${state.xp} / ${requiredXP} XP`;
    const pct = Math.min(100, (state.xp / requiredXP) * 100);
    fillEl.style.width = `${pct}%`;
}

function openEditHabitModal(id) {
    const habit = state.habits.find(h => h.id === id);
    if (!habit) return;

    document.getElementById('edit-habit-id').value = habit.id;
    document.getElementById('edit-habit-name').value = habit.name;
    document.getElementById('edit-habit-energy').value = habit.energy;
    document.getElementById('edit-habit-trigger').value = habit.trigger || '';

    const timeblockSelect = document.getElementById('edit-habit-timeblock');
    if (timeblockSelect) timeblockSelect.value = habit.timeblock || 'Morning';

    const catSelect = document.getElementById('edit-habit-category');
    catSelect.innerHTML = state.categories.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('');
    catSelect.value = habit.category;

    const prereqSelect = document.getElementById('edit-habit-prerequisite');
    prereqSelect.innerHTML = `<option value="">None (Always Unlocked)</option>` +
        state.habits.filter(h => h.id !== id).map(h => `<option value="${h.id}">${escapeHtml(h.name)}</option>`).join('');
    prereqSelect.value = habit.prerequisite || '';

    openModal('edit-habit-modal');
}

function saveEditedHabit() {
    const idField = document.getElementById('edit-habit-id');
    const nameField = document.getElementById('edit-habit-name');

    if (!idField || !nameField) return;

    const id = idField.value;
    const habit = state.habits.find(h => h.id === id);
    if (!habit) {
        alert('Error: Habit not found.');
        return;
    }

    const name = nameField.value.trim();
    if (!name) {
        alert('Habit name cannot be empty.');
        return;
    }

    habit.name = name;
    habit.category = document.getElementById('edit-habit-category').value;
    habit.energy = document.getElementById('edit-habit-energy').value;
    const timeblockSelect = document.getElementById('edit-habit-timeblock');
    if (timeblockSelect) habit.timeblock = timeblockSelect.value;
    habit.trigger = document.getElementById('edit-habit-trigger').value.trim() || 'Unspecified anchor';
    habit.prerequisite = document.getElementById('edit-habit-prerequisite').value;

    saveState();
    renderAll();
    closeModal('edit-habit-modal');
}

function deleteHabit(id) {
    const habit = state.habits.find(h => h.id === id);
    if (!habit) return;

    if (!confirm(`Permanently purge habit "${habit.name}"?`)) return;

    if (habit.completedToday) {
        state.xp = Math.max(0, state.xp - 25);
    }

    state.habits = state.habits.filter(h => h.id !== id);
    state.bundles.forEach(b => {
        b.habits = b.habits.filter(hId => hId !== id);
    });

    saveState();
    renderAll();
}

// ================= HABIT SETS & MANUAL BATCH ENGINE =================

function launchSequence(bundleId) {
    activeSelectingBundleId = null;
    renderSequenceModalList();
    openModal('sequence-modal');
}

function createNewHabitSet() {
    const name = prompt('Enter Habit Set / Group Name (e.g., Deep Work Block, Morning Routine):');
    if (!name || !name.trim()) return;

    const newSet = {
        id: 'set_' + Date.now(),
        name: name.trim(),
        habits: []
    };

    state.bundles.push(newSet);
    saveState();
    renderSequenceModalList();
    triggerHaptic(30);
}

function deleteHabitSet(bundleId) {
    if (state.bundles.length <= 1) {
        alert('You must maintain at least one habit set.');
        return;
    }
    if (!confirm('Delete this habit set? (Assigned habits will remain safe in your main matrix).')) return;

    if (activeSelectingBundleId === bundleId) {
        activeSelectingBundleId = null;
    }

    state.bundles = state.bundles.filter(b => b.id !== bundleId);
    saveState();
    renderSequenceModalList();
    triggerHaptic(20);
}

function toggleHabitSelector(bundleId) {
    if (activeSelectingBundleId === bundleId) {
        activeSelectingBundleId = null;
    } else {
        activeSelectingBundleId = bundleId;
    }
    renderSequenceModalList();
}

function addHabitToSet(bundleId, habitId) {
    const bundle = state.bundles.find(b => b.id === bundleId);
    if (!bundle) return;

    if (!bundle.habits.includes(habitId)) {
        bundle.habits.push(habitId);
        saveState();
        renderSequenceModalList();
        triggerHaptic(25);
    }
}

function removeHabitFromSet(bundleId, habitId) {
    const bundle = state.bundles.find(b => b.id === bundleId);
    if (!bundle) return;

    bundle.habits = bundle.habits.filter(hId => hId !== habitId);
    saveState();
    renderSequenceModalList();
}

function completeBundleBatch(bundleId) {
    const bundle = state.bundles.find(b => b.id === bundleId);
    if (!bundle || bundle.habits.length === 0) {
        alert('This habit set is empty. Add habits to enable batch execution.');
        return;
    }

    let newlyCompletedCount = 0;
    const todayStr = new Date().toISOString().slice(0, 10);

    bundle.habits.forEach(habitId => {
        const habit = state.habits.find(h => h.id === habitId);
        if (habit && !habit.completedToday) {
            if (habit.prerequisite) {
                const prereq = state.habits.find(h => h.id === habit.prerequisite);
                if (prereq && !prereq.completedToday) {
                    return;
                }
            }

            habit.completedToday = true;
            habit.streak += 1;
            habit.history[todayStr] = true;
            newlyCompletedCount++;
        }
    });

    if (newlyCompletedCount > 0) {
        addXP(25 * newlyCompletedCount);
        triggerHaptic(90);
        alert(`⚡ BATCH EXECUTION COMPLETE: "${bundle.name}"\n+${newlyCompletedCount} habits marked as done instantly!`);
    } else {
        alert(`All habits in "${bundle.name}" are already completed today.`);
    }

    saveState();
    renderAll();
    renderSequenceModalList();
}

function renderSequenceModalList() {
    const container = document.getElementById('sequence-modal-list');
    const progressBar = document.getElementById('sequence-progress-bar');
    if (!container) return;

    const totalHabits = state.habits.length;
    const completedHabits = state.habits.filter(h => h.completedToday).length;
    const progressPercent = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;
    if (progressBar) progressBar.style.width = `${progressPercent}%`;

    if (state.bundles.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); padding: 20px;">No habit sets created yet.</div>
            <button class="primary-btn" onclick="createNewHabitSet()" style="width: 100%; justify-content: center;"><i class="fa-solid fa-plus"></i> Create Habit Set</button>
        `;
        return;
    }

    container.innerHTML = `
        <div style="display: flex; justify-content: flex-end; margin-bottom: 8px;">
            <button class="secondary-btn sm-btn" onclick="createNewHabitSet()"><i class="fa-solid fa-plus"></i> New Set</button>
        </div>
    ` + state.bundles.map(bundle => {
        const setHabits = bundle.habits.map(hId => state.habits.find(h => h.id === hId)).filter(Boolean);
        const allDone = setHabits.length > 0 && setHabits.every(h => h.completedToday);
        const isSelecting = (activeSelectingBundleId === bundle.id);
        const unassignedHabits = state.habits.filter(h => !bundle.habits.includes(h.id));

        return `
            <div style="background: rgba(255,255,255,0.02); border: 1px solid ${allDone ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-glass)'}; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                        <span>${escapeHtml(bundle.name)}</span>
                        <span style="font-size: 10px; color: var(--text-secondary);">(${setHabits.length} habits)</span>
                    </div>
                    <div style="display: flex; gap: 6px;">
                        <button class="primary-btn sm-btn" onclick="completeBundleBatch('${bundle.id}')" title="Execute entire set instantly">
                            <i class="fa-solid fa-bolt"></i> Execute Set
                        </button>
                        <button class="icon-btn" style="width: 28px; height: 28px; font-size: 10px;" onclick="deleteHabitSet('${bundle.id}')" title="Delete Set">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 4px; padding-left: 4px;">
                    ${setHabits.length === 0 ? `<div style="font-size: 11px; color: var(--text-muted); font-style: italic;">No habits in this set yet.</div>` :
                setHabits.map(h => `
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; background: rgba(0,0,0,0.2); padding: 6px 8px; border-radius: 6px;">
                                <span style="${h.completedToday ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${escapeHtml(h.name)}</span>
                                <button class="secondary-btn sm-btn" style="padding: 2px 6px; font-size: 10px;" onclick="removeHabitFromSet('${bundle.id}', '${h.id}')" title="Remove from set">Remove</button>
                            </div>
                        `).join('')}
                </div>

                <button class="secondary-btn sm-btn" style="align-self: flex-start; margin-top: 4px;" onclick="toggleHabitSelector('${bundle.id}')">
                    <i class="fa-solid ${isSelecting ? 'fa-chevron-up' : 'fa-plus'}"></i> ${isSelecting ? 'Close Picker' : 'Add habit Manually'}
                </button>

                ${isSelecting ? `
                    <div style="background: rgba(0,0,0,0.4); border: 1px dashed var(--border-glass); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
                        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary);">Select habits to Add:</div>
                        ${unassignedHabits.length === 0 ? `<div style="font-size: 11px; color: var(--text-muted); font-style: italic;">All habits are already in this set.</div>` :
                    unassignedHabits.map(uh => `
                                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; background: rgba(255,255,255,0.03); padding: 6px 8px; border-radius: 6px;">
                                    <span>${escapeHtml(uh.name)}</span>
                                    <button class="primary-btn sm-btn" style="padding: 2px 8px; font-size: 10px;" onclick="addHabitToSet('${bundle.id}', '${uh.id}')">+ Add</button>
                                </div>
                            `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// ================= VIEW 2: TELEMETRY & ANALYTICS =================

function renderAnalytics() {
    const totalExecutions = state.habits.reduce((acc, h) => acc + h.streak, 0);
    const topStreak = state.habits.length > 0 ? Math.max(...state.habits.map(h => h.streak), 0) : 0;

    let totalPossible = state.habits.length;
    let totalCompleted = state.habits.filter(h => h.completedToday).length;
    const successRate = totalPossible > 0 ? Math.round((totalCompleted / Math.max(1, totalPossible)) * 100) : 0;

    const statTotal = document.getElementById('stat-total');
    const statStreak = document.getElementById('stat-streak');
    const statRate = document.getElementById('stat-rate');

    if (statTotal) statTotal.textContent = totalExecutions;
    if (statStreak) statStreak.textContent = `${topStreak}d`;
    if (statRate) statRate.textContent = `${successRate}%`;

    renderHeatmap();
    renderVelocityChart();
}

function renderHeatmap() {
    const container = document.getElementById('heatmap-container');
    if (!container) return;

    let html = '';
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);

        let activeCount = state.habits.filter(h => h.history && h.history[dateStr]).length;
        let opacity = activeCount > 0 ? Math.min(1, 0.3 + (activeCount * 0.2)) : 0.05;
        let bg = activeCount > 0 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)';

        html += `<div title="${dateStr}: ${activeCount} habits" style="height: 18px; background-color: ${bg}; opacity: ${opacity}; border-radius: 3px;"></div>`;
    }
    container.innerHTML = html;
}

function renderVelocityChart() {
    const container = document.getElementById('velocity-chart-container');
    if (!container) return;

    let html = '';
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const count = state.habits.filter(h => h.history && h.history[dateStr]).length;
        const heightPct = Math.min(100, (count / Math.max(1, state.habits.length)) * 100);

        html += `<div style="flex: 1; display: flex; flex-direction: column; justify-content: flex-end; height: 100%;">
            <div style="background-color: var(--accent-primary); height: ${Math.max(1, heightPct)}%; border-radius: 2px 2px 0 0;" title="${dateStr}: ${count} completed"></div>
        </div>`;
    }
    container.innerHTML = html;
}

function renderCategoriesUI() {
    const filterContainer = document.getElementById('filter-bar-container');
    const selectContainer = document.getElementById('category-select');

    if (filterContainer) {
        let html = `<button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" onclick="filterHabits('all', event)">All</button>`;
        state.categories.forEach(cat => {
            html += `<button class="filter-btn ${currentFilter === cat ? 'active' : ''}" onclick="filterHabits('${escapeHtml(cat)}', event)">${escapeHtml(cat)}</button>`;
        });
        filterContainer.innerHTML = html;
    }

    if (selectContainer) {
        selectContainer.innerHTML = state.categories.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('');
    }
}

function promptNewCategory() {
    const dialog = document.getElementById('category-dialog');
    const input = document.getElementById('category-input');
    if (dialog && input) {
        input.value = '';
        dialog.showModal();
        input.focus();
    }
}

function closeCategoryDialog() {
    const dialog = document.getElementById('category-dialog');
    if (dialog) {
        dialog.close();
    }
}

function handleCategorySubmit(event) {
    event.preventDefault();
    const input = document.getElementById('category-input');
    if (!input) return;

    const newCat = input.value;
    const cleanCat = newCat.trim();

    if (cleanCat && !state.categories.includes(cleanCat)) {
        state.categories.push(cleanCat);
        saveState();
        renderCategoriesUI();
        const select = document.getElementById('category-select');
        if (select) select.value = cleanCat;
    }

    closeCategoryDialog();
}

// ================= VIEW 3: SETTINGS & SOVEREIGNTY =================

function setTheme(themeName, save = true) {
    state.theme = themeName;
    document.body.className = `theme-${themeName}`;
    if (save) saveState();
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `habits_os_sovereign_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const imported = JSON.parse(e.target.result);
            state = { ...state, ...imported };
            saveState();
            renderAll();
            alert('Data restored successfully.');
        } catch (err) {
            alert('Invalid backup JSON file.');
        }
    };
    reader.readAsText(file);
}

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
    if (val !== 'RESET') {
        alert('Type "RESET" exactly to confirm system wipe.');
        return;
    }

    localStorage.removeItem('habits_os_sovereign_state');
    localStorage.removeItem('habits_os_last_date');
    location.reload();
}

// ================= MODALS & TIMER ENGINES =================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

function startCustomFocusTimer() {
    const input = document.getElementById('custom-timer-input');
    if (!input) return;
    const mins = parseInt(input.value);
    if (isNaN(mins) || mins <= 0) {
        alert('Enter a valid focus duration in minutes.');
        return;
    }

    focusSecondsLeft = mins * 60;
    focusTotalSeconds = mins * 60;

    closeModal('timer-modal');
    const overlay = document.getElementById('zero-dark-thirty-overlay');
    if (overlay) overlay.style.display = 'flex';

    isFocusPaused = false;
    updateFocusDisplay();

    if (focusTimerInterval) clearInterval(focusTimerInterval);
    focusTimerInterval = setInterval(() => {
        if (!isFocusPaused) {
            focusSecondsLeft--;
            updateFocusDisplay();

            if (focusSecondsLeft <= 0) {
                clearInterval(focusTimerInterval);
                triggerHaptic(120);
                alert(`Focus timer (${mins}m) completed. +100 XP awarded.`);
                addXP(100);
                abortFocusMode();
            }
        }
    }, 1000);
}

function updateFocusDisplay() {
    const display = document.getElementById('zdt-timer-display');
    if (!display) return;

    const mins = Math.floor(focusSecondsLeft / 60);
    const secs = focusSecondsLeft % 60;
    display.textContent = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function togglePauseFocus() {
    isFocusPaused = !isFocusPaused;
}

function abortFocusMode() {
    if (focusTimerInterval) clearInterval(focusTimerInterval);
    const overlay = document.getElementById('zero-dark-thirty-overlay');
    if (overlay) overlay.style.display = 'none';
}

function openWeeklyReview() {
    openModal('weekly-review-modal');
}

function submitWeeklyReview() {
    addXP(300);
    closeModal('weekly-review-modal');
    alert('Weekly review saved. +300 XP.');
}

// Utility escape helper
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}