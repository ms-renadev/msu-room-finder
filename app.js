// Connect to your live Supabase cloud instance
const supabaseUrl = 'https://xcbklpgkunxvolgfjcto.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjYmtscGdrdW54dm9sZ2ZqY3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNTAxOTQsImV4cCI6MjA5NzcyNjE5NH0.nkVvJUQBtHg5xobypgjMq9Qh6MeZ8ncv8JfB6S4gvgI';
let supabaseClient;

// Arrays to handle records dynamically
let liveRooms = [];
let gridContainer;
let searchInput;

// Offline static fallback cards
const mockRooms = [
    { id: 1, code: 'CCS-101', direction: 'Main building 1st floor', info: 'College of Computer Studies', image: null },
    { id: 2, code: 'ENG-205', direction: 'Engineering block 2nd floor', info: 'College of Engineering', image: null },
    { id: 3, code: 'BUS-102', direction: 'Business wing ground floor', info: 'College of Business', image: null },
    { id: 4, code: 'SCI-301', direction: 'Science laboratory 3rd floor', info: 'College of Science', image: null },
];

// Read campus locations securely from the database
async function fetchRoomsFromDatabase() {
    try {
        if (!supabaseClient) return;
        console.log("Connecting to database room list...");
        
        const { data, error } = await supabaseClient
            .from('room')
            .select('roomID, roomNumber, description'); 

        if (error) throw error;

        if (!data || data.length === 0) {
            console.warn("Connected! But no data found. Using fallback cards.");
            liveRooms = mockRooms;
        } else {
            console.log("Database response received successfully:", data);
            liveRooms = data.map(r => ({
                id: r.roomID,
                code: r.roomNumber,
                direction: r.description || 'No instruction manual written yet.',
                image: null, 
                info: 'MSU Campus Room' 
            }));
        }
        displayRooms(liveRooms);
        
    } catch (err) {
        console.error("Database pipeline blocked:", err.message);
        liveRooms = mockRooms;
        displayRooms(liveRooms);
    }
}

// Render components into the application DOM tree frame
function displayRooms(rooms) {
    if (!gridContainer) return;
    gridContainer.innerHTML = '';
    
    rooms.forEach(room => {
        const card = document.createElement('div');
        card.className = 'room-card';
        
        const imageBlock = room.image 
            ? `<img src="${room.image}" alt="${room.code}" style="width:100%; height:150px; object-fit:cover; border-top-left-radius:8px; border-top-right-radius:8px;">`
            : `<div class="card-img-placeholder"><img src="assets/logo.png" alt="" class="card-placeholder-icon"></div>`;

        card.innerHTML = `
            ${imageBlock}
            <div class="card-info">
                <h3>${room.code}</h3>
                <p><strong>Building:</strong> ${room.info}</p>
                <p style="margin-top: 5px;">${room.direction}</p>
            </div>
        `;
        gridContainer.appendChild(card);
    });
}

function openModalNotice() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'flex';
}

function setupEventListeners() {
    searchInput = document.getElementById('searchInput');
    gridContainer = document.getElementById('gridContainer');
    
    // Safety check initialization binding sequence
    if (typeof supabase !== "undefined") {
        supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    } else {
        console.error("Critical failure: Supabase package asset CDN not found.");
    }
    
    // Search indexing events listeners
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = liveRooms.filter(r => 
                r.code.toLowerCase().includes(term) || 
                r.direction.toLowerCase().includes(term) ||
                r.info.toLowerCase().includes(term)
            );
            displayRooms(filtered);
        });
    }

    // Tab navigation event listener handles
    const navItems = document.querySelectorAll('.nav-links li');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            document.querySelector('.nav-links li.active').classList.remove('active');
            item.classList.add('active');

            const category = item.id.replace('nav-', '');
            if (category === 'home') {
                displayRooms(liveRooms);
            } else if (category === 'saved') {
                openModalNotice();
            } else {
                const filtered = liveRooms.filter(r => r.info.toLowerCase().includes(category.toLowerCase()));
                displayRooms(filtered);
            }
        });
    });

    // Modal Control components pointers
    const modal = document.getElementById('loginModal');
    const loginBtn = document.getElementById('loginBtn');
    const closeModal = document.getElementById('closeModal');

    if (loginBtn) loginBtn.addEventListener('click', openModalNotice);
    if (closeModal && modal) closeModal.addEventListener('click', () => modal.style.display = 'none');

    // --- SUPABASE SYSTEM AUTH EVENTS LOGIC ---
    const authEmail = document.getElementById('authEmail');
    const authPassword = document.getElementById('authPassword');
    const signInBtn = document.getElementById('signInBtn');
    const signUpBtn = document.getElementById('signUpBtn');
    const authStatusMessage = document.getElementById('authStatusMessage');

    // Account Sign Up Request Action
    if (signUpBtn) {
        signUpBtn.addEventListener('click', async () => {
            const email = authEmail.value;
            const password = authPassword.value;
            authStatusMessage.style.color = "orange";
            authStatusMessage.innerText = "Creating profile...";

            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
            });

            if (error) {
                authStatusMessage.style.color = "red";
                authStatusMessage.innerText = error.message;
            } else {
                authStatusMessage.style.color = "green";
                authStatusMessage.innerText = "Account ready! Try signing in now. ✨";
            }
        });
    }

    // Session Sign In Authorization Verification
    if (signInBtn) {
        signInBtn.addEventListener('click', async () => {
            const email = authEmail.value;
            const password = authPassword.value;
            authStatusMessage.style.color = "orange";
            authStatusMessage.innerText = "Verifying keys...";

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                authStatusMessage.style.color = "red";
                authStatusMessage.innerText = error.message;
            } else {
                authStatusMessage.style.color = "green";
                authStatusMessage.innerText = "Logged in successfully! 🎉";
                if (loginBtn) loginBtn.innerText = `👤 ${data.user.email.split('@')[0]}`;
                setTimeout(() => { modal.style.display = 'none'; }, 1200);
            }
        });
    }

    // Monitor identity token validation shifts 
    if (supabaseClient) {
        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (session && loginBtn) {
                loginBtn.innerText = `👤 ${session.user.email.split('@')[0]}`;
            } else if (loginBtn) {
                loginBtn.innerText = "👤 Login / Signup";
            }
        });
    }

    // Initialize layout database fetch sequence execution
    fetchRoomsFromDatabase();
}

document.addEventListener('DOMContentLoaded', setupEventListeners);