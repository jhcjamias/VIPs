document.addEventListener('DOMContentLoaded', () => {
    // Calls to Flask API
    const apiBase = 'http://localhost:5000';
    const tableBody = document.querySelector('.table-group-divider');

    const addMemberModal = document.getElementById('addMemberModal');
    const editMemberModal = document.getElementById('editMemberModal');
    const deleteMemberModal = document.getElementById('deleteConfirmationModal');
    const viewEventsModal = document.getElementById('viewEventsModal');
    const memberEventsTableBody = document.getElementById('memberEventsTableBody');

    const tableDeleteBtn = document.getElementById('tableDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteButton');
    const memberCheckboxes = document.querySelectorAll('.member-checkbox');

    let currentDeleteId = null


    // Function for checkboxes for table delete
    document.querySelectorAll('.member-checkbox').forEach(cb => {
        cb.addEventListener('change', updateDeleteSelected);
    });

    // Edit Modal Pop-Up Population
    document.querySelectorAll('.edit-member-btn').forEach(btn => {
        btn.onclick = () => {
            document.getElementById('editMemberId').value = btn.dataset.id;
            document.getElementById('editName').value = btn.dataset.name;
            document.getElementById('editDetails').value = btn.dataset.details || "";
            document.getElementById('editTitle').value = btn.dataset.title;
            document.getElementById('editLevel').value = (btn.dataset.level || "bronze").trim().toLowerCase();

            currentDeleteId = btn.dataset.id;
            editMemberModal.style.display = 'block';
        };
    });


    // Create New Member
    document.getElementById('addMemberForm').onsubmit = async (e) => {
        e.preventDefault();
        const memberInfo = {
            name: document.getElementById('name').value,
            details: document.getElementById('details').value,
            title: document.getElementById('title').value,
            level: document.getElementById('level').value
        };
        await fetch(`${apiBase}/member`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(memberInfo)
        });
        window.location.reload(); // reloads page for server.js fetching current data from API
    };

    // Update Member with Edits
    document.getElementById('editMemberForm').onsubmit = async (e) => {
        e.preventDefault();
        const updateMemberInfo = {
            member_id: document.getElementById('editMemberId').value,
            name: document.getElementById('editName').value,
            details: document.getElementById('editDetails').value,
            title: document.getElementById('editTitle').value,
            level: document.getElementById('editLevel').value,
            date: new Date().toISOString().split('T')[0]
        };
        await fetch(`${apiBase}/member`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateMemberInfo)
        });
        window.location.reload();
    };

    // Function to open View Member's Registered Events Modal
    // memberScript.js - updated event listener logic
    document.querySelectorAll('.view-member-events-btn').forEach(btn => {
        btn.onclick = async () => { 
            const memberId = btn.dataset.id;
            const tableBody = document.getElementById('memberEventsTableBody');

            // Increased colspan to 5 to match new header count
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Loading events...</td></tr>';
            
            viewEventsModal.style.display = 'block';

            try {
                const response = await fetch(`${apiBase}/member/${memberId}/events`);
                const events = await response.json();

                tableBody.innerHTML = ''; 

                if (events.length > 0) {
                    events.forEach(event => {
                        const row = document.createElement('tr');
                        const formattedDate = new Date(event.date).toLocaleDateString('en-US', { timeZone: 'UTC' });

                        // Inserted a 5th <td> with error/trash icon button
                        // 1. Update the row generation inside the view-member-events-btn click handler
                        // Ensure you include event.id in the dataset
                        // Inside the view-member-events-btn.onclick loop:
                        // Safely grab the event ID whether the API calls it 'id' or 'event_id'
                        const safeEventId = event.id || event.event_id || event.eventId;

                        row.innerHTML = `
                            <td>${event.name}</td>
                            <td>${event.capacity}</td>
                            <td style="text-transform: capitalize;">${event.level}</td>
                            <td>${formattedDate}</td>
                            <td>
                                <button type="button" class="btn btn-outline-danger btn-sm unregister-btn" 
                                        data-event-id="${safeEventId}" data-member-id="${memberId}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 640 640" fill="currentColor">
                                        <path d="M232.7 69.9C237.1 56.8 249.3 48 263.1 48L377 48C390.8 48 403 56.8 407.4 69.9L416 96L512 96C529.7 96 544 110.3 544 128C544 145.7 529.7 160 512 160L128 160C110.3 160 96 145.7 96 128C96 110.3 110.3 96 128 96L224 96L232.7 69.9zM128 208L512 208L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 208zM216 272C202.7 272 192 282.7 192 296L192 488C192 501.3 202.7 512 216 512C229.3 512 240 501.3 240 488L240 296C240 282.7 229.3 272 216 272zM320 272C306.7 272 296 282.7 296 296L296 488C296 501.3 306.7 512 320 512C333.3 512 344 501.3 344 488L344 296C344 282.7 333.3 272 320 272zM424 272C410.7 272 400 282.7 400 296L400 488C400 501.3 410.7 512 424 512C437.3 512 448 501.3 448 488L448 296C448 282.7 437.3 272 424 272z"/>
                                    </svg>
                                </button>
                            </td>
                        `;

                        // 2. Add the Click Listener for the unregister button
                        document.getElementById('memberEventsTableBody').addEventListener('click', async (e) => {
                            const btn = e.target.closest('.unregister-btn');
                            if (!btn) return;

                            const { eventId, memberId } = btn.dataset;

                            if (confirm("Are you sure you want to unregister this member from the event?")) {
                                await fetch(`${apiBase}/registration`, {
                                    method: 'DELETE',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ event_id: eventId, member_id: memberId, id: null }) // id included as per your API definition
                                });
                                window.location.reload();
                            }
                        });
                        tableBody.appendChild(row);
                    });
                } else {
                    // Updated colspan to 5
                    tableBody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding: 20px;">This member is not registered for any events.</td></tr>';
                }
                
            } catch (error) { 
                console.error("Error fetching registered events:", error);
                // Updated colspan to 5
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading events.</td></tr>';
            }
        };
    });

    // Function to update number selected for delete confirmation and delete from table
    function updateDeleteSelected() {
        const count = document.querySelectorAll('.member-checkbox:checked').length;

        if(tableDeleteBtn) tableDeleteBtn.style.display = count > 0 ? 'inline-block' : 'none';
        if (confirmDeleteBtn) confirmDeleteBtn.innerText = count > 0 ? `Yes, Delete ${count} Member${count > 1 ? 's' : ''}` : "Yes, Delete";
    }

    if (tableDeleteBtn) {
        tableDeleteBtn.onclick = () => {
            currentDeleteId = null;
            deleteMemberModal.style.display = 'block';
        };
    }  

    // Function for delete confirmation of a single member
    const singleDeleteBtn = document.querySelector('.delete-member-btn');
    if (singleDeleteBtn) {
        singleDeleteBtn.onclick = () => {
            confirmDeleteBtn.innerText = "Yes, Delete This Member";
            deleteMemberModal.style.display = 'block';
        };
    }


    // Function to Delete Members
    if (confirmDeleteBtn) {
        confirmDeleteBtn.onclick = async () => {
            let idsToDelete = [];

            if (currentDeleteId) {
                idsToDelete.push(currentDeleteId);
            } else {
                const checkedBoxes = document.querySelectorAll('.member-checkbox:checked');
                checkedBoxes.forEach(cb => idsToDelete.push(cb.value));
            }

            for (let id of idsToDelete) {
                await fetch(`${apiBase}/member`, {
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
            deleteMemberModal.style.display = 'none';
            document.querySelectorAll('.member-checkbox').forEach(cb => cb.checked = false);
            updateDeleteSelected();
        };
    }

    const closeModalBtn = document.getElementById('closeViewEventsBtn');
    if (closeModalBtn) closeModalBtn.onclick = () => viewEventsModal.style.display = 'none';

    const addBtn = document.getElementById('addMemberBtn');
    if (addBtn) addBtn.onclick = () => addMemberModal.style.display = 'block';

    // Function for cancel buttons (Add Member and Edit Member)
    const cancelAddMemberBtn = document.getElementById('cancelAddMemberBtn');
    if (cancelAddMemberBtn) {
        cancelAddMemberBtn.onclick = () => {
            addMemberModal.style.display = 'none';
            document.getElementById('addMemberForm').reset(); // Clears the form when cancelled
        };
    }

    const cancelEditMemberBtn = document.getElementById('cancelEditMemberBtn');
    if (cancelEditMemberBtn) {
        cancelEditMemberBtn.onclick = () => {
            editMemberModal.style.display = 'none';
        };
    }

    // Use Event Delegation to handle clicks on dynamically created buttons
    // memberScript.js - Update the property names in the click handler
    // Use Event Delegation at the bottom of your DOMContentLoaded
    document.getElementById('memberEventsTableBody').addEventListener('click', async (e) => {
        // Check for our specific button class
        const btn = e.target.closest('.unregister-btn');
        if (!btn) return;

        // Grab the raw strings from the data- attributes
        const rawEventId = btn.dataset.eventId;
        const rawMemberId = btn.dataset.memberId;

        // JavaScript Validation Check BEFORE sending to Python
        if (!rawEventId || rawEventId === 'undefined' || !rawMemberId || rawMemberId === 'undefined') {
            alert("JavaScript Error: Missing event ID or member ID! Check the console.");
            console.error("Missing Data:", { eventId: rawEventId, memberId: rawMemberId });
            return; // Stop the request
        }

        const eventId = parseInt(rawEventId);
        const memberId = parseInt(rawMemberId);

        const payload = { 
            id: null,
            event_id: eventId, 
            member_id: memberId 
        };

        console.log("Sending Valid Payload to Server:", payload);

        if (confirm("Are you sure you want to unregister this member from the event?")) {
            try {
                const response = await fetch(`${apiBase}/registration`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                // Catch the 400 error properly and display it
                if (!response.ok) {
                    alert("Server Error: " + (result.message || response.status));
                    return;
                }

                alert(result.message || "Successfully unregistered.");
                window.location.reload();

            } catch (error) {
                console.error("Error during unregistration:", error);
                alert("Failed to unregister due to a network or code error.");
            }
        }
    });
});