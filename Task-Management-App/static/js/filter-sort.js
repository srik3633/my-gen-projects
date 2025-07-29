// Filter and Sort functionality for Flask Todo App

$(document).ready(function() {
    console.log('Filter and Sort functionality initialized');
    
    // Initialize filtering and sorting
    initializeFilterSort();
});

// Global variables for filter and sort state
let currentFilters = {
    search: '',
    priority: '',
    status: '',
    assignee: '',
    category: '',
    tags: ''
};

let currentSort = {
    column: '',
    direction: 'asc'
};

// allTasks is declared in app_optimized.js - use that global variable
let filteredTasks = []; // Store filtered tasks
let savedPresets = JSON.parse(localStorage.getItem('filterPresets') || '[]');

function initializeFilterSort() {
    // Set up event listeners
    setupFilterEventListeners();
    setupSortEventListeners();
    setupPresetEventListeners();
    
    // Load saved filter state
    loadFilterState();
    
    // Load saved presets
    loadFilterPresets();
    
    console.log('Filter and sort initialization complete');
}

function setupFilterEventListeners() {
    // Search input with debouncing
    let searchTimeout;
    $('#search-input').on('input', function() {
        clearTimeout(searchTimeout);
        const searchValue = $(this).val().trim();
        
        searchTimeout = setTimeout(() => {
            currentFilters.search = searchValue;
            applyFilters();
            saveFilterState();
            updateFilterIndicators();
        }, 300);
    });
    
    // Clear search button
    $('#clear-search-btn').on('click', function() {
        $('#search-input').val('');
        currentFilters.search = '';
        applyFilters();
        saveFilterState();
        updateFilterIndicators();
    });
    
    // Filter dropdowns
    $('#priority-filter').on('change', function() {
        currentFilters.priority = $(this).val();
        applyFilters();
        saveFilterState();
        updateFilterIndicators();
    });
    
    $('#status-filter').on('change', function() {
        currentFilters.status = $(this).val();
        applyFilters();
        saveFilterState();
        updateFilterIndicators();
    });
    
    $('#assignee-filter').on('change', function() {
        currentFilters.assignee = $(this).val();
        applyFilters();
        saveFilterState();
        updateFilterIndicators();
    });
    
    // Category filter
    $('#category-filter').on('change', function() {
        currentFilters.category = $(this).val();
        applyFilters();
        saveFilterState();
        updateFilterIndicators();
    });
    
    // Tags filter
    $('#tags-filter').on('change', function() {
        currentFilters.tags = $(this).val();
        applyFilters();
        saveFilterState();
        updateFilterIndicators();
    });
    
    // Clear all filters button
    $('#clear-filters-btn').on('click', function() {
        clearAllFilters();
    });
}

function setupSortEventListeners() {
    // Make table headers sortable
    $('.sortable').on('click', function() {
        const column = $(this).data('sort');
        
        // Toggle sort direction if same column, otherwise set to ascending
        if (currentSort.column === column) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.column = column;
            currentSort.direction = 'asc';
        }
        
        // Update visual indicators
        updateSortIndicators();
        
        // Apply sort
        applySorting();
        
        // Save sort state
        saveSortState();
    });
}

function setupPresetEventListeners() {
    // Preset dropdown items
    $('#filter-presets-menu').on('click', 'a[data-preset]', function(e) {
        e.preventDefault();
        const presetName = $(this).data('preset');
        applyBuiltInPreset(presetName);
    });
    
    // Custom preset items (will be added dynamically)
    $('#filter-presets-menu').on('click', 'a[data-custom-preset]', function(e) {
        e.preventDefault();
        const presetId = $(this).data('custom-preset');
        applyCustomPreset(presetId);
    });
    
    // Save current filter
    $('#save-current-filter').on('click', function(e) {
        e.preventDefault();
        showSaveFilterModal();
    });
    
    // Manage presets
    $('#manage-presets').on('click', function(e) {
        e.preventDefault();
        showManagePresetsModal();
    });
    
    // Save preset button
    $('#savePresetBtn').on('click', function() {
        saveCurrentFilterAsPreset();
    });
}

function applyFilters() {
    if (!allTasks || allTasks.length === 0) {
        return;
    }
    
    // Start with all tasks
    filteredTasks = [...allTasks];
    
    // Apply search filter
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filteredTasks = filteredTasks.filter(task => {
            return (
                (task.task && task.task.toLowerCase().includes(searchTerm)) ||
                (task.description && task.description.toLowerCase().includes(searchTerm)) ||
                (task.assignee && task.assignee.toLowerCase().includes(searchTerm)) ||
                (task.priority && task.priority.toLowerCase().includes(searchTerm)) ||
                (task.status && task.status.toLowerCase().includes(searchTerm)) ||
                (task.category && task.category.toLowerCase().includes(searchTerm)) ||
                (task.tags && task.tags.toLowerCase().includes(searchTerm))
            );
        });
    }
    
    // Apply priority filter
    if (currentFilters.priority) {
        filteredTasks = filteredTasks.filter(task => task.priority === currentFilters.priority);
    }
    
    // Apply status filter
    if (currentFilters.status) {
        filteredTasks = filteredTasks.filter(task => task.status === currentFilters.status);
    }
    
    // Apply assignee filter
    if (currentFilters.assignee) {
        if (currentFilters.assignee === 'unassigned') {
            filteredTasks = filteredTasks.filter(task => !task.assignee || task.assignee.trim() === '');
        } else {
            filteredTasks = filteredTasks.filter(task => task.assignee === currentFilters.assignee);
        }
    }
    
    // Apply category filter
    if (currentFilters.category) {
        if (currentFilters.category === 'uncategorized') {
            filteredTasks = filteredTasks.filter(task => !task.category || task.category.trim() === '');
        } else {
            filteredTasks = filteredTasks.filter(task => task.category === currentFilters.category);
        }
    }
    
    // Apply tags filter
    if (currentFilters.tags) {
        filteredTasks = filteredTasks.filter(task => {
            if (!task.tags || task.tags.trim() === '') {
                return false;
            }
            const taskTags = task.tags.split(',').map(tag => tag.trim().toLowerCase());
            return taskTags.includes(currentFilters.tags.toLowerCase());
        });
    }
    
    // Apply current sorting
    if (currentSort.column) {
        applySortingToTasks(filteredTasks);
    }
    
    // Update display
    displayFilteredTasks();
    
    console.log(`Filtered ${filteredTasks.length} tasks from ${allTasks.length} total`);
}

function applySorting() {
    if (currentSort.column && filteredTasks.length > 0) {
        applySortingToTasks(filteredTasks);
        displayFilteredTasks();
    }
}

function applySortingToTasks(tasks) {
    const column = currentSort.column;
    const direction = currentSort.direction;
    
    tasks.sort((a, b) => {
        let aVal = a[column] || '';
        let bVal = b[column] || '';
        
        // Handle different data types
        if (column.includes('date')) {
            // Date sorting
            aVal = aVal ? new Date(aVal) : new Date(0);
            bVal = bVal ? new Date(bVal) : new Date(0);
        } else if (column === 'priority') {
            // Priority sorting (Critical > High > Medium > Low)
            const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
            aVal = priorityOrder[aVal] || 0;
            bVal = priorityOrder[bVal] || 0;
        } else if (column === 'status') {
            // Status sorting (custom order)
            const statusOrder = { 'Not Started': 1, 'In Progress': 2, 'On Hold': 3, 'Completed': 4 };
            aVal = statusOrder[aVal] || 0;
            bVal = statusOrder[bVal] || 0;
        } else {
            // String sorting (case insensitive)
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();
        }
        
        let result = 0;
        if (aVal < bVal) result = -1;
        else if (aVal > bVal) result = 1;
        
        return direction === 'desc' ? -result : result;
    });
}

function displayFilteredTasks() {
    const tableBody = $('#task-table-body');
    const emptyState = $('#empty-state');
    const tableWrapper = $('#task-table-wrapper');
    
    // Clear existing content
    tableBody.empty();
    
    if (filteredTasks.length === 0) {
        // Show no results message
        if (hasActiveFilters()) {
            tableBody.html(`
                <tr>
                    <td colspan="9" class="no-results-message">
                        <i class="fas fa-search"></i>
                        <div>No tasks match your current filters</div>
                        <button class="btn btn-sm btn-outline-primary mt-2" onclick="clearAllFilters()">
                            Clear Filters
                        </button>
                    </td>
                </tr>
            `);
            tableWrapper.show();
            emptyState.hide();
        } else {
            // Show empty state if no tasks at all
            emptyState.show();
            tableWrapper.hide();
        }
    } else {
        // Show filtered tasks
        emptyState.hide();
        tableWrapper.show();
        
        filteredTasks.forEach(function(task) {
            const row = createTaskRow(task);
            tableBody.append(row);
        });
    }
    
    // Update result count (you might want to add this to the UI)
    updateResultCount();
}

function updateResultCount() {
    // Add a result count indicator if it doesn't exist
    let countElement = $('#result-count');
    if (countElement.length === 0) {
        $('.card-header .filter-controls').after(`
            <div class="mt-2">
                <small id="result-count" class="text-muted"></small>
            </div>
        `);
        countElement = $('#result-count');
    }
    
    if (hasActiveFilters()) {
        countElement.text(`Showing ${filteredTasks.length} of ${allTasks.length} tasks`);
        countElement.show();
    } else {
        countElement.hide();
    }
}

function updateSortIndicators() {
    // Remove all sort classes
    $('.sortable').removeClass('sort-asc sort-desc sorting');
    
    // Add current sort class
    if (currentSort.column) {
        const header = $(`.sortable[data-sort="${currentSort.column}"]`);
        header.addClass(`sort-${currentSort.direction}`);
        
        // Add temporary sorting animation
        header.addClass('sorting');
        setTimeout(() => {
            header.removeClass('sorting');
        }, 300);
    }
}

function updateFilterIndicators() {
    // Update search input
    $('#search-input').toggleClass('has-filter', !!currentFilters.search);
    
    // Update filter dropdowns
    $('#priority-filter').toggleClass('has-filter', !!currentFilters.priority);
    $('#status-filter').toggleClass('has-filter', !!currentFilters.status);
    $('#assignee-filter').toggleClass('has-filter', !!currentFilters.assignee);
    $('#category-filter').toggleClass('has-filter', !!currentFilters.category);
    $('#tags-filter').toggleClass('has-filter', !!currentFilters.tags);
    
    // Update clear filters button state
    $('#clear-filters-btn').prop('disabled', !hasActiveFilters());
}

function hasActiveFilters() {
    return !!(currentFilters.search || currentFilters.priority || currentFilters.status || 
              currentFilters.assignee || currentFilters.category || currentFilters.tags);
}

function clearAllFilters() {
    // Reset all filter values
    currentFilters = {
        search: '',
        priority: '',
        status: '',
        assignee: '',
        category: '',
        tags: ''
    };
    
    // Update UI
    $('#search-input').val('');
    $('#priority-filter').val('');
    $('#status-filter').val('');
    $('#assignee-filter').val('');
    $('#category-filter').val('');
    $('#tags-filter').val('');
    
    // Apply filters and update indicators
    applyFilters();
    saveFilterState();
    updateFilterIndicators();
    
    showInfo('All filters cleared');
}

function populateAssigneeFilter() {
    const assigneeFilter = $('#assignee-filter');
    const currentValue = assigneeFilter.val();
    
    // Get unique assignees from all tasks
    const assignees = [...new Set(allTasks
        .map(task => task.assignee)
        .filter(assignee => assignee && assignee.trim() !== '')
    )].sort();
    
    // Clear existing options (except "All Assignees")
    assigneeFilter.find('option:not(:first)').remove();
    
    // Add "Unassigned" option
    assigneeFilter.append('<option value="unassigned">Unassigned</option>');
    
    // Add unique assignees
    assignees.forEach(assignee => {
        assigneeFilter.append(`<option value="${assignee}">${assignee}</option>`);
    });
    
    // Restore previous value if it still exists
    if (currentValue && assigneeFilter.find(`option[value="${currentValue}"]`).length > 0) {
        assigneeFilter.val(currentValue);
    }
}

function populateCategoryFilter() {
    const categoryFilter = $('#category-filter');
    const currentValue = categoryFilter.val();
    
    // Get unique categories from all tasks
    const categories = [...new Set(allTasks
        .map(task => task.category)
        .filter(category => category && category.trim() !== '')
    )].sort();
    
    // Clear existing options (except "All Categories")
    categoryFilter.find('option:not(:first)').remove();
    
    // Add "Uncategorized" option
    categoryFilter.append('<option value="uncategorized">Uncategorized</option>');
    
    // Add unique categories
    categories.forEach(category => {
        categoryFilter.append(`<option value="${category}">${category}</option>`);
    });
    
    // Restore previous value if it still exists
    if (currentValue && categoryFilter.find(`option[value="${currentValue}"]`).length > 0) {
        categoryFilter.val(currentValue);
    }
}

function populateTagsFilter() {
    const tagsFilter = $('#tags-filter');
    const currentValue = tagsFilter.val();
    
    // Get unique tags from all tasks
    const allTagsSet = new Set();
    allTasks.forEach(task => {
        if (task.tags && task.tags.trim() !== '') {
            const taskTags = task.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            taskTags.forEach(tag => allTagsSet.add(tag));
        }
    });
    
    const tags = [...allTagsSet].sort();
    
    // Clear existing options (except "All Tags")
    tagsFilter.find('option:not(:first)').remove();
    
    // Add unique tags
    tags.forEach(tag => {
        tagsFilter.append(`<option value="${tag}">${tag}</option>`);
    });
    
    // Restore previous value if it still exists
    if (currentValue && tagsFilter.find(`option[value="${currentValue}"]`).length > 0) {
        tagsFilter.val(currentValue);
    }
}

// Built-in filter presets
function applyBuiltInPreset(presetName) {
    clearAllFilters();
    
    switch (presetName) {
        case 'high-priority':
            currentFilters.priority = 'High';
            $('#priority-filter').val('High');
            break;
            
        case 'in-progress':
            currentFilters.status = 'In Progress';
            $('#status-filter').val('In Progress');
            break;
            
        case 'completed-today':
            // This would need more complex logic to filter by today's date
            currentFilters.status = 'Completed';
            $('#status-filter').val('Completed');
            break;
            
        case 'overdue':
            // This would need logic to check if opened_date is past and status is not completed
            currentFilters.status = 'In Progress';
            $('#status-filter').val('In Progress');
            break;
    }
    
    applyFilters();
    saveFilterState();
    updateFilterIndicators();
    
    showInfo(`Applied preset: ${presetName.replace('-', ' ')}`);
}

function applyCustomPreset(presetId) {
    const preset = savedPresets.find(p => p.id === presetId);
    if (!preset) {
        showError('Preset not found');
        return;
    }
    
    // Apply preset filters
    currentFilters = { ...preset.filters };
    
    // Update UI
    $('#search-input').val(currentFilters.search || '');
    $('#priority-filter').val(currentFilters.priority || '');
    $('#status-filter').val(currentFilters.status || '');
    $('#assignee-filter').val(currentFilters.assignee || '');
    
    // Apply filters
    applyFilters();
    saveFilterState();
    updateFilterIndicators();
    
    showInfo(`Applied preset: ${preset.name}`);
}

function showSaveFilterModal() {
    if (!hasActiveFilters()) {
        showWarning('No active filters to save');
        return;
    }
    
    // Update filter summary
    updateFilterSummary();
    
    // Clear form
    $('#presetName').val('');
    $('#presetDescription').val('');
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('saveFilterModal'));
    modal.show();
}

function updateFilterSummary() {
    const summary = $('#current-filter-summary');
    summary.empty();
    
    if (currentFilters.search) {
        summary.append(`<span class="filter-tag"><span class="filter-label">Search:</span><span class="filter-value">"${currentFilters.search}"</span></span>`);
    }
    
    if (currentFilters.priority) {
        summary.append(`<span class="filter-tag"><span class="filter-label">Priority:</span><span class="filter-value">${currentFilters.priority}</span></span>`);
    }
    
    if (currentFilters.status) {
        summary.append(`<span class="filter-tag"><span class="filter-label">Status:</span><span class="filter-value">${currentFilters.status}</span></span>`);
    }
    
    if (currentFilters.assignee) {
        const displayValue = currentFilters.assignee === 'unassigned' ? 'Unassigned' : currentFilters.assignee;
        summary.append(`<span class="filter-tag"><span class="filter-label">Assignee:</span><span class="filter-value">${displayValue}</span></span>`);
    }
    
    if (currentFilters.category) {
        const displayValue = currentFilters.category === 'uncategorized' ? 'Uncategorized' : currentFilters.category;
        summary.append(`<span class="filter-tag"><span class="filter-label">Category:</span><span class="filter-value">${displayValue}</span></span>`);
    }
    
    if (currentFilters.tags) {
        summary.append(`<span class="filter-tag"><span class="filter-label">Tag:</span><span class="filter-value">${currentFilters.tags}</span></span>`);
    }
    
    if (!hasActiveFilters()) {
        summary.html('<em>No active filters</em>');
    }
}

function saveCurrentFilterAsPreset() {
    const name = $('#presetName').val().trim();
    const description = $('#presetDescription').val().trim();
    
    if (!name) {
        showError('Please enter a preset name');
        return;
    }
    
    // Check if name already exists
    if (savedPresets.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        showError('A preset with this name already exists');
        return;
    }
    
    // Create new preset
    const preset = {
        id: Date.now().toString(),
        name: name,
        description: description,
        filters: { ...currentFilters },
        created: new Date().toISOString(),
        taskCount: filteredTasks.length
    };
    
    // Save to storage
    savedPresets.push(preset);
    localStorage.setItem('filterPresets', JSON.stringify(savedPresets));
    
    // Update UI
    loadFilterPresets();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('saveFilterModal'));
    modal.hide();
    
    showSuccess(`Filter preset "${name}" saved successfully`);
}

function showManagePresetsModal() {
    updatePresetsDisplay();
    
    const modal = new bootstrap.Modal(document.getElementById('managePresetsModal'));
    modal.show();
}

function updatePresetsDisplay() {
    const container = $('#presets-list');
    container.empty();
    
    if (savedPresets.length === 0) {
        container.html(`
            <div class="text-center text-muted py-4">
                <i class="fas fa-bookmark fa-2x mb-2"></i>
                <p>No saved filter presets</p>
                <p class="small">Create a preset by applying filters and clicking "Save Current Filter"</p>
            </div>
        `);
        return;
    }
    
    savedPresets.forEach(preset => {
        const presetHtml = `
            <div class="preset-item" data-preset-id="${preset.id}">
                <div class="preset-info">
                    <h6>${preset.name}</h6>
                    <small>${preset.description || 'No description'}</small>
                    <div class="mt-1">
                        <small class="text-muted">
                            Created: ${new Date(preset.created).toLocaleDateString()}
                            | Last result: ${preset.taskCount} tasks
                        </small>
                    </div>
                </div>
                <div class="preset-actions">
                    <button class="btn btn-sm btn-outline-primary" onclick="applyCustomPreset('${preset.id}')">
                        <i class="fas fa-play"></i> Apply
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deletePreset('${preset.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
        container.append(presetHtml);
    });
}

function deletePreset(presetId) {
    const preset = savedPresets.find(p => p.id === presetId);
    if (!preset) return;
    
    showConfirmationDialog(
        'Delete Filter Preset',
        `Are you sure you want to delete the preset "${preset.name}"?`,
        function() {
            // Remove from array
            savedPresets = savedPresets.filter(p => p.id !== presetId);
            
            // Update storage
            localStorage.setItem('filterPresets', JSON.stringify(savedPresets));
            
            // Update UI
            updatePresetsDisplay();
            loadFilterPresets();
            
            showSuccess('Filter preset deleted');
        },
        null,
        { dangerous: true }
    );
}

function loadFilterPresets() {
    const menu = $('#filter-presets-menu');
    
    // Remove existing custom presets
    menu.find('a[data-custom-preset]').parent().remove();
    
    if (savedPresets.length > 0) {
        // Add separator if not exists
        if (menu.find('.custom-presets-separator').length === 0) {
            menu.find('li:last').before('<li><hr class="dropdown-divider custom-presets-separator"></li>');
        }
        
        // Add custom presets
        savedPresets.forEach(preset => {
            const item = `
                <li>
                    <a class="dropdown-item preset-item-menu" href="#" data-custom-preset="${preset.id}">
                        <span class="preset-name">${preset.name}</span>
                        <span class="preset-count">${preset.taskCount}</span>
                    </a>
                </li>
            `;
            menu.find('.custom-presets-separator').before(item);
        });
    }
}

// State persistence functions
function saveFilterState() {
    localStorage.setItem('taskFilters', JSON.stringify(currentFilters));
}

function loadFilterState() {
    const saved = localStorage.getItem('taskFilters');
    if (saved) {
        try {
            currentFilters = JSON.parse(saved);
            
            // Update UI
            $('#search-input').val(currentFilters.search || '');
            $('#priority-filter').val(currentFilters.priority || '');
            $('#status-filter').val(currentFilters.status || '');
            $('#assignee-filter').val(currentFilters.assignee || '');
            $('#category-filter').val(currentFilters.category || '');
            $('#tags-filter').val(currentFilters.tags || '');
            
            updateFilterIndicators();
        } catch (e) {
            console.error('Error loading filter state:', e);
        }
    }
}

function saveSortState() {
    localStorage.setItem('taskSort', JSON.stringify(currentSort));
}

function loadSortState() {
    const saved = localStorage.getItem('taskSort');
    if (saved) {
        try {
            currentSort = JSON.parse(saved);
            updateSortIndicators();
        } catch (e) {
            console.error('Error loading sort state:', e);
        }
    }
}

// Integration with existing task loading
function updateTasksForFiltering(tasks) {
    allTasks = tasks || [];
    
    // Populate all filter dropdowns with current data
    populateAssigneeFilter();
    populateCategoryFilter();
    populateTagsFilter();
    
    // Load saved sort state on first load
    if (allTasks.length > 0 && !currentSort.column) {
        loadSortState();
    }
    
    // Apply current filters and sorting
    applyFilters();
}

// Export functions for global access
window.updateTasksForFiltering = updateTasksForFiltering;
window.applyCustomPreset = applyCustomPreset;
window.deletePreset = deletePreset;
window.clearAllFilters = clearAllFilters;