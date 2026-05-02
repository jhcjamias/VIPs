document.addEventListener('DOMContentLoaded', () => {
    // Calls to Flask API
    const apiBase = 'http://localhost:5000';
    const tableBody = document.querySelector('.table-group-divider');

    const addMembermodal = document.getElementById('addMemberModal');
    const editMembermodal = document.getElementById('editMemberModal');
    const deleteMembermodal = document.getElementById('deleteConfirmationModal');
    const viewEventsModal = document.getElementById('viewEventsModal');
    const memberEventsTableBody = document.getElementById('memberEventsTableBody');

    const tableDeleteBtn = document.getElementById('tableDeleteBtn');
    const memberCheckboxes = document.querySelectorAll('.member-checkbox');

    let currentDeleteId = null


    // Function to get member data and populate member table
    async function loadMembers() {
        try {
            const response = await fetch(`${apiBase}/members`);
            const membersList = await response.json();

            tableBody.innerHTML = '';

            membersList.forEach(memberStr => {
                const [idPart, rest] = memberStr.split(': ');
                const [name, title, level] = rest.split(' | ');

                const row = document.createElement('tr');
                row.innerHTML = `
                    <th scope="row">
                        <input class="form-check-input member-checkbox" type="checkbox" value="${idPart}">
                    </th>
                    <td>${name}</td>
                    <td>${title}</td>
                    <td>${level.charAt(0).toUpperCase() + level.slice(10)}</td>
                    <td>
                        <div class="">
                            <button type="button" class="btn btn-light view-member-events-btn" title="View Registered Events">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calendar-event" viewBox="0 0 16 16">
                                    <path d="<M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z"/>
                                    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
                                </svg>
                            </button>

                            <button type="button" class="btn btn-light edit-member-btn">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            attachRowListeners();
        } catch (error) {
            console.error("API Error: Make sure Flask API is running", error);
        }
    }

    // Function to add listeners to table rows
    function attachRowListeners() {
        document.querySelectorAll('.member-checkbox').forEach(cb => {
            cb.addEventListener('change', updateDeleteCounter);
        });

        // Edit Modal Pop-Up Population
        document.querySelectorAll('.edit-member-btn').forEach(btn => {
            btn.onclick = () => {
                document.getElementById('editMemberId').value = btn.dataset.id;
                document.getElementById('editMemberName').value = btn.dataset.name;
                document.getElementById('editMemberTitle').value = btn.dataset.title;
                document.getElementById('editMemberLevel').value = btn.dataset.level.trim().toLowerCase();

                currentDeleteId = btn.dataset.id;
                editMembermodal.style.display = 'block';
            };
        });

        // View Events Modal Pop-Up
        document.querySelectorAll('.view-member-events-btn').forEach(btn => {
            btn.onclick = () => {
                // add events from /registration here when we get to that functionality
                viewEventsModal.style.display = 'block';
            };
        });
    }

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
        addMembermodal.style.display = 'none';
        document.getElementById('addMemberForm').reset();
        loadMembers(); // to refresh the table
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
        editMembermodal.style.display = 'none';
        loadMembers();
    };

    // Function to update number selected for deletion
    function updateDeleteSelected() {
        const checkedBoxes = document.querySelectorAll('.member-checkbox:checked');
        const count = checkedBoxes.length;

        tableDeleteBtn.style.display = count > 0 ? 'inline-block' : 'none';
        confirmDeleteBtn.innerText = count > 0 ? `Yes, Delete ${count} Member${count > 1 ? 's' : ''}` : "Yes, Delete";
    }

    if (tableDeleteBtn) {
        tableDeleteBtn.onclick = () => {
            currentDeleteId = null;
            deleteMembermodal.style.display = 'block';
        };
    }  

    const singleDeleteBtn = document.querySelector('.delete-member-btn');
    if (singleDeleteBtn) {
        singleDeleteBtn.onclick = () => {
            confirmDeleteBtn.innerText = "Yes, Delete 1 Member";
            deleteMembermodal.style.display = 'block';
        };
    }

    // When cancelling a delete, it resets the counter and checkboxes
    document.getElementById('cancelDeleteBtn').onclick = () => {
        modals.delete.style.display = 'none';
        document.querySelectorAll('.member-checkbox').forEach(cb => cb.checked = false);
        updateDeleteSelected();
    };

    // Delete Members
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

            deleteMembermodal.style.display = 'none';
            editMembermodal.style.display = 'none';
            document.querySelectorAll('.member-checkbox').forEach(cb => cb.checked = false);
            updateDeleteSelected();
            loadMembers();
        };
    }

    const closeModalBtn = document.getElementById('closeViewEventsBtn');
    if (closeModalBtn) closeModalBtn.onclick = () => viewEventsModalstyle.display = 'none';

    const addBtn = document.getElementById('addMemberBtn');
    if (addBtn) addBtn.onclick = () => addMembermodal.style.display = 'block';

    window.onclick = (e) => {
        if (e.target === addMembermodal) addMembermodal.style.display = 'none';
        if (e.target === editMembermodal) editMembermodal.style.display = 'none';
        if (e.target === viewEventsModal) viewEventsModal.style.display = 'none';
        if (e.target === deleteMembermodal) {
            deleteMembermodal.style.display = 'none';
            document.querySelectorAll('.member-checkbox').forEach(cb => cb.checked = false);
            updateDeleteSelected();
        }
    };

    // Runs on startup
    loadMembers();
});