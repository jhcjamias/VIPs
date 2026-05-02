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


    // Function to add listeners to table rows
    document.querySelectorAll('.member-checkbox').forEach(cb => {
        cb.addEventListener('change', updateDeleteSelected);
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

    // Function to update number selected for deletion
    function updateDeleteSelected() {
        const count = document.querySelectorAll('member-checkbox:checked').length;

        if(tableDeleteBtn) tableDeleteBtn.style.display = count > 0 ? 'inline-block' : 'none';
        if (confirmDeleteBtn) confirmDeleteBtn.innerText = count > 0 ? `Yes, Delete ${count} Member${count > 1 ? 's' : ''}` : "Yes, Delete";
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
    document.getElementById('cancelDeleteBtn').onclick = () => {
        deleteMembermodal.style.display = 'none';
        document.querySelectorAll('.member-checkbox').forEach(cb => cb.checked = false);
        updateDeleteSelected();
    };


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

    /**
     * Reusable function to create a searchable dropdown.
     * @param {Object} config
     * @param {string} config.wrapperId      - The ID of the wrapper div (.searchable-dropdown)
     * @param {string} config.inputId        - The ID of the <input> element
     * @param {string} config.menuId         - The ID of the <ul class="dropdown-menu"> element
     * @param {string} config.displayId      - The ID of the element to show selected value
     * @param {Array}  config.data           - Array of option strings (or objects with label/value)
     * @param {string} [config.placeholder]  - Placeholder text
     */
    function initSearchableDropdown({
        wrapperId,
        inputId,
        menuId,
        displayId,
        data,
        placeholder = 'Type to search...'
    }) {
        const wrapper = document.getElementById(wrapperId);
        const input = document.getElementById(inputId);
        const menu = document.getElementById(menuId);
        const displayEl = document.getElementById(displayId);

        let currentIndex = -1; // currently highlighted index (for keyboard nav)
        let selectedValue = null;

        // Set placeholder
        input.placeholder = placeholder;

        // ----- Build dropdown items -----
        function buildItems(filterText = '') {
            menu.innerHTML = '';
            const lowerFilter = filterText.toLowerCase().trim();
            let filtered = [];

            if (typeof data[0] === 'object') {
                // Array of { label, value }
                filtered = data.filter(item =>
                    item.label.toLowerCase().includes(lowerFilter)
                );
            } else {
                // Array of strings
                filtered = data.filter(str =>
                    str.toLowerCase().includes(lowerFilter)
                );
            }

            if (filtered.length === 0) {
                const li = document.createElement('li');
                li.innerHTML =
                    '<span class="dropdown-item no-results">No results found</span>';
                menu.appendChild(li);
                return;
            }

            filtered.forEach((item, idx) => {
                const li = document.createElement('li');
                const label = typeof item === 'object' ? item.label : item;
                const value = typeof item === 'object' ? item.value : item;

                li.innerHTML = `<span class="dropdown-item" data-value="${escapeHTML(value)}" data-label="${escapeHTML(label)}" data-index="${idx}">${escapeHTML(label)}</span>`;
                menu.appendChild(li);

                // Click handler on each item
                li.querySelector('.dropdown-item').addEventListener('click', function(e) {
                    e.stopPropagation();
                    selectItem(value, label);
                });
            });

            // Reset keyboard index
            currentIndex = -1;
            removeHighlight();
        }

        // ----- Select an item -----
        function selectItem(value, label) {
            selectedValue = value;
            input.value = label; // show the label in the input
            displayEl.innerHTML = 'Selected: <strong>' + escapeHTML(label) + '</strong>';
            closeDropdown();
            input.focus();
        }

        // ----- Open dropdown -----
        function openDropdown() {
            menu.classList.add('show');
            wrapper.classList.add('open');
            buildItems(input.value); // rebuild based on current input text
            currentIndex = -1;
            removeHighlight();
        }

        // ----- Close dropdown -----
        function closeDropdown() {
            menu.classList.remove('show');
            wrapper.classList.remove('open');
            currentIndex = -1;
        }

        // ----- Remove all highlights -----
        function removeHighlight() {
            const items = menu.querySelectorAll('.dropdown-item:not(.no-results)');
            items.forEach(item => item.classList.remove('selected'));
        }

        // ----- Highlight item at a given index -----
        function highlightItem(index) {
            const items = menu.querySelectorAll('.dropdown-item:not(.no-results)');
            if (items.length === 0) return;
            removeHighlight();
            if (index < 0) index = 0;
            if (index >= items.length) index = items.length - 1;
            items[index].classList.add('selected');
            // Scroll into view
            items[index].scrollIntoView({ block: 'nearest' });
            currentIndex = index;
        }

        // ----- Keyboard navigation on input -----
        input.addEventListener('keydown', function(e) {
            const isOpen = menu.classList.contains('show');
            const items = menu.querySelectorAll('.dropdown-item:not(.no-results)');

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (!isOpen) {
                        openDropdown();
                    }
                    if (items.length > 0) {
                        currentIndex = (currentIndex + 1) % items.length;
                        highlightItem(currentIndex);
                    }
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    if (!isOpen) {
                        openDropdown();
                    }
                    if (items.length > 0) {
                        currentIndex = (currentIndex - 1 + items.length) % items.length;
                        highlightItem(currentIndex);
                    }
                    break;

                case 'Enter':
                    e.preventDefault();
                    if (isOpen && currentIndex >= 0 && items.length > 0) {
                        const selected = items[currentIndex];
                        const value = selected.getAttribute('data-value');
                        const label = selected.getAttribute('data-label');
                        selectItem(value, label);
                    } else if (isOpen && items.length === 0) {
                        closeDropdown();
                    }
                    break;

                case 'Escape':
                    closeDropdown();
                    input.blur();
                    break;

                case 'Tab':
                    closeDropdown();
                    break;
            }
        });

        // ----- Typing filters the list -----
        input.addEventListener('input', function() {
            if (!menu.classList.contains('show')) {
                openDropdown();
            } else {
                buildItems(input.value);
                currentIndex = -1;
            }
            // If user cleared the input, reset selection
            if (input.value.trim() === '') {
                selectedValue = null;
                displayEl.innerHTML = 'Selected: <strong>None</strong>';
            }
        });

        // ----- Click on input toggles dropdown -----
        input.addEventListener('click', function(e) {
            e.stopPropagation();
            if (menu.classList.contains('show')) {
                closeDropdown();
            } else {
                openDropdown();
            }
        });

        // ----- Click outside closes dropdown -----
        document.addEventListener('click', function(e) {
            if (!wrapper.contains(e.target)) {
                closeDropdown();
            }
        });

        // ----- If user clicks away and input doesn't match selection, revert -----
        input.addEventListener('blur', function() {
            setTimeout(() => {
                if (!wrapper.contains(document.activeElement)) {
                    closeDropdown();
                    if (selectedValue) {
                        let label = selectedValue;
                        if (typeof data[0] === 'object') {
                            const found = data.find(d => d.value === selectedValue);
                            if (found) label = found.label;
                        }
                        input.value = label;
                    }
                }
            }, 150);
        });
    }

    // Simple HTML escape utility
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // ==================== INITIALIZE EXAMPLES ====================

    // --- Example 1: Countries ---
    const countries = [
        'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia',
        'Austria', 'Bangladesh', 'Belgium', 'Brazil', 'Canada',
        'China', 'Colombia', 'Denmark', 'Egypt', 'Finland',
        'France', 'Germany', 'Greece', 'India', 'Indonesia',
        'Ireland', 'Italy', 'Japan', 'Kenya', 'Malaysia',
        'Mexico', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway',
        'Pakistan', 'Philippines', 'Poland', 'Portugal', 'Russia',
        'Singapore', 'South Africa', 'South Korea', 'Spain', 'Sweden',
        'Switzerland', 'Thailand', 'Turkey', 'Ukraine', 'United Kingdom',
        'United States', 'Vietnam'
    ];

    initSearchableDropdown({
        wrapperId: 'searchableDropdown',
        inputId: 'countryDropdown',
        menuId: 'dropdownMenu',
        displayId: 'selectedDisplay',
        data: countries,
        placeholder: 'Type to search countries...'
    });

    // --- Example 2: Fruits (using label/value objects) ---
    const fruits = [
        { label: '🍎 Apple', value: 'apple' },
        { label: '🍌 Banana', value: 'banana' },
        { label: '🍒 Cherry', value: 'cherry' },
        { label: '🍇 Grape', value: 'grape' },
        { label: '🥝 Kiwi', value: 'kiwi' },
        { label: '🍋 Lemon', value: 'lemon' },
        { label: '🥭 Mango', value: 'mango' },
        { label: '🍊 Orange', value: 'orange' },
        { label: '🍑 Peach', value: 'peach' },
        { label: '🍐 Pear', value: 'pear' },
        { label: '🍍 Pineapple', value: 'pineapple' },
        { label: '🍓 Strawberry', value: 'strawberry' },
        { label: '🍉 Watermelon', value: 'watermelon' },
        { label: '🫐 Blueberry', value: 'blueberry' },
    ];

    initSearchableDropdown({
        wrapperId: 'fruitDropdownWrapper',
        inputId: 'fruitDropdown',
        menuId: 'fruitMenu',
        displayId: 'fruitSelectedDisplay',
        data: fruits,
        placeholder: 'Search your favorite fruit...'
    });
    // Runs on startup
    loadMembers();
});