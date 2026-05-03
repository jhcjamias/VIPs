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
    // eventScript.js - Updated view members logic
    document.querySelectorAll('.view-event-members-btn').forEach(btn => {
        btn.onclick = async () => {
            const eventId = btn.dataset.id;
            const tableBody = document.getElementById('eventMembersTableBody');
            
            // Updated colspan to 4
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading members...</td></tr>';
            viewMembersModal.style.display = 'block';

            try {
                const response = await fetch(`${apiBase}/event/${eventId}/members`);
                const members = await response.json();

                tableBody.innerHTML = ''; 

                if (members.length > 0) {
                    members.forEach(member => {
                        const row = document.createElement('tr');
                        // Inserted a 4th <td> with the requested error/trash icon button
                        row.innerHTML = `
                            <td>${member.name}</td>
                            <td>${member.title}</td>
                            <td style="text-transform: capitalize;">${member.level}</td>
                            <td>
                                <button type="button" class="btn btn-outline-danger btn-sm remove-member-btn" 
                                        data-member-id="${member.id}" data-event-id="${eventId}" title="Remove Member">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 640 640" fill="currentColor">
                                        <path d="M232.7 69.9C237.1 56.8 249.3 48 263.1 48L377 48C390.8 48 403 56.8 407.4 69.9L416 96L512 96C529.7 96 544 110.3 544 128C544 145.7 529.7 160 512 160L128 160C110.3 160 96 145.7 96 128C96 110.3 110.3 96 128 96L224 96L232.7 69.9zM128 208L512 208L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 208zM216 272C202.7 272 192 282.7 192 296L192 488C192 501.3 202.7 512 216 512C229.3 512 240 501.3 240 488L240 296C240 282.7 229.3 272 216 272zM320 272C306.7 272 296 282.7 296 296L296 488C296 501.3 306.7 512 320 512C333.3 512 344 501.3 344 488L344 296C344 282.7 333.3 272 320 272zM424 272C410.7 272 400 282.7 400 296L400 488C400 501.3 410.7 512 424 512C437.3 512 448 501.3 448 488L448 296C448 282.7 437.3 272 424 272z"/>
                                    </svg>
                                </button>
                            </td>
                        `;
                        tableBody.appendChild(row);
                    });
                } else {
                    // Updated colspan to 4
                    tableBody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 20px;">No members are currently registered for this event.</td></tr>';
                }
            } catch (error) {
                console.error("Error fetching registered members:", error);
                // Updated colspan to 4
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger" style="padding: 20px;">Error loading members. Check Python server.</td></tr>';
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

    // Function to unregister member from event
    document.getElementById('eventMembersTableBody').addEventListener('click', async (e) => {
        // Look for the specific trash can button you created
        const btn = e.target.closest('.remove-member-btn');
        if (!btn) return;

        // grabs the IDs of event and member from Flask API
        const eventId = parseInt(btn.dataset.eventId);
        const memberId = parseInt(btn.dataset.memberId);

        if (confirm("Are you sure you want to unregister this member from the event?")) {
            try {
                const response = await fetch(`${apiBase}/registration`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        event_id: eventId, 
                        member_id: memberId, 
                        id: null 
                    })
                });

                const result = await response.json();
                
                if (!response.ok) {
                    alert("Server Error: " + (result.message || response.status));
                    return;
                }

                window.location.reload();

            } catch (error) {
                console.error("Error during unregistration:", error);
                alert("Failed to unregister due to a network or code error.");
            }
        }
    });
});