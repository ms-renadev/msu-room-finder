// colleges.js

// Toggle Sidebar Layout
document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
    document.getElementById('mainContent').classList.toggle('expanded');
});

let allRooms = [];

// Dynamic renderer para sa mga live na kwarto mula sa Supabase
function displayRooms(rooms) {
    const grid = document.getElementById('gridContainer');
    grid.innerHTML = '';
    
    if (!rooms || rooms.length === 0) { 
        grid.innerHTML = '<p class="empty-state">No live rooms found matching this section.</p>'; 
        return; 
    }
    
    rooms.forEach(room => {
        // Kuhanin ang abbreviation ng college mula sa joined relation query
        const collegeName = room.college ? room.college.collegeName : 'General Venue';
        
        const card = document.createElement('div');
        card.className = 'room-card';
        card.innerHTML = `
            <div class="card-img-placeholder">
                <img src="${room.roomImage || 'assets/logo.png'}" alt="" class="card-placeholder-icon" style="width:50px; opacity:0.3; padding-top: 50px;">
            </div>
            <div class="card-info">
                <h3>Room ${room.roomNumber}</h3>
                <p style="font-size: 13px; font-weight:700; color: var(--msu-maroon); margin-bottom: 4px; text-transform: uppercase;">${collegeName}</p>
                <p class="card-dir">${room.description || 'No instruction description provided.'}</p>
            </div>`;
        grid.appendChild(card);
    });
}

// DIRECT ABBREVIATION FILTER: Eksaktong itutugma ang data-filter chip sa nakasulat sa DB
function filterRooms(filter) {
    if (filter === 'all') { 
        displayRooms(allRooms); 
        return; 
    }

    const filtered = allRooms.filter(room => {
        const collegeText = room.college && room.college.collegeName ? room.college.collegeName.toLowerCase() : '';
        const roomNum = (room.roomNumber || '').toLowerCase();
        const desc = (room.description || '').toLowerCase();
        
        // Gagana ito kahit 'ccs' o 'cics', 'cbaa' o 'cba' ang i-click mo basta kasama sa string
        if (filter === 'cics') {
            return collegeText.includes('CICS') || collegeText.includes('cics') || desc.includes('IT') || roomNum.includes('Multimedia Room') || roomNum.includes('ISD');
        }
        if (filter === 'coe') {
            return collegeText.includes('COE') || collegeText.includes('engineering') || desc.includes('engineering') || roomNum.includes('room 102');
        }
        if (filter === 'cbaa') {
            return collegeText.includes('cbaa') || desc.includes('cbaa') || roomNum.includes('cbaa');
        }
        if (filter === 'cnsm') {
            return collegeText.includes('cnsm') || desc.includes('cnsm') || roomNum.includes('cnsm');
        }

        return collegeText.includes(filter) || roomNum.includes(filter) || desc.includes(filter);
    });

    displayRooms(filtered);
}

// Chips Click Event Listener
document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active'); // Fixed classList placeholder typo
        filterRooms(chip.dataset.filter);
    });
});

// Real-time Search Box Input Listener
document.getElementById('searchInput').addEventListener('input', e => {
    const t = e.target.value.toLowerCase();
    const searched = allRooms.filter(room => {
        const collegeText = room.college && room.college.collegeName ? room.college.collegeName.toLowerCase() : '';
        return (room.roomNumber && room.roomNumber.toLowerCase().includes(t)) || 
               (room.description && room.description.toLowerCase().includes(t)) ||
               collegeText.includes(t);
    });
    displayRooms(searched);
});

// Relational Supabase Fetching Block (Foreign Key Join Sync)
window.addEventListener('load', async () => {
    if (typeof window.supabase !== 'undefined') {
        const client = window.supabase.createClient(
            'https://xcbklpgkunxvolgfjcto.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjYmtscGdrdW54dm9sZ2ZqY3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNTAxOTQsImV4cCI6MjA5NzcyNjE5NH0.nkVvJUQBtHg5xobypgjMq9Qh6MeZ8ncv8JfB6S4gvgI'
        );
        
        try {
            // Kunin ang kwarto kasama ang table join para sa collegeName
            const { data, error } = await client
                .from('room')
                .select(`
                    roomID, 
                    roomNumber, 
                    description, 
                    roomImage,
                    college ( collegeName )
                `);
                
            if (error) throw error;
            
            if (data) {
                allRooms = data;
                displayRooms(allRooms); // Sapul lahat ng rooms agad pagka-refresh!
            }
        } catch (err) {
            console.error("Relational Database Query Failed:", err.message);
        }
    }
});