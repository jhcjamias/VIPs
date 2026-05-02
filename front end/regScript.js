document.addEventListener('DOMContentLoaded', () => {
    // Calls to Flask API
    const apiBase = 'http://localhost:5000';

    // REMOVED the require('./server.js') and console.log lines here

    const registrationDataElem = document.getElementById('registration-data');
    let registrationData = { members: [], events: [] };

    if (registrationDataElem && registrationDataElem.textContent.trim().length) {
        try {
            registrationData = JSON.parse(registrationDataElem.textContent);
        } catch (error) {
            console.error('Failed to parse registration data', error);
        }
    }

    const membersData = Array.isArray(registrationData.members) ? registrationData.members : [];
    const eventsData = Array.isArray(registrationData.events) ? registrationData.events : [];

    console.log(membersData);
    console.log(eventsData);

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
            placeholder = 'Type to search...',
            onSelect // <-- ADD THIS NEW PARAMETER
        }) {
            const wrapper = document.getElementById(wrapperId);
            const input = document.getElementById(inputId);
            const menu = document.getElementById(menuId);
            const displayEl = document.getElementById(displayId);

            let currentIndex = -1; 
            let selectedValue = null;

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
            if (!value) return; // Prevent selecting null placeholders
            
            selectedValue = value;
            input.value = label; 
            displayEl.innerHTML = 'Selected: <strong>' + escapeHTML(label) + '</strong>';
            closeDropdown();
            input.focus();
            
            // <-- ADD THIS: Trigger the callback if one was provided
            if (onSelect) {
                onSelect(value, label); 
            }
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

    // 1. Format member options so the label is clean (just the name), 
    // but the value holds the full string (so we can extract the level)
    const memberOptions = membersData.length
        ? membersData.map(item => {
            if (typeof item === 'string' && item.includes(': ')) {
                // item looks like: "1: John Doe | details | Mr | gold"
                const namePart = item.split(': ').slice(1).join(': ');
                const label = namePart.split(' | ')[0]; // Extracts just "John Doe"
                return { label: label, value: item };   // Keep full string in value
            }
            return { label: item, value: item };
        })
        : [{ label: 'No members available', value: null }];

    // 2. Disable event input initially
    const eventInput = document.getElementById('eventDropdown');
    eventInput.disabled = true;
    eventInput.placeholder = "Select a member first...";

    // 3. Initialize Member Dropdown
    initSearchableDropdown({
        wrapperId: 'searchableDropdown',
        inputId: 'memberDropdown',
        menuId: 'memberMenu',
        displayId: 'selectedDisplay',
        data: memberOptions,
        placeholder: 'Search members...',
        
        // This callback runs when a member is selected
        onSelect: (value, label) => {
            // "value" holds the raw string from Flask. Let's split it to get the level at the end.
            const parts = value.split(' | ');
            const memberLevel = parts[parts.length - 1].trim(); 

            console.log(`Member selected. Level parsed as: ${memberLevel}`);

            // Reset and show loading state on the Event dropdown
            eventInput.disabled = false;
            eventInput.value = "";
            eventInput.placeholder = "Loading available events...";
            document.getElementById('eventSelectedDisplay').innerHTML = 'Selected: <strong>None</strong>';

            // Fetch the filtered events from crud.py based on memberLevel
            fetch(`${apiBase}/event/${memberLevel}`)
                .then(response => response.json())
                .then(eventsData => {
                    // Flask returns objects like: { name: '...', attending: ..., level: '...' }
                    const eventOptions = eventsData.length
                        ? eventsData.map(e => ({ label: e.name, value: e.name }))
                        : [];

                    // Initialize the Event Dropdown with the newly fetched data
                    initSearchableDropdown({
                        wrapperId: 'eventDropdownWrapper',
                        inputId: 'eventDropdown',
                        menuId: 'eventMenu',
                        displayId: 'eventSelectedDisplay',
                        data: eventOptions,
                        placeholder: eventOptions.length ? 'Search events...' : 'No events available for this level'
                    });

                    // Disable it again if they are gold and no gold events exist, etc.
                    if (eventOptions.length === 0) {
                        eventInput.disabled = true;
                    }
                })
                .catch(err => {
                    console.error("Error fetching events:", err);
                    eventInput.placeholder = "Error loading events";
                    eventInput.disabled = true;
                });
        }
    });
});