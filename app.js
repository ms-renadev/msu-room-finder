// Data layout containing example room rows
const mockRooms = [
    { id: 1, code: "CNSM Room 102", type: "colleges", direction: "Nasa third floor, kanan pag-akyat ng hagdan.", info: "Natural Sciences" },
    { id: 2, code: "CSSH Hallway Room", type: "colleges", direction: "Ground floor, dulo sa kaliwang wing.", info: "Social Sciences" },
    { id: 3, code: "Gym Annex A", type: "exams", direction: "Pumasok sa likod na pinto ng MSU Gym, katabi ng stage.", info: "Exam Room" },
    { id: 4, code: "CBA Room 201", type: "colleges", direction: "Second floor, katabi ng Dean's Office.", info: "Business Admin" }
];

const gridContainer = document.getElementById('gridContainer');
const searchInput = document.getElementById('searchInput');

// 1. Render data onto the screen
function displayRooms(rooms) {
    gridContainer.innerHTML = '';
    rooms.forEach(room => {
        const card = document.createElement('div');
        card.className = 'room-card';
        card.innerHTML = `
            <div class="card-img-placeholder">
                <span class="card-flower-icon">🌸</span>
            </div>
            <div class="card-info">
                <h3>${room.code}</h3>
                <p><strong>Building:</strong> ${room.info}</p>
                <p style="margin-top: 5px;">${room.direction}</p>
            </div>
        `;
        gridContainer.appendChild(card);
    });
}

// 2. Real-time Search Box Logic
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = mockRooms.filter(r => r.code.toLowerCase().includes(term) || r.direction.toLowerCase().includes(term));
    displayRooms(filtered);
});

// 3. Sidebar Filtering Tabs Logic
const navItems = document.querySelectorAll('.nav-links li');
navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Handle UI active status styling switches
        document.querySelector('.nav-links li.active').classList.remove('active');
        item.classList.add('active');

        const category = item.id.replace('nav-', '');
        if (category === 'home') {
            displayRooms(mockRooms);
        } else if (category === 'saved') {
            openModalNotice();
        } else {
            const filtered = mockRooms.filter(r => r.type === category);
            displayRooms(filtered);
        }
    });
});

// 4. Modal Handlers
const modal = document.getElementById('loginModal');
document.getElementById('loginBtn').addEventListener('click', openModalNotice);
document.getElementById('closeModal').addEventListener('click', () => modal.style.display = 'none');

function openModalNotice() {
    modal.style.display = 'flex';
}

// Initial build render
displayRooms(mockRooms);