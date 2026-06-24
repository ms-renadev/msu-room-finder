// colleges.js

document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
    document.getElementById('mainContent').classList.toggle('expanded');
});

let allRooms = [];

function displayRooms(rooms) {
    const grid = document.getElementById('gridContainer');
    grid.innerHTML = '';

    if (!rooms || rooms.length === 0) {
        grid.innerHTML = '<p class="empty-state">No rooms found matching this filter.</p>';
        return;
    }

    rooms.forEach(room => {
        const collegeName = room.college ? room.college.collegeName : 'General';
        const card = document.createElement('div');
        card.className = 'room-card';
        card.innerHTML = `
            <div class="card-img-placeholder">
                ${room.roomImage
                    ? `<img src="${room.roomImage}" style="width:100%;height:100%;object-fit:cover;">`
                    : `<div class="card-placeholder-flower">🌸</div>`}
            </div>
            <button class="card-bookmark" title="Save room">
                <span class="material-symbols-rounded">bookmark</span>
            </button>
            <div class="card-info">
                <span class="card-college-tag">${collegeName}</span>
                <h3>${room.roomNumber}</h3>
                <p class="card-dir">${room.description || 'No directions provided yet.'}</p>
            </div>`;

        card.querySelector('.card-bookmark').addEventListener('click', e => {
            e.stopPropagation();
            const btn = e.currentTarget;
            btn.classList.toggle('saved');
        });

        grid.appendChild(card);
    });
}

function filterRooms(filter) {
    if (filter === 'all') { displayRooms(allRooms); return; }

    const filtered = allRooms.filter(room => {
        const c = room.college?.collegeName?.toLowerCase() || '';
        const n = (room.roomNumber || '').toLowerCase();
        const d = (room.description || '').toLowerCase();

        if (filter === 'cics') return c.includes('cics') || n.includes('multimedia') || n.includes('isd');
        if (filter === 'coe') return c.includes('coe') || c.includes('engineering') || d.includes('engineering');
        if (filter === 'cbaa') return c.includes('cbaa') || d.includes('cbaa') || n.includes('cbaa');
        if (filter === 'cnsm') return c.includes('cnsm') || d.includes('cnsm') || n.includes('cnsm');
        return c.includes(filter) || n.includes(filter) || d.includes(filter);
    });

    displayRooms(filtered);
}

document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        filterRooms(chip.dataset.filter);
    });
});

document.getElementById('searchInput').addEventListener('input', e => {
    const t = e.target.value.toLowerCase();
    const searched = allRooms.filter(room => {
        const c = room.college?.collegeName?.toLowerCase() || '';
        return (room.roomNumber?.toLowerCase().includes(t)) ||
               (room.description?.toLowerCase().includes(t)) ||
               c.includes(t);
    });
    displayRooms(searched);
});

window.addEventListener('load', async () => {
    if (typeof window.supabase !== 'undefined') {
        const client = window.supabase.createClient(
            'https://xcbklpgkunxvolgfjcto.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjYmtscGdrdW54dm9sZ2ZqY3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNTAxOTQsImV4cCI6MjA5NzcyNjE5NH0.nkVvJUQBtHg5xobypgjMq9Qh6MeZ8ncv8JfB6S4gvgI'
        );

        try {
            const { data, error } = await client
                .from('room')
                .select(`roomID, roomNumber, description, roomImage, college ( collegeName )`);

            if (error) {
                console.error('Supabase error:', error.message, '| Code:', error.code);
                const grid = document.getElementById('gridContainer');
                grid.innerHTML = `<div class="db-error-notice">
                    <span class="material-symbols-rounded">warning</span>
                    <p><strong>Cannot load rooms.</strong><br>${error.message}<br><br>
                    Fix: Go to Supabase → Authentication → Policies → room table → Add a SELECT policy for anon role.</p>
                </div>`;
                return;
            }

            if (data && data.length > 0) {
                allRooms = data;
                displayRooms(allRooms);
            } else {
                document.getElementById('gridContainer').innerHTML =
                    '<p class="empty-state">No rooms in the database yet. Add rooms in Supabase → room table.</p>';
            }
        } catch (err) {
            console.error('Fetch error:', err.message);
        }
    }
});