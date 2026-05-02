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
    document.querySelectorAll('.view-member-events-btn').forEach(btn => {
        btn.onclick = async () => { 
            const memberId = btn.dataset.id;
            const tableBody = document.getElementById('memberEventsTableBody');

            // clears the table (ensures no duplicate events appear) and adds Loading Events when waiting
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading events...</td></tr>';
            
            viewEventsModal.style.display = 'block';

            try {
                const response = await fetch(`${apiBase}/member/${memberId}/events`);
                const events = await response.json();

                // Clears the loading text
                tableBody.innerHTML = ''; 

                if (events.length > 0) {
                    events.forEach(event => {
                        const row = document.createElement('tr');
                        const formattedDate = new Date(event.date).toLocaleDateString('en-US', { timeZone: 'UTC' });

                        row.innerHTML = `
                            <td>${event.name}</td>
                            <td>${event.capacity}</td>
                            <td style="text-transform: capitalize;">${event.level}</td>
                            <td>${formattedDate}</td>
                        `;
                        tableBody.appendChild(row);
                    });
                } else {
                    // Displayed if the member has 0 events
                    tableBody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 20px;">This member is not registered for any events.</td></tr>';
                }
                
            } catch (error) { 
                console.error("Error fetching registered events:", error);
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading events.</td></tr>';
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
});