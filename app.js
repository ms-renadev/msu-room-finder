const supabaseUrl = 'https://xcbklpgkunxvolgfjcto.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjYmtscGdrdW54dm9sZ2ZqY3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNTAxOTQsImV4cCI6MjA5NzcyNjE5NH0.nkVvJUQBtHg5xobypgjMq9Qh6MeZ8ncv8JfB6S4gvgI';
let supabaseClient;

let liveRooms = [];
let gridContainer;
let searchInput;

// ── TICKER ──────────────────────────────────────────────────
const tickerItems = [
    { label: 'Multimedia Room', sub: 'CICS — First floor, left wing' },
    { label: 'Room 302', sub: 'CICS — Second floor, left wing' },
    { label: 'Math Departmental Exam', sub: 'MATH-EX1 — Main Hall Room 201' },
    { label: 'MSU Main Library', sub: 'LIB-101 — Library Bldg Ground Floor' },
    { label: 'Board Exam Venue', sub: 'BOARD-01 — Gymnasium, Ground Floor' },
    { label: 'Engineering Room', sub: 'COE — Engineering Bldg 3F' },
];

function initTicker() {
    const track = document.getElementById('tickerTrack');
    if (!track) return;
    let current = 0;

    tickerItems.forEach((item, i) => {
        const slide = document.createElement('button');
        slide.className = 'ticker-slide' + (i === 0 ? ' active' : '');
        slide.innerHTML = `<strong>${item.label}</strong><span>${item.sub}</span>`;
        slide.addEventListener('click', () => filterByTicker(item));
        track.appendChild(slide);
    });

    const dotsEl = document.getElementById('tickerDots');
    if (dotsEl) {
        tickerItems.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'ticker-dot' + (i === 0 ? ' active' : '');
            dot.addEventListener('click', () => goTo(i));
            dotsEl.appendChild(dot);
        });
    }

    function goTo(idx) {
        track.querySelectorAll('.ticker-slide').forEach(s => s.classList.remove('active'));
        dotsEl?.querySelectorAll('.ticker-dot').forEach(d => d.classList.remove('active'));
        track.querySelectorAll('.ticker-slide')[idx]?.classList.add('active');
        dotsEl?.querySelectorAll('.ticker-dot')[idx]?.classList.add('active');
        current = idx;
    }

    setInterval(() => goTo((current + 1) % tickerItems.length), 3000);
}

function filterByTicker(item) {
    if (!liveRooms.length) return;
    const term = item.label.toLowerCase();
    const filtered = liveRooms.filter(r =>
        r.code.toLowerCase().includes(term) ||
        r.info.toLowerCase().includes(term) ||
        r.direction.toLowerCase().includes(term)
    );
    displayRooms(filtered.length ? filtered : liveRooms);
    document.getElementById('gridContainer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── DATABASE ─────────────────────────────────────────────────
async function fetchRoomsFromDatabase() {
    if (!supabaseClient) { console.warn('Supabase not initialized.'); return; }

    try {
        // Step 1: Try with JOIN (works only if college table also has RLS policy or RLS disabled)
        let { data, error } = await supabaseClient
            .from('room')
            .select('roomID, roomNumber, description, roomImage, college ( collegeName )');

        if (error) {
            console.warn('JOIN query failed, trying without JOIN:', error.message);
            // Step 2: Fallback — fetch rooms only, without college join
            const fallback = await supabaseClient
                .from('room')
                .select('roomID, roomNumber, description, roomImage, collegeID');

            if (fallback.error) {
                console.error('Both queries failed:', fallback.error.message);
                showDbError('Cannot load rooms: ' + fallback.error.message);
                return;
            }
            data = fallback.data;
        }

        if (data && data.length > 0) {
            console.log('✅ Rooms loaded:', data);
            liveRooms = data.map(r => ({
                id: r.roomID,
                code: r.roomNumber,
                direction: r.description || 'No directions yet.',
                image: r.roomImage || null,
                // college may be null if JOIN failed or college has no RLS policy
                info: (r.college && r.college.collegeName) ? r.college.collegeName : (r.collegeID ? 'College #' + r.collegeID : 'MSU Campus')
            }));
            displayRooms(liveRooms);
        } else {
            showDbError('No rooms in the database yet. Add rooms in Supabase → room table.');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
        showDbError('Unexpected error: ' + err.message);
    }
}

function showDbError(msg) {
    const grid = document.getElementById('gridContainer');
    if (grid) grid.innerHTML = `<div class="db-error-notice"><span class="material-symbols-rounded">warning</span><p>${msg}</p></div>`;
}

// ── RENDER CARDS ─────────────────────────────────────────────
function displayRooms(rooms) {
    gridContainer = gridContainer || document.getElementById('gridContainer');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    if (!rooms.length) { gridContainer.innerHTML = '<p class="empty-state">No rooms found.</p>'; return; }

    rooms.forEach(room => {
        const card = document.createElement('div');
        card.className = 'room-card';

        const imageBlock = room.image
            ? `<div class="card-img-wrap"><img src="${room.image}" alt="${room.code}" class="card-cover"></div>`
            : `<div class="card-img-placeholder"><div class="card-placeholder-flower">🌸</div></div>`;

        card.innerHTML = `
            ${imageBlock}
            <button class="card-bookmark" title="Save room">
                <span class="material-symbols-rounded">bookmark</span>
            </button>
            <div class="card-info">
                <span class="card-college-tag">${room.info}</span>
                <h3>${room.code}</h3>
                <p class="card-dir">${room.direction}</p>
            </div>`;

        card.querySelector('.card-bookmark').addEventListener('click', e => {
            e.stopPropagation();
            e.currentTarget.classList.toggle('saved');
        });

        gridContainer.appendChild(card);
    });
}

// ── AUTH MODAL ───────────────────────────────────────────────
function openModalNotice() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'flex';
}

function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const toggleBtn = document.getElementById('sidebarToggle');
    if (!sidebar || !toggleBtn) return;
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        if (mainContent) mainContent.classList.toggle('expanded');
    });
}

// ── SETUP ────────────────────────────────────────────────────
function setupEventListeners() {
    searchInput = document.getElementById('searchInput');
    gridContainer = document.getElementById('gridContainer');

    if (typeof window.supabase !== 'undefined') {
        supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    } else {
        console.error('Supabase CDN not loaded.');
    }

    initSidebar();
    initTicker();

    if (searchInput) {
        searchInput.addEventListener('input', e => {
            const term = e.target.value.toLowerCase();
            displayRooms(liveRooms.filter(r =>
                r.code.toLowerCase().includes(term) ||
                r.direction.toLowerCase().includes(term) ||
                r.info.toLowerCase().includes(term)
            ));
        });
    }

    const modal = document.getElementById('loginModal');
    const loginBtn = document.getElementById('loginBtn');
    const closeModal = document.getElementById('closeModal');
    if (loginBtn) loginBtn.addEventListener('click', openModalNotice);
    if (closeModal && modal) closeModal.addEventListener('click', () => modal.style.display = 'none');

    const authEmail = document.getElementById('authEmail');
    const authPassword = document.getElementById('authPassword');
    const signInBtn = document.getElementById('signInBtn');
    const signUpBtn = document.getElementById('signUpBtn');
    const authStatusMessage = document.getElementById('authStatusMessage');

    if (signUpBtn) {
        signUpBtn.addEventListener('click', async () => {
            authStatusMessage.style.color = 'orange';
            authStatusMessage.innerText = 'Creating profile...';
            const { error } = await supabaseClient.auth.signUp({ email: authEmail.value, password: authPassword.value });
            if (error) { authStatusMessage.style.color = 'red'; authStatusMessage.innerText = error.message; }
            else { authStatusMessage.style.color = 'green'; authStatusMessage.innerText = 'Account ready! Sign in now.'; }
        });
    }

    if (signInBtn) {
        signInBtn.addEventListener('click', async () => {
            authStatusMessage.style.color = 'orange';
            authStatusMessage.innerText = 'Verifying...';
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email: authEmail.value, password: authPassword.value });
            if (error) { authStatusMessage.style.color = 'red'; authStatusMessage.innerText = error.message; }
            else {
                authStatusMessage.style.color = 'green';
                authStatusMessage.innerText = 'Logged in!';
                if (loginBtn) loginBtn.querySelector('.login-btn-label').textContent = data.user.email.split('@')[0];
                setTimeout(() => { modal.style.display = 'none'; }, 1200);
            }
        });
    }

    if (supabaseClient) {
        supabaseClient.auth.onAuthStateChange((event, session) => {
            const label = document.querySelector('.login-btn-label');
            if (label) label.textContent = session ? session.user.email.split('@')[0] : 'Login / Signup';
        });
    }

    fetchRoomsFromDatabase();
}

document.addEventListener('DOMContentLoaded', setupEventListeners);