// admin.js
const SUPA_URL = 'https://xcbklpgkunxvolgfjcto.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjYmtscGdrdW54dm9sZ2ZqY3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNTAxOTQsImV4cCI6MjA5NzcyNjE5NH0.nkVvJUQBtHg5xobypgjMq9Qh6MeZ8ncv8JfB6S4gvgI';

// Initialize Supabase Connection Client
const db = supabase.createClient(SUPA_URL, SUPA_KEY);

let collegesCache = [];
let roomsCache = [];
let currentDeleteContext = { table: null, id: null };

// ── GLOBAL APPLICATION TOAST SYSTEM ─────────────────────────
function toast(msg, type = 'success') {
    const el = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    document.getElementById('toastMsg').textContent = msg;
    el.className = `show ${type}`;
    icon.textContent = type === 'success' ? 'check_circle' : 'error';
    setTimeout(() => el.className = '', 3000);
}

// ── SECURITY SYSTEM LOGIN GATEWAY ───────────────────────────
document.getElementById('gateBtn').addEventListener('click', async () => {
    const email = document.getElementById('gateEmail').value.trim();
    const pass = document.getElementById('gatePass').value;
    const errEl = document.getElementById('gateError');
    errEl.textContent = 'Verifying admin credentials...';

    const { data, error } = await db.auth.signInWithPassword({ email, password: pass });
    if (error) { errEl.textContent = error.message; return; }

    document.getElementById('gate').style.display = 'none';
    loadAllData();
});

// ── NAVIGATION CONTROLLER LAYOUT TAB TILES ───────────────────
document.querySelectorAll('.nav-item[data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('sec-' + btn.dataset.section).classList.add('active');
    });
});

// ── CORE DATA ENGINE AGGREGATOR FETCHES ─────────────────────
async function loadAllData() {
    await Promise.all([loadRooms(), loadColleges(), loadExams(), loadUsers()]);
}

// ── CONTROLLER: ROOMS MANAGEMENT ───────────────────────────
async function loadRooms() {
    const { data, error } = await db.from('room')
        .select('roomID, roomNumber, description, roomImage, collegeID, college(collegeName)')
        .order('roomID');

    const tbody = document.getElementById('roomsTable');
    const recent = document.getElementById('recentRooms');

    if (error || !data) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="5">Could not load rooms: ${error?.message}</td></tr>`;
        return;
    }

    roomsCache = data;
    document.getElementById('statRooms').textContent = data.length;
    document.getElementById('badgeRooms').textContent = data.length;

    const examSel = document.getElementById('examRoomId');
    examSel.innerHTML = '<option value="">Select room...</option>';
    data.forEach(r => {
        examSel.innerHTML += `<option value="${r.roomID}">${r.roomNumber}</option>`;
    });

    tbody.innerHTML = data.length === 0
        ? `<tr class="empty-row"><td colspan="5">No rooms found. Click "Add Room" to begin.</td></tr>`
        : data.map(r => `
            <tr>
                <td style="color:var(--text-light);font-size:12px;">#${r.roomID}</td>
                <td style="font-weight:700;">${r.roomNumber}</td>
                <td><span class="college-chip">${r.college?.collegeName || 'General'}</span></td>
                <td style="color:var(--text-mid);max-width:260px;">${r.description || '—'}</td>
                <td>
                    <div class="td-actions">
                        <button class="btn btn-outline btn-sm" onclick="openEditRoom(${r.roomID})">
                            <span class="material-symbols-rounded" style="font-size:14px;">edit</span> Edit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="confirmDeleteRecord('room', ${r.roomID}, '${r.roomNumber}')">
                            <span class="material-symbols-rounded" style="font-size:14px;">delete</span>
                        </button>
                    </div>
                </td>
            </tr>`).join('');

    recent.innerHTML = data.slice(0, 5).map(r => `
        <tr>
            <td style="font-weight:700;">${r.roomNumber}</td>
            <td><span class="college-chip">${r.college?.collegeName || 'General'}</span></td>
            <td style="color:var(--text-mid);">${r.description || '—'}</td>
        </tr>`).join('');
}

// ── CONTROLLER: COLLEGES MANAGEMENT ─────────────────────────
async function loadColleges() {
    const { data, error } = await db.from('college').select('*').order('collegeID');
    const tbody = document.getElementById('collegesTable');

    if (error || !data) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="4">Could not load colleges: ${error?.message}</td></tr>`;
        return;
    }

    collegesCache = data;
    document.getElementById('statColleges').textContent = data.length;
    document.getElementById('badgeColleges').textContent = data.length;

    const sel = document.getElementById('roomCollegeId');
    sel.innerHTML = '<option value="">Select college...</option>';
    data.forEach(c => sel.innerHTML += `<option value="${c.collegeID}">${c.collegeName}</option>`);

    tbody.innerHTML = data.length === 0
        ? `<tr class="empty-row"><td colspan="4">No colleges configured.</td></tr>`
        : data.map(c => {
            const roomCount = roomsCache.filter(r => r.collegeID === c.collegeID).length;
            return `<tr>
                <td style="color:var(--text-light);font-size:12px;">#${c.collegeID}</td>
                <td style="font-weight:700;">${c.collegeName}</td>
                <td>${roomCount} active rooms</td>
                <td>
                    <div class="td-actions">
                        <button class="btn btn-danger btn-sm" onclick="confirmDeleteRecord('college', ${c.collegeID}, '${c.collegeName}')">
                            <span class="material-symbols-rounded" style="font-size:14px;">delete</span>
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
}

// ── CONTROLLER: EXAMS SYNC MANAGEMENT ────────────────────────
async function loadExams() {
    const { data, error } = await db.from('subjectExam')
        .select('examID, examType, section, dateTime, duration, roomID, room(roomNumber)')
        .order('examID');
        
    const tbody = document.getElementById('examsTable');
    if (error || !data) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Failed to sync exams.</td></tr>`;
        return;
    }

    document.getElementById('statExams').textContent = data.length;
    document.getElementById('badgeExams').textContent = data.length;

    tbody.innerHTML = data.length === 0
        ? `<tr class="empty-row"><td colspan="6">No scheduled exams.</td></tr>`
        : data.map(e => `
            <tr>
                <td style="color:var(--text-light);font-size:12px;">#${e.examID}</td>
                <td style="font-weight:700;">${e.examType}</td>
                <td>Room ${e.room?.roomNumber || 'N/A'}</td>
                <td><code>${e.section}</code></td>
                <td>${new Date(e.dateTime).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</td>
                <td>
                    <div class="td-actions">
                        <button class="btn btn-danger btn-sm" onclick="confirmDeleteRecord('subjectExam', ${e.examID}, '${e.examType}')">
                            <span class="material-symbols-rounded" style="font-size:14px;">delete</span>
                        </button>
                    </div>
                </td>
            </tr>`).join('');
}

// ── CONTROLLER: USER READ ONLY DATA SYNC ─────────────────────
async function loadUsers() {
    const { data, error } = await db.from('profiles').select('*');
    const tbody = document.getElementById('usersTable');
    
    if (error || !data) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="4">Profiles security restricted.</td></tr>`;
        return;
    }

    document.getElementById('statUsers').textContent = data.length;
    document.getElementById('badgeUsers').textContent = data.length;

    tbody.innerHTML = data.length === 0
        ? `<tr class="empty-row"><td colspan="4">No student users registered.</td></tr>`
        : data.map(u => `
            <tr>
                <td style="color:var(--text-light);font-size:12px;">#${u.id || u.collegeID || '—'}</td>
                <td style="font-weight:600;">${u.username || 'Anonymous User'}</td>
                <td>Student Group</td>
                <td>${u.dateRegistered ? new Date(u.dateRegistered).toLocaleDateString() : '—'}</td>
            </tr>`).join('');
}

// ── MODALS LAYER TRIGGER CONTROLS INTERACTIVE ENGINE ─────────
function toggleModal(id, isOpen = true) {
    const modal = document.getElementById(id);
    if (isOpen) modal.classList.add('open');
    else modal.classList.remove('open');
}

// Setup Event Bindings
document.getElementById('btnAddRoom').addEventListener('click', () => {
    document.getElementById('roomFormId').value = '';
    document.getElementById('roomModalTitle').textContent = 'Add New Room';
    toggleModal('roomModal', true);
});
document.getElementById('closeRoomModal').addEventListener('click', () => toggleModal('roomModal', false));
document.getElementById('cancelRoomModal').addEventListener('click', () => toggleModal('roomModal', false));

document.getElementById('btnAddCollege').addEventListener('click', () => {
    toggleModal('collegeModal', true);
});
document.getElementById('closeCollegeModal').addEventListener('click', () => toggleModal('collegeModal', false));
document.getElementById('cancelCollegeModal').addEventListener('click', () => toggleModal('collegeModal', false));

document.getElementById('btnAddExam').addEventListener('click', () => {
    toggleModal('examModal', true);
});
document.getElementById('closeExamModal').addEventListener('click', () => toggleModal('examModal', false));
document.getElementById('cancelExamModal').addEventListener('click', () => toggleModal('examModal', false));

// ── MUTATIONS WRITER MODULE (INSERT & UPDATES) ───────────────
document.getElementById('saveRoom').addEventListener('click', async () => {
    const num = document.getElementById('roomNumber').value.trim();
    const col = document.getElementById('roomCollegeId').value;
    const desc = document.getElementById('roomDesc').value.trim();
    const img = document.getElementById('roomImage').value.trim();

    if(!num) { toast('Room number string is required', 'error'); return; }

    const { error } = await db.from('room').insert([{ roomNumber: num, collegeID: col ? parseInt(col) : null, description: desc, roomImage: img }]);
    if (error) toast(error.message, 'error');
    else { toast('Room added live'); toggleModal('roomModal', false); loadAllData(); }
});

document.getElementById('saveCollege').addEventListener('click', async () => {
    const name = document.getElementById('collegeName').value.trim();
    if(!name) return;

    const { error } = await db.from('college').insert([{ collegeName: name }]);
    if (error) toast(error.message, 'error');
    else { toast('College abbreviation logged'); toggleModal('collegeModal', false); loadAllData(); }
});

document.getElementById('saveExam').addEventListener('click', async () => {
    const type = document.getElementById('examType').value.trim();
    const sec = document.getElementById('examSection').value.trim();
    const rId = document.getElementById('examRoomId').value;
    const dt = document.getElementById('examDateTime').value;

    const { error } = await db.from('subjectExam').insert([{ examType: type, section: sec, roomID: parseInt(rId), dateTime: dt }]);
    if (error) toast(error.message, 'error');
    else { toast('Exam calendar slot published'); toggleModal('examModal', false); loadAllData(); }
});

// ── REMOVALS ENGINE DESTROY SEQUENCER ─────────────────────────
window.confirmDeleteRecord = function(table, id, name) {
    currentDeleteContext = { table, id };
    document.getElementById('confirmText').textContent = `Are you sure you want to delete "${name}" from ${table} table?`;
    toggleModal('confirmModal', true);
};

document.getElementById('cancelDelete').addEventListener('click', () => toggleModal('confirmModal', false));

document.getElementById('confirmDelete').addEventListener('click', async () => {
    const { table, id } = currentDeleteContext;
    const key = table === 'room' ? 'roomID' : table === 'college' ? 'collegeID' : 'examID';

    const { error } = await db.from(table).delete().eq(key, id);
    toggleModal('confirmModal', false);
    
    if (error) toast(error.message, 'error');
    else { toast('Record permanently dropped'); loadAllData(); }
});