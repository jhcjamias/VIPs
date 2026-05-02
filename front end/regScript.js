document.addEventListener('DOMContentLoaded', () => {
    // Calls to Flask API
    const apiBase = 'http://localhost:5000';

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
    
});