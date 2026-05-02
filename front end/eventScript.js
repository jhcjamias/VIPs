document.addEventListener('DOMContentLoaded', () => {
    // Calls to Flask API
    const apiBase = 'http://localhost:5000';

    const addEventModal = document.getElementById('addEventModal');
    const editEventModal = document.getElementById('editEventModal');
    const deleteEventModal = document.getElementById('deleteConfirmationModal');
    const viewMembersModal = document.getElementById('viewMembersModal');

    const tableDeleteBtn = document.getElementById('tableDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteButton');
    let currentDeleteId = null;

    // Function for checkboxes for table delete
    document.querySelectorAll('.event-checkbox').forEach(cb => {
        cb.addEventListener('change', updateDeleteSelected);
    });

    // Edit Modal Pop-Up Population
    document.querySelectorAll('.edit-event-btn').forEach(btn => {
        btn.onclick = () => {
            document.getElementById('editEventId').value = btn.dataset.id;
            document.getElementById('editName').value = btn.dataset.name;
            document.getElementById('editMaxCapacity').value = btn.dataset.capacity
            document.getElementById('editLevel').value = (btn.dataset.level || "bronze").trim().toLowerCase();
            document.getElementById('editDate').value = btn.dataset.date;

            currentDeleteId = btn.dataset.id;
            editEventModal.style.display = 'block';
        };
    });

    // Create New Event
    document.getElementById('addEventForm').onsubmit = async (e) => {
        e.preventDefault();
        const eventInfo = {
            name: document.getElementById('name').value,
            capacity: document.getElementById('maxCapacity').value, 
            level: document.getElementById('level').value,
            date: document.getElementById('date').value
        };
        
        const response = await fetch(`${apiBase}/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventInfo)
        });
        
        window.location.reload(); 
    };

    // Update Event with Edits
    document.querySelectorAll('.view-event-members-btn').forEach(btn => {
        btn.onclick = async () => {
            const eventId = btn.dataset.id;
            const tableBody = document.getElementById('eventMembersTableBody');
            
            // clears the table (ensures no duplicate members appear) and adds Loading Members when waiting
            tableBody.innerHTML = '<tr><td colspan="3" class="text-center">Loading members...</td></tr>';
            viewMembersModal.style.display = 'block';

            try {
                const response = await fetch(`${apiBase}/event/${eventId}/members`);
                const members = await response.json();

                //  Clears the loading text
                tableBody.innerHTML = ''; 

                if (members.length > 0) {
                    members.forEach(member => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${member.name}</td>
                            <td>${member.title}</td>
                            <td style="text-transform: capitalize;">${member.level}</td>
                        `;
                        tableBody.appendChild(row);
                    });
                } else {
                    tableBody.innerHTML = '<tr><td colspan="3" class="text-center" style="padding: 20px;">No members are currently registered for this event.</td></tr>';
                }
            } catch (error) {
                console.error("Error fetching registered members:", error);
                tableBody.innerHTML = '<tr><td colspan="3" class="text-center text-danger" style="padding: 20px;">Error loading members. Check Python server.</td></tr>';
            }
        };
    });

    // Function to update number selected for delete confirmation and delete from table
    function updateDeleteSelected() {
        const count = document.querySelectorAll('.event-checkbox:checked').length;

        if(tableDeleteBtn) tableDeleteBtn.style.display = count > 0 ? 'inline-block' : 'none';
        if (confirmDeleteBtn) confirmDeleteBtn.innerText = count > 0 ? `Yes, Delete ${count} Event${count > 1 ? 's' : ''}` : "Yes, Delete";
    }

    if (tableDeleteBtn) {
        tableDeleteBtn.onclick = () => {
            currentDeleteId = null;
            deleteEventModal.style.display = 'block';
        };
    }  

    // Function for delete confirmation of a single event
    const singleDeleteBtn = document.querySelector('.delete-event-btn');
    if (singleDeleteBtn) {
        singleDeleteBtn.onclick = () => {
            confirmDeleteBtn.innerText = "Yes, Delete This Event";
            deleteEventModal.style.display = 'block';
        };
    }

    // Function to Delete Events
    if (confirmDeleteBtn) {
        confirmDeleteBtn.onclick = async () => {
            let idsToDelete = [];

            if (currentDeleteId) {
                idsToDelete.push(currentDeleteId);
            } else {
                const checkedBoxes = document.querySelectorAll('.event-checkbox:checked');
                checkedBoxes.forEach(cb => idsToDelete.push(cb.value));
            }

            for (let id of idsToDelete) {
                await fetch(`${apiBase}/event`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({id: id})
                });
            }
            window.location.reload();
        };
    }

    // When cancelling a delete, it resets the counter and checkboxes
    const cancelDeleteBtn = document.getElementById('cancelDeleteButton');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.onclick = () => {
            deleteEventModal.style.display = 'none';
            document.querySelectorAll('.event-checkbox').forEach(cb => cb.checked = false);
            updateDeleteSelected();
        };
    }

    const closeModalBtn = document.getElementById('closeViewEventsBtn');
    if (closeModalBtn) closeModalBtn.onclick = () => viewMembersModal.style.display = 'none';

    const addBtn = document.getElementById('addEventBtn');
    if (addBtn) addBtn.onclick = () => addEventModal.style.display = 'block';

    // Function for cancel buttons (Add Event and Edit Event)
    const cancelAddEventBtn = document.getElementById('cancelAddEventBtn');
    if (cancelAddEventBtn) {
        cancelAddEventBtn.onclick = () => {
            addEventModal.style.display = 'none';
            document.getElementById('addEventForm').reset(); // Clears form when cancelled
        };
    }

    const cancelEditEventBtn = document.getElementById('cancelEditEventBtn');
    if (cancelEditEventBtn) {
        cancelEditEventBtn.onclick = () => {
            editEventModal.style.display = 'none';
        };
    }
});