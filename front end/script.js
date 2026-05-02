document.addEventListener('DOMContentLoaded', () => {
    // Calls to Flask API
    const apiBase = 'http://localhost:5000';
    const tableBody = document.querySelector('.table-group-divider');

    const addMembermodal = document.getElementById('addMemberModal');
    const editMembermmdal = document.getElementById('editMemberModal');
    const deleteMembermodal = document.getElementById('deleteConfirmationModal');
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
            document.getElementById('editDetails').value = "";
            document.getElementById('editTitle').value = btn.dataset.title;
            document.getElementById('editLevel').value = btn.dataset.level.trim().toLowerCase();

            currentDeleteId = btn.dataset.id;
            editMembermodal.style.display = 'block';
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
        btn.onclick = () => {
            viewEventsModal.style.display = 'block';
        };
    });

    // Function to update number selected for deletion
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

    const singleDeleteBtn = document.querySelector('.delete-member-btn');
    if (singleDeleteBtn) {
        singleDeleteBtn.onclick = () => {
            confirmDeleteBtn.innerText = "Yes, Delete 1 Member";
            deleteMemberModal.style.display = 'block';
        };
    }


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

            window.location.reload();
        };
    }


    // When cancelling a delete, it resets the counter and checkboxes
    const cancelDeleteBtn = document.getElementById('cancelDeleteButton');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.onclick = () => {
            deleteMembermodal.style.display = 'none';
            document.querySelectorAll('.member-checkbox').forEach(cb => cb.checked = false);
            updateDeleteSelected();
        };
    }

    const closeModalBtn = document.getElementById('closeViewEventsBtn');
    if (closeModalBtn) closeModalBtn.onclick = () => viewEventsModal.style.display = 'none';

    const addBtn = document.getElementById('addMemberBtn');
    if (addBtn) addBtn.onclick = () => addMembermodal.style.display = 'block';

    window.onclick = (e) => {
        if (e.target === addMembermodal) addMembermodal.style.display = 'none';
        if (e.target === editMemberModal) editMemberModal.style.display = 'none';
        if (e.target === viewEventsModal) viewEventsModal.style.display = 'none';
        if (e.target === deleteMemberModal) {
            deleteMemberModal.style.display = 'none';
            document.querySelectorAll('.member-checkbox').forEach(cb => cb.checked = false);
            updateDeleteSelected();
        }
    };
});