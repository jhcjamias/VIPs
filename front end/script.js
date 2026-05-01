// file to add all script functionalities for the front end of the website

// Function to handle Members modal displays
document.addEventListener('DOMContentLoaded', () => {
    const addMembermodal = document.getElementById('addMemberModal');
    const editMembermodal = document.getElementById('editMemberModal');
    const deleteMembermodal = document.getElementById('deleteMemberModal');

    // Function to open the Add Member modal


    // Function to open the Edit Member modal (when pencil icon is clicked)
    const editButtons = document.querySelectorAll('.edit-member-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            editMembermodal.style.display = 'block';
        });
    });

    // Function for Delete Member Confirmation modal
    const deleteButtons = document.querySelectorAll('.delete-member-btn');
    if (deleteButtons) {
        deleteButtons.addEventListener('click', () => {
            deleteMembermodal.style.display = 'block';
        });
    }

    // Close Delete Member Confirmation modal when "Cancel" button is clicked
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        deleteMembermodal.style.display = 'none';
    });

    // Close modals when clicking outside of them
    window.addEventListener('click', (event) => {
        if (event.target === addMembermodal) {
            addMembermodal.style.display = 'none';
        } else if (event.target === editMembermodal) {
            editMembermodal.style.display = 'none';
        } else if (event.target === deleteMembermodal) {
            deleteMembermodal.style.display = 'none';
        }
    });
});