// file to add all script functionalities for the front end of the website

// Function to handle Members modal displays
document.addEventListener('DOMContentLoaded', () => {
    const addMembermodal = document.getElementById('addMemberModal');
    const editMembermodal = document.getElementById('editMemberModal');
    const deleteMembermodal = document.getElementById('deleteConfirmationModal');

    const tableDeleteBtn = document.getElementById('tableDeleteBtn');
    const memberCheckboxes = document.querySelectorAll('.member-checkbox');

    // Function to clear modal form after closing it out
    function modalClear(modalId, formId) {
        const modal = document.getElementById(modalId);
        const form = document.getElementById(formId);
        // If there is no modal display, the form will reset and clear all fields
        if (modal) modal.style.display = 'none';
        if (form) form.reset()
    }
    
    // Function to open the Add Member modal
    const addMemberBtn = document.getElementById('addMemberBtn');
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', () => {
            addMembermodal.style.display = 'block';
        });
    }

    // Function to open the Edit Member modal (when pencil icon is clicked)
    const editButtons = document.querySelectorAll('.edit-member-btn');
    if (editButtons) {
        editButtons.forEach(button => {
            button.addEventListener('click', () => {
                editMembermodal.style.display = 'block';
            });
        });
    }

    // Function for Delete Member Confirmation modal
    const deleteButtons = document.querySelectorAll('.delete-member-btn');
    if (deleteButtons) {
        deleteButtons.forEach(button => {
            button.addEventListener('click', () => {
                deleteMembermodal.style.display = 'block';
            });
        });
    }

    // Close Delete Member Confirmation modal when "Cancel" button is clicked
    const cancelDeleteBtn = document.getElementById('cancelDeleteButton');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteMembermodal.style.display = 'none';
        });
    }

    // Function to handle checkbox selection and show/hide the table delete button
    memberCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // Checks if any checkbox is selected
            const anyChecked = Array.from(memberCheckboxes).some(cb => cb.checked);
            // Shows or hides the table delete button based on checkbox selection
            tableDeleteBtn.style.display = anyChecked ? 'inline-block' : 'none';
        });
    });

    // Function to handle bulk delete action when the table delete button is clicked
    tableDeleteBtn.addEventListener('click', () => {
        const selectedCount = Array.from(memberCheckboxes).filter(cb => cb.checked).length;
        deleteConfirmationModal.style.display = 'block';
        const confirmDeleteBtn = document.getElementById('confirmDeleteButton');
        confirmDeleteBtn.textContent = `Delete ${selectedCount} selected member(s)`;
    });
    

    // Close modals when clicking outside of them
    window.addEventListener('click', (event) => {
        if (event.target === addMembermodal) {
            modalClear('addMemberModal', 'addMemberForm');
        } else if (event.target === editMembermodal) {
            editMembermodal.style.display = 'none';
        } else if (event.target === deleteMembermodal) {
            deleteMembermodal.style.display = 'none';
        }
    });
});