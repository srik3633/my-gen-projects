// Flask Todo App JavaScript

$(document).ready(function() {
    console.log('Flask Todo App initialized');
    
    // Initialize the application
    initializeApp();
});

function initializeApp() {
    // Load initial data
    loadTasks();
    loadStats();
    
    // Set up event listeners
    setupEventListeners();
}

function setupEventListeners() {
 // Set up task creation handlers
    setupTaskCreationHandlers();
    console.log('Event listeners set up');
}

function loadTasks() {
    console.log('Loading tasks...');
    
    $.ajax({
        url: '/api/tasks',
        method: 'GET',
        success: function(response) {
            console.log('Tasks loaded:', response);
            if (response.success) {
                displayTasks(response.tasks);
            } else {
                showError('Failed to load tasks');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading tasks:', error);
            showError('Failed to load tasks');
        }
    });
}

function loadStats() {
    console.log('Loading statistics...');
    
    $.ajax({
        url: '/api/stats',
        method: 'GET',
        success: function(response) {
            console.log('Stats loaded:', response);
            if (response.success) {
                updateCharts(response.stats);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading stats:', error);
        }
    });
}

function displayTasks(tasks) {
    const emptyState = $('#empty-state');
    const tableWrapper = $('#task-table-wrapper');
    const tableBody = $('#task-table-body');
    
    if (!tasks || tasks.length === 0) {
        // Show empty state, hide table
        emptyState.show();
        tableWrapper.hide();
    } else {
        // Hide empty state, show table
        emptyState.hide();
        tableWrapper.show();
        
        // Clear existing rows
        tableBody.empty();
        
        // Populate table with tasks
        tasks.forEach(function(task) {
            const row = createTaskRow(task);
            tableBody.append(row);
        });
    }
}

function createTaskRow(task) {
    const priorityClass = `priority-${task.priority.toLowerCase().replace(' ', '-')}`;
    const statusClass = `status-${task.status.toLowerCase().replace(' ', '-')}`;
    
    const row = `
        <tr data-task-id="${task.id}">
            <td class="task-name">${escapeHtml(task.task || '')}</td>
            <td class="task-priority">
                <span class="badge ${priorityClass}">${task.priority || ''}</span>
            </td>
            <td class="task-description">${escapeHtml(task.description || '')}</td>
            <td class="task-created-date">${formatDate(task.created_date)}</td>
            <td class="task-assignee">${escapeHtml(task.assignee || '')}</td>
            <td class="task-opened-date">${formatDate(task.opened_date)}</td>
            <td class="task-status">
                <span class="badge ${statusClass}">${task.status || ''}</span>
            </td>
            <td class="task-completion-date">${formatDate(task.completion_date)}</td>
            <td class="text-center action-buttons">
                <button class="btn btn-sm btn-edit" onclick="editTask('${task.id}')" title="Edit Task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-delete" onclick="deleteTask('${task.id}')" title="Delete Task">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
    
    return row;
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Global variable to track current editing state
let currentEditingRow = null;
let originalRowData = null;

// Placeholder functions for edit and delete - will be implemented in later tasks
function editTask(taskId) {
    console.log('Edit task:', taskId);
    // Prevent multiple edits
    if (currentEditingRow !== null) {
        showError('Please finish editing the current task before editing another');
        return;
    }
    
    const row = $(`tr[data-task-id="${taskId}"]`);
    if (row.length === 0) {
        showError('Task not found');
        return;
    }
    
    // Store original data for cancel functionality
    originalRowData = extractRowData(row);
    currentEditingRow = taskId;
    
    // Make row editable
    makeRowEditable(row);
    
    // Update action buttons
    updateActionButtons(row, true);
    
    // Add editing class for visual feedback
    row.addClass('editing-row');
}

function deleteTask(taskId) {
    console.log('Delete task:', taskId);
    showError('Delete functionality will be implemented in a later task');
}

function updateCharts(stats) {
    // Placeholder for chart updates - will be implemented in later tasks
    console.log('Updating charts with stats:', stats);
    
    // Update each chart
    updateStatusChart(stats.by_status);
    updatePriorityChart(stats.by_priority);
    updateAssigneeChart(stats.by_assignee);
}

function showError(message) {
    // Display error message to user
    const errorHtml = `<div class="error">${message}</div>`;
    $('#task-table-container').prepend(errorHtml);
    
    // Auto-hide error after 5 seconds
    setTimeout(function() {
        $('.error').fadeOut();
    }, 5000);
}

function showSuccess(message) {
    // Display success message to user
    const successHtml = `<div class="success">${message}</div>`;
    $('#task-table-container').prepend(successHtml);
    
    // Auto-hide success after 3 seconds
    setTimeout(function() {
        $('.success').fadeOut();
    }, 3000);
}
//
 Priority and status options for dropdowns
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed', 'On Hold'];

function extractRowData(row) {
    return {
        id: row.data('task-id'),
        task: row.find('.task-name').text().trim(),
        priority: row.find('.task-priority .badge').text().trim(),
        description: row.find('.task-description').text().trim(),
        created_date: row.find('.task-created-date').text().trim(),
        assignee: row.find('.task-assignee').text().trim(),
        opened_date: row.find('.task-opened-date').text().trim(),
        status: row.find('.task-status .badge').text().trim(),
        completion_date: row.find('.task-completion-date').text().trim()
    };
}

function makeRowEditable(row) {
    // Make text fields editable
    const editableFields = ['.task-name', '.task-description', '.task-assignee'];
    editableFields.forEach(selector => {
        const cell = row.find(selector);
        cell.attr('contenteditable', 'true')
           .addClass('editable-cell')
           .on('keydown', handleEditKeydown);
    });
    
    // Create dropdown for priority
    const priorityCell = row.find('.task-priority');
    const currentPriority = priorityCell.find('.badge').text().trim();
    const prioritySelect = createDropdown(PRIORITY_OPTIONS, currentPriority, 'priority');
    priorityCell.html(prioritySelect);
    
    // Create dropdown for status
    const statusCell = row.find('.task-status');
    const currentStatus = statusCell.find('.badge').text().trim();
    const statusSelect = createDropdown(STATUS_OPTIONS, currentStatus, 'status');
    statusCell.html(statusSelect);
    
    // Make date fields editable (but keep them as text for simplicity)
    const dateFields = ['.task-opened-date', '.task-completion-date'];
    dateFields.forEach(selector => {
        const cell = row.find(selector);
        cell.attr('contenteditable', 'true')
           .addClass('editable-cell')
           .on('keydown', handleEditKeydown);
    });
}

function createDropdown(options, currentValue, type) {
    let selectHtml = `<select class="edit-select" data-field="${type}">`;
    
    options.forEach(option => {
        const selected = option === currentValue ? 'selected' : '';
        selectHtml += `<option value="${option}" ${selected}>${option}</option>`;
    });
    
    selectHtml += '</select>';
    return selectHtml;
}

function handleEditKeydown(event) {
    // Handle Enter key to save, Escape key to cancel
    if (event.key === 'Enter') {
        event.preventDefault();
        saveTask();
    } else if (event.key === 'Escape') {
        event.preventDefault();
        cancelEdit();
    }
}

function updateActionButtons(row, isEditing) {
    const actionCell = row.find('.action-buttons');
    
    if (isEditing) {
        // Show save and cancel buttons
        actionCell.html(`
            <button class="btn btn-sm btn-save" onclick="saveTask()" title="Save Changes">
                <i class="fas fa-check"></i>
            </button>
            <button class="btn btn-sm btn-cancel" onclick="cancelEdit()" title="Cancel Edit">
                <i class="fas fa-times"></i>
            </button>
        `);
    } else {
        // Show edit and delete buttons
        const taskId = row.data('task-id');
        actionCell.html(`
            <button class="btn btn-sm btn-edit" onclick="editTask('${taskId}')" title="Edit Task">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-delete" onclick="deleteTask('${taskId}')" title="Delete Task">
                <i class="fas fa-trash"></i>
            </button>
        `);
    }
}

function saveTask() {
    if (currentEditingRow === null) {
        return;
    }
    
    const row = $(`tr[data-task-id="${currentEditingRow}"]`);
    
    // Extract edited data
    const editedData = {
        id: currentEditingRow,
        task: row.find('.task-name').text().trim(),
        priority: row.find('.edit-select[data-field="priority"]').val(),
        description: row.find('.task-description').text().trim(),
        assignee: row.find('.task-assignee').text().trim(),
        opened_date: row.find('.task-opened-date').text().trim(),
        status: row.find('.edit-select[data-field="status"]').val(),
        completion_date: row.find('.task-completion-date').text().trim(),
        created_date: originalRowData.created_date // Keep original created date
    };
    
    // Validate data
    const validation = validateTaskData(editedData);
    if (!validation.isValid) {
        showValidationErrors(row, validation.errors);
        return;
    }
    
    // Clear any existing validation errors
    clearValidationErrors(row);
    
    // Show loading state
    showLoadingState(row);
    
    // Send AJAX request to save changes
    $.ajax({
        url: `/api/tasks/${currentEditingRow}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(editedData),
        success: function(response) {
            if (response.success) {
                // Update row with saved data
                updateRowDisplay(row, editedData);
                exitEditMode(row);
                showSuccess('Task updated successfully');
                
                // Refresh charts with real-time animation
                loadStats();
            } else {
                showError(response.message || 'Failed to save task');
                hideLoadingState(row);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error saving task:', error);
            let errorMessage = 'Failed to save task';
            
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            }
            
            showError(errorMessage);
            hideLoadingState(row);
        }
    });
}

function cancelEdit() {
    if (currentEditingRow === null) {
        return;
    }
    
    const row = $(`tr[data-task-id="${currentEditingRow}"]`);
    
    // Restore original data
    restoreRowData(row, originalRowData);
    exitEditMode(row);
}

function validateTaskData(data) {
    const errors = {};
    let isValid = true;
    
    // Validate required fields
    if (!data.task || data.task.trim() === '') {
        errors.task = 'Task name is required';
        isValid = false;
    }
    
    // Validate priority
    if (!PRIORITY_OPTIONS.includes(data.priority)) {
        errors.priority = 'Invalid priority value';
        isValid = false;
    }
    
    // Validate status
    if (!STATUS_OPTIONS.includes(data.status)) {
        errors.status = 'Invalid status value';
        isValid = false;
    }
    
    // Validate dates (basic format check)
    if (data.opened_date && data.opened_date.trim() !== '') {
        if (!isValidDateFormat(data.opened_date)) {
            errors.opened_date = 'Invalid date format';
            isValid = false;
        }
    }
    
    if (data.completion_date && data.completion_date.trim() !== '') {
        if (!isValidDateFormat(data.completion_date)) {
            errors.completion_date = 'Invalid date format';
            isValid = false;
        }
    }
    
    return { isValid, errors };
}

function isValidDateFormat(dateString) {
    // Accept various date formats or empty string
    if (!dateString || dateString.trim() === '') {
        return true;
    }
    
    // Try to parse the date
    const date = new Date(dateString);
    return !isNaN(date.getTime());
}

function showValidationErrors(row, errors) {
    // Clear existing errors first
    clearValidationErrors(row);
    
    Object.keys(errors).forEach(field => {
        let selector;
        switch (field) {
            case 'task':
                selector = '.task-name';
                break;
            case 'priority':
                selector = '.edit-select[data-field="priority"]';
                break;
            case 'status':
                selector = '.edit-select[data-field="status"]';
                break;
            case 'opened_date':
                selector = '.task-opened-date';
                break;
            case 'completion_date':
                selector = '.task-completion-date';
                break;
            default:
                return;
        }
        
        const element = row.find(selector);
        element.addClass('validation-error');
        
        // Add error message
        const errorMsg = `<span class="validation-message">${errors[field]}</span>`;
        element.parent().append(errorMsg);
    });
}

function clearValidationErrors(row) {
    row.find('.validation-error').removeClass('validation-error');
    row.find('.validation-message').remove();
}

function showLoadingState(row) {
    const actionCell = row.find('.action-buttons');
    actionCell.html(`
        <button class="btn btn-sm btn-secondary" disabled>
            <i class="fas fa-spinner fa-spin"></i> Saving...
        </button>
    `);
}

function hideLoadingState(row) {
    updateActionButtons(row, true);
}

function updateRowDisplay(row, data) {
    // Update task name
    row.find('.task-name').text(data.task);
    
    // Update priority with badge
    const priorityClass = `priority-${data.priority.toLowerCase().replace(' ', '-')}`;
    row.find('.task-priority').html(`<span class="badge ${priorityClass}">${data.priority}</span>`);
    
    // Update description
    row.find('.task-description').text(data.description);
    
    // Update assignee
    row.find('.task-assignee').text(data.assignee);
    
    // Update opened date
    row.find('.task-opened-date').text(data.opened_date);
    
    // Update status with badge
    const statusClass = `status-${data.status.toLowerCase().replace(' ', '-')}`;
    row.find('.task-status').html(`<span class="badge ${statusClass}">${data.status}</span>`);
    
    // Update completion date
    row.find('.task-completion-date').text(data.completion_date);
}

function restoreRowData(row, data) {
    updateRowDisplay(row, data);
}

function exitEditMode(row) {
    // Remove editing class
    row.removeClass('editing-row');
    
    // Remove contenteditable attributes and classes
    row.find('[contenteditable]').removeAttr('contenteditable').removeClass('editable-cell');
    
    // Remove event listeners
    row.find('.editable-cell').off('keydown', handleEditKeydown);
    
    // Update action buttons back to edit/delete
    updateActionButtons(row, false);
    
    // Clear validation errors
    clearValidationErrors(row);
    
    // Reset editing state
    currentEditingRow = null;
    originalRowData = null;
}
funct
ion deleteTask(taskId) {
    console.log('Delete task:', taskId);
    
    // Prevent deletion if currently editing
    if (currentEditingRow !== null) {
        showError('Please finish editing the current task before deleting another');
        return;
    }
    
    // Find the task row to get task details for confirmation
    const row = $(`tr[data-task-id="${taskId}"]`);
    if (row.length === 0) {
        showError('Task not found');
        return;
    }
    
    const taskName = row.find('.task-name').text().trim();
    
    // Show confirmation dialog
    const confirmMessage = `Are you sure you want to delete the task "${taskName}"?\n\nThis action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
        return; // User cancelled
    }
    
    // Show loading state on the delete button
    const deleteButton = row.find('.btn-delete');
    const originalButtonHtml = deleteButton.html();
    deleteButton.html('<i class="fas fa-spinner fa-spin"></i>').prop('disabled', true);
    
    // Send AJAX request to delete task
    $.ajax({
        url: `/api/tasks/${taskId}`,
        method: 'DELETE',
        success: function(response) {
            if (response.success) {
                // Remove row from table immediately
                row.fadeOut(300, function() {
                    row.remove();
                    
                    // Check if table is now empty
                    const remainingRows = $('#task-table-body tr').length;
                    if (remainingRows === 0) {
                        // Show empty state
                        $('#empty-state').show();
                        $('#task-table-wrapper').hide();
                    }
                });
                
                // Show success message
                showSuccess('Task deleted successfully');
                
                // Update charts after successful deletion
                loadStats();
            } else {
                // Handle server error response
                const errorMessage = response.error || response.message || 'Failed to delete task';
                showError(errorMessage);
                
                // Restore button state
                deleteButton.html(originalButtonHtml).prop('disabled', false);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error deleting task:', error);
            
            let errorMessage = 'Failed to delete task';
            
            // Try to get specific error message from server response
            if (xhr.responseJSON) {
                if (xhr.responseJSON.error) {
                    errorMessage = xhr.responseJSON.error;
                } else if (xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
            } else if (xhr.status === 404) {
                errorMessage = 'Task not found';
            } else if (xhr.status === 0) {
                errorMessage = 'Network error - please check your connection';
            } else if (xhr.status >= 500) {
                errorMessage = 'Server error - please try again later';
            }
            
            showError(errorMessage);
            
            // Restore button state
            deleteButton.html(originalButtonHtml).prop('disabled', false);
        }
    });
}

// Global chart instances
let statusChart = null;
let priorityChart = null;
let assigneeChart = null;

function updateStatusChart(statusData) {
    const canvas = document.getElementById('statusChart');
    const emptyState = document.getElementById('status-chart-empty');
    
    if (!statusData || Object.keys(statusData).length === 0) {
        // Show empty state
        canvas.style.display = 'none';
        emptyState.style.display = 'block';
        
        // Destroy existing chart
        if (statusChart) {
            statusChart.destroy();
            statusChart = null;
        }
        return;
    }
    
    // Hide empty state and show canvas
    canvas.style.display = 'block';
    emptyState.style.display = 'none';
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (statusChart) {
        statusChart.destroy();
    }
    
    // Prepare data
    const labels = Object.keys(statusData);
    const data = Object.values(statusData);
    
    // Define colors for different statuses
    const statusColors = {
        'Not Started': '#6c757d',
        'In Progress': '#007bff',
        'Completed': '#28a745',
        'On Hold': '#ffc107'
    };
    
    const backgroundColors = labels.map(label => statusColors[label] || '#6c757d');
    
    // Create new chart
    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverBorderWidth: 3,
                hoverBorderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} tasks (${percentage}%)`;
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function updatePriorityChart(priorityData) {
    const canvas = document.getElementById('priorityChart');
    const emptyState = document.getElementById('priority-chart-empty');
    
    if (!priorityData || Object.keys(priorityData).length === 0) {
        // Show empty state
        canvas.style.display = 'none';
        emptyState.style.display = 'block';
        
        // Destroy existing chart
        if (priorityChart) {
            priorityChart.destroy();
            priorityChart = null;
        }
        return;
    }
    
    // Hide empty state and show canvas
    canvas.style.display = 'block';
    emptyState.style.display = 'none';
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (priorityChart) {
        priorityChart.destroy();
    }
    
    // Define priority order and colors
    const priorityOrder = ['Critical', 'High', 'Medium', 'Low'];
    const priorityColors = {
        'Critical': '#dc3545',
        'High': '#fd7e14',
        'Medium': '#ffc107',
        'Low': '#28a745'
    };
    
    // Sort data according to priority order
    const sortedLabels = priorityOrder.filter(priority => priorityData[priority]);
    const sortedData = sortedLabels.map(label => priorityData[label]);
    const backgroundColors = sortedLabels.map(label => priorityColors[label]);
    
    // Create new chart
    priorityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedLabels,
            datasets: [{
                label: 'Tasks',
                data: sortedData,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color),
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            return `${context.label}: ${value} task${value !== 1 ? 's' : ''}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return Number.isInteger(value) ? value : '';
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function updateAssigneeChart(assigneeData) {
    const canvas = document.getElementById('assigneeChart');
    const emptyState = document.getElementById('assignee-chart-empty');
    
    if (!assigneeData || Object.keys(assigneeData).length === 0) {
        // Show empty state
        canvas.style.display = 'none';
        emptyState.style.display = 'block';
        
        // Destroy existing chart
        if (assigneeChart) {
            assigneeChart.destroy();
            assigneeChart = null;
        }
        return;
    }
    
    // Hide empty state and show canvas
    canvas.style.display = 'block';
    emptyState.style.display = 'none';
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (assigneeChart) {
        assigneeChart.destroy();
    }
    
    // Sort assignees by task count (descending)
    const sortedEntries = Object.entries(assigneeData).sort((a, b) => b[1] - a[1]);
    const labels = sortedEntries.map(entry => entry[0]);
    const data = sortedEntries.map(entry => entry[1]);
    
    // Generate colors for assignees
    const colors = generateAssigneeColors(labels.length);
    
    // Create new chart
    assigneeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tasks',
                data: data,
                backgroundColor: colors,
                borderColor: colors.map(color => color),
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y', // This makes it a horizontal bar chart
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.x;
                            return `${context.label}: ${value} task${value !== 1 ? 's' : ''}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return Number.isInteger(value) ? value : '';
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        callback: function(value, index) {
                            const label = this.getLabelForValue(value);
                            // Truncate long names
                            return label.length > 15 ? label.substring(0, 12) + '...' : label;
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function generateAssigneeColors(count) {
    // Generate a set of distinct colors for assignees
    const baseColors = [
        '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8',
        '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#6c757d'
    ];
    
    const colors = [];
    for (let i = 0; i < count; i++) {
        if (i < baseColors.length) {
            colors.push(baseColors[i]);
        } else {
            // Generate additional colors using HSL
            const hue = (i * 137.508) % 360; // Golden angle approximation
            colors.push(`hsl(${hue}, 70%, 50%)`);
        }
    }
    
    return colors;
}
// Real
-time chart update functions

// Function to refresh chart data with real-time updates
function refreshCharts() {
    console.log('Refreshing charts...');
    
    $.ajax({
        url: '/api/stats',
        method: 'GET',
        success: function(response) {
            if (response.success) {
                updateChartsWithAnimation(response.stats);
            } else {
                console.error('Failed to load stats for chart refresh');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error refreshing chart data:', error);
        }
    });
}

// Function to update charts with enhanced animations
function updateChartsWithAnimation(stats) {
    console.log('Updating charts with animation:', stats);
    
    // Update each chart with smooth animations
    updateStatusChartWithAnimation(stats.by_status);
    updatePriorityChartWithAnimation(stats.by_priority);
    updateAssigneeChartWithAnimation(stats.by_assignee);
}

// Enhanced chart update functions with smooth animations

function updateStatusChartWithAnimation(statusData) {
    const canvas = document.getElementById('statusChart');
    const emptyState = document.getElementById('status-chart-empty');
    
    if (!statusData || Object.keys(statusData).length === 0) {
        // Show empty state
        canvas.style.display = 'none';
        emptyState.style.display = 'block';
        
        // Destroy existing chart
        if (statusChart) {
            statusChart.destroy();
            statusChart = null;
        }
        return;
    }
    
    // Hide empty state and show canvas
    canvas.style.display = 'block';
    emptyState.style.display = 'none';
    
    const ctx = canvas.getContext('2d');
    
    // Prepare data
    const labels = Object.keys(statusData);
    const data = Object.values(statusData);
    
    // Define colors for different statuses
    const statusColors = {
        'Not Started': '#6c757d',
        'In Progress': '#007bff',
        'Completed': '#28a745',
        'On Hold': '#ffc107'
    };
    
    const backgroundColors = labels.map(label => statusColors[label] || '#6c757d');
    
    // If chart exists, update data with animation
    if (statusChart) {
        statusChart.data.labels = labels;
        statusChart.data.datasets[0].data = data;
        statusChart.data.datasets[0].backgroundColor = backgroundColors;
        
        // Update with smooth animation
        statusChart.update('active');
    } else {
        // Create new chart with animation
        statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverBorderWidth: 3,
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} tasks (${percentage}%)`;
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
}

function updatePriorityChartWithAnimation(priorityData) {
    const canvas = document.getElementById('priorityChart');
    const emptyState = document.getElementById('priority-chart-empty');
    
    if (!priorityData || Object.keys(priorityData).length === 0) {
        // Show empty state
        canvas.style.display = 'none';
        emptyState.style.display = 'block';
        
        // Destroy existing chart
        if (priorityChart) {
            priorityChart.destroy();
            priorityChart = null;
        }
        return;
    }
    
    // Hide empty state and show canvas
    canvas.style.display = 'block';
    emptyState.style.display = 'none';
    
    const ctx = canvas.getContext('2d');
    
    // Define priority order and colors
    const priorityOrder = ['Critical', 'High', 'Medium', 'Low'];
    const priorityColors = {
        'Critical': '#dc3545',
        'High': '#fd7e14',
        'Medium': '#ffc107',
        'Low': '#28a745'
    };
    
    // Sort data according to priority order
    const sortedLabels = priorityOrder.filter(priority => priorityData[priority]);
    const sortedData = sortedLabels.map(label => priorityData[label]);
    const backgroundColors = sortedLabels.map(label => priorityColors[label]);
    
    // If chart exists, update data with animation
    if (priorityChart) {
        priorityChart.data.labels = sortedLabels;
        priorityChart.data.datasets[0].data = sortedData;
        priorityChart.data.datasets[0].backgroundColor = backgroundColors;
        priorityChart.data.datasets[0].borderColor = backgroundColors;
        
        // Update with smooth animation
        priorityChart.update('active');
    } else {
        // Create new chart with animation
        priorityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedLabels,
                datasets: [{
                    label: 'Tasks',
                    data: sortedData,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color),
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                return `${context.label}: ${value} task${value !== 1 ? 's' : ''}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return Number.isInteger(value) ? value : '';
                            }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
}

function updateAssigneeChartWithAnimation(assigneeData) {
    const canvas = document.getElementById('assigneeChart');
    const emptyState = document.getElementById('assignee-chart-empty');
    
    if (!assigneeData || Object.keys(assigneeData).length === 0) {
        // Show empty state
        canvas.style.display = 'none';
        emptyState.style.display = 'block';
        
        // Destroy existing chart
        if (assigneeChart) {
            assigneeChart.destroy();
            assigneeChart = null;
        }
        return;
    }
    
    // Hide empty state and show canvas
    canvas.style.display = 'block';
    emptyState.style.display = 'none';
    
    const ctx = canvas.getContext('2d');
    
    // Sort assignees by task count (descending)
    const sortedEntries = Object.entries(assigneeData).sort((a, b) => b[1] - a[1]);
    const labels = sortedEntries.map(entry => entry[0]);
    const data = sortedEntries.map(entry => entry[1]);
    
    // Generate colors for assignees
    const colors = generateAssigneeColors(labels.length);
    
    // If chart exists, update data with animation
    if (assigneeChart) {
        assigneeChart.data.labels = labels;
        assigneeChart.data.datasets[0].data = data;
        assigneeChart.data.datasets[0].backgroundColor = colors;
        assigneeChart.data.datasets[0].borderColor = colors;
        
        // Update with smooth animation
        assigneeChart.update('active');
    } else {
        // Create new chart with animation
        assigneeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tasks',
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors.map(color => color),
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y', // This makes it a horizontal bar chart
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.x;
                                return `${context.label}: ${value} task${value !== 1 ? 's' : ''}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return Number.isInteger(value) ? value : '';
                            }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            callback: function(value, index) {
                                const label = this.getLabelForValue(value);
                                // Truncate long names
                                return label.length > 15 ? label.substring(0, 12) + '...' : label;
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
}
// Function
 to refresh chart data with real-time updates and smooth animations
function refreshChartsRealTime() {
    console.log('Refreshing charts with real-time updates...');
    
    $.ajax({
        url: '/api/stats',
        method: 'GET',
        success: function(response) {
            console.log('Real-time stats loaded:', response);
            if (response.success) {
                // Use enhanced animation functions for smooth updates
                updateChartsWithAnimation(response.stats);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading real-time stats:', error);
            // Fallback to regular chart update
            loadStats();
        }
    });
}
// Task c
reation functionality
function setupTaskCreationHandlers() {
    // Handle save task button click
    $('#saveTaskBtn').on('click', function() {
        createNewTask();
    });
    
    // Handle form submission (Enter key)
    $('#addTaskForm').on('submit', function(e) {
        e.preventDefault();
        createNewTask();
    });
    
    // Handle modal reset when closed
    $('#addTaskModal').on('hidden.bs.modal', function() {
        resetTaskForm();
    });
    
    // Real-time validation
    $('#taskName').on('input', function() {
        validateTaskName();
    });
    
    $('#taskOpenedDate, #taskCompletionDate').on('change', function() {
        validateDates();
    });
}

function createNewTask() {
    // Clear previous errors
    clearFormErrors();
    
    // Validate form
    if (!validateTaskForm()) {
        return;
    }
    
    // Collect form data
    const formData = collectFormData();
    
    // Show loading state
    showTaskCreationLoading();
    
    // Send AJAX request
    $.ajax({
        url: '/api/tasks',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function(response) {
            if (response.success) {
                // Close modal
                $('#addTaskModal').modal('hide');
                
                // Show success message
                showSuccess('Task created successfully');
                
                // Refresh task list and charts
                loadTasks();
                loadStats();
                
                // Reset form
                resetTaskForm();
            } else {
                showFormError(response.error || 'Failed to create task');
            }
            hideTaskCreationLoading();
        },
        error: function(xhr, status, error) {
            console.error('Error creating task:', error);
            
            let errorMessage = 'Failed to create task';
            if (xhr.responseJSON && xhr.responseJSON.error) {
                errorMessage = xhr.responseJSON.error;
            } else if (xhr.status === 400) {
                errorMessage = 'Invalid task data provided';
            } else if (xhr.status === 0) {
                errorMessage = 'Network error - please check your connection';
            } else if (xhr.status >= 500) {
                errorMessage = 'Server error - please try again later';
            }
            
            showFormError(errorMessage);
            hideTaskCreationLoading();
        }
    });
}

function collectFormData() {
    const formData = {
        task: $('#taskName').val().trim(),
        priority: $('#taskPriority').val(),
        description: $('#taskDescription').val().trim(),
        assignee: $('#taskAssignee').val().trim(),
        status: $('#taskStatus').val()
    };
    
    // Add dates if provided
    const openedDate = $('#taskOpenedDate').val();
    if (openedDate) {
        formData.opened_date = openedDate;
    }
    
    const completionDate = $('#taskCompletionDate').val();
    if (completionDate) {
        formData.completion_date = completionDate;
    }
    
    return formData;
}

function validateTaskForm() {
    let isValid = true;
    
    // Validate task name
    if (!validateTaskName()) {
        isValid = false;
    }
    
    // Validate dates
    if (!validateDates()) {
        isValid = false;
    }
    
    return isValid;
}

function validateTaskName() {
    const taskName = $('#taskName').val().trim();
    const taskNameField = $('#taskName');
    const feedback = taskNameField.siblings('.invalid-feedback');
    
    if (!taskName) {
        taskNameField.addClass('is-invalid');
        feedback.text('Task name is required');
        return false;
    } else if (taskName.length > 200) {
        taskNameField.addClass('is-invalid');
        feedback.text('Task name must be less than 200 characters');
        return false;
    } else {
        taskNameField.removeClass('is-invalid').addClass('is-valid');
        return true;
    }
}

function validateDates() {
    const openedDate = $('#taskOpenedDate').val();
    const completionDate = $('#taskCompletionDate').val();
    const openedDateField = $('#taskOpenedDate');
    const completionDateField = $('#taskCompletionDate');
    const openedFeedback = openedDateField.siblings('.invalid-feedback');
    const completionFeedback = completionDateField.siblings('.invalid-feedback');
    
    let isValid = true;
    
    // Clear previous validation states
    openedDateField.removeClass('is-invalid is-valid');
    completionDateField.removeClass('is-invalid is-valid');
    
    // Validate date logic
    if (openedDate && completionDate) {
        const opened = new Date(openedDate);
        const completion = new Date(completionDate);
        
        if (completion < opened) {
            completionDateField.addClass('is-invalid');
            completionFeedback.text('Completion date cannot be before opened date');
            isValid = false;
        } else {
            completionDateField.addClass('is-valid');
        }
    }
    
    // Validate individual dates
    if (openedDate) {
        openedDateField.addClass('is-valid');
    }
    
    if (completionDate && isValid) {
        completionDateField.addClass('is-valid');
    }
    
    return isValid;
}

function clearFormErrors() {
    $('#addTaskForm .is-invalid').removeClass('is-invalid');
    $('#addTaskForm .is-valid').removeClass('is-valid');
    $('#form-error-message').hide();
}

function showFormError(message) {
    $('#form-error-message').text(message).show();
}

function showTaskCreationLoading() {
    const saveBtn = $('#saveTaskBtn');
    saveBtn.prop('disabled', true)
           .html('<i class="fas fa-spinner fa-spin"></i> Creating...');
}

function hideTaskCreationLoading() {
    const saveBtn = $('#saveTaskBtn');
    saveBtn.prop('disabled', false)
           .html('<i class="fas fa-plus"></i> Add Task');
}

function resetTaskForm() {
    // Reset form fields
    $('#addTaskForm')[0].reset();
    
    // Reset validation states
    $('#addTaskForm .is-invalid').removeClass('is-invalid');
    $('#addTaskForm .is-valid').removeClass('is-valid');
    
    // Hide error message
    $('#form-error-message').hide();
    
    // Reset button state
    hideTaskCreationLoading();
    
    // Reset select fields to default values
    $('#taskPriority').val('Medium');
    $('#taskStatus').val('Not Started');
}