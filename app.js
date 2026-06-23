const supabaseUrl = 'https://xcbklpgkunxvolgfjcto.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjYmtscGdrdW54dm9sZ2ZqY3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNTAxOTQsImV4cCI6MjA5NzcyNjE5NH0.nkVvJUQBtHg5xobypgjMq9Qh6MeZ8ncv8JfB6S4gvgI';
let supabaseClient;

let liveRooms = [];
let gridContainer;
let searchInput;


// ── TICKER / SLIDESHOW ──────────────────────────────────────
const tickerItems = [
    { label: 'CCS-101', sub: 'College of Computer Studies — Main Bldg 1F' },
    { label: 'ENG-205', sub: 'College of Engineering — 2nd Floor' },
    { label: 'Math Departmental Exam', sub: 'MATH-EX1 — Main Hall Room 201' },
    { label: 'MSU Main Library', sub: 'LIB-101 — Library Bldg Ground Floor' },
    { label: 'BUS-102', sub: 'College of Business — Business Wing' },
    { label: 'SCI-301', sub: 'College of Science — Science Lab 3F' },
];

function initTicker() {
    const track = document.getElementById('tickerTrack');
    if (!track) return;

    let current = 0;

    function buildSlide(item, idx) {
        const slide = document.createElement('button');
        slide.className = 'ticker-slide' + (idx === 0 ? ' active' : '');
        slide.dataset.idx = idx;
        slide.innerHTML = `<strong>${item.label}</strong><span>${item.sub}</span>`;
        slide.addEventListener('click', () => filterByTicker(item));
        return slide;
    }

    tickerItems.forEach((item, i) => track.appendChild(buildSlide(item, i)));

    // Dots
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
        const slides = track.querySelectorAll('.ticker-slide');
        const dots = dotsEl ? dotsEl.querySelectorAll('.ticker-dot') : [];
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        slides[idx]?.classList.add('active');
        dots[idx]?.classList.add('active');
        current = idx;
    }

    // Auto-advance every 3s
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
    // Scroll to grid
    document.getElementById('gridContainer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── DATABASE ─────────────────────────────────────────────────
async function fetchRoomsFromDatabase() {
    // Always show fallback first so the page isn't blank
    liveRooms = mockRooms;
    displayRooms(liveRooms);

    if (!supabaseClient) {
        console.warn('Supabase not initialized — showing fallback cards.');
        return;
    }

    try {
        console.log('Fetching rooms from database...');
        const { data, error } = await supabaseClient
            .from('room')
            .select('roomID, roomNumber, description');

        if (error) throw error;

        if (data && data.length > 0) {
            console.log('DB rooms loaded:', data);
            liveRooms = data.map(r => ({
                id: r.roomID,
                code: r.roomNumber,
                direction: r.description || 'No directions written yet.',
                image: null,
                info: 'MSU Campus Room'
            }));
            displayRooms(liveRooms);
        } else {
            console.warn('No DB data — keeping fallback cards.');
        }
    } catch (err) {
        console.error('DB fetch failed:', err.message, '— keeping fallback cards.');
    }
}

// ── RENDER CARDS ─────────────────────────────────────────────
function displayRooms(rooms) {
    gridContainer = gridContainer || document.getElementById('gridContainer');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    if (!rooms.length) {
        gridContainer.innerHTML = '<p class="empty-state">No rooms found.</p>';
        return;
    }

    rooms.forEach(room => {
        const card = document.createElement('div');
        card.className = 'room-card';

        const imageBlock = room.image
            ? `<img src="${room.image}" alt="${room.code}" class="card-cover">`
            : `<div class="card-img-placeholder"><img src="assets/logo.png" alt="" class="card-placeholder-icon"></div>`;

        card.innerHTML = `
            ${imageBlock}
            <div class="card-info">
                <h3>${room.code}</h3>
                <p><strong>Building:</strong> ${room.info}</p>
                <p class="card-dir">${room.direction}</p>
            </div>
        `;
        gridContainer.appendChild(card);
    });
}

// ── AUTH MODAL ───────────────────────────────────────────────
function openModalNotice() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'flex';
}

// ── SIDEBAR TOGGLE (fix: show button even when collapsed) ────
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

    // Init Supabase
    if (typeof window.supabase !== 'undefined') {
        supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    } else {
        console.error('Supabase CDN not loaded.');
    }

    initSidebar();
    initTicker();

    // Search
    if (searchInput) {
        searchInput.addEventListener('input', e => {
            const term = e.target.value.toLowerCase();
            const filtered = liveRooms.filter(r =>
                r.code.toLowerCase().includes(term) ||
                r.direction.toLowerCase().includes(term) ||
                r.info.toLowerCase().includes(term)
            );
            displayRooms(filtered);
        });
    }

    // Modal controls
    const modal = document.getElementById('loginModal');
    const loginBtn = document.getElementById('loginBtn');
    const closeModal = document.getElementById('closeModal');

    if (loginBtn) loginBtn.addEventListener('click', openModalNotice);
    if (closeModal && modal) closeModal.addEventListener('click', () => modal.style.display = 'none');

    // Auth
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
                if (loginBtn) {
                    loginBtn.querySelector('.login-btn-label').textContent = data.user.email.split('@')[0];
                }
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