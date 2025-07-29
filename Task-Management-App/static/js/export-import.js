/**
 * CSV Export and Import Functionality for Flask Todo App
 * 
 * This module handles:
 * - Exporting tasks to CSV
 * - Importing tasks from CSV
 * - Creating and managing backups
 * - Restoring from backups
 */

// Global variables
let importProgressInterval = null;
let importInProgress = false;
let backupsList = [];

// Initialize export/import functionality
$(document).ready(function() {
    console.log('Export/Import functionality initialized');
    setupExportImportHandlers();
});

/**
 * Set up event handlers for export/import functionality
 */
function setupExportImportHandlers() {
    // Export tasks button
    $('#export-tasks-btn').on('click', function(e) {
        e.preventDefault();
        exportTasks();
    });

    // Import tasks button in dropdown
    $('#import-tasks-btn').on('click', function(e) {
        e.preventDefault();
        // Modal will be shown by Bootstrap data-bs-toggle
        prepareImportModal();
    });

    // Import tasks button in modal
    $('#importTasksBtn').on('click', function(e) {
        e.preventDefault();
        importTasks();
    });

    // Backup tasks button
    $('#backup-tasks-btn').on('click', function(e) {
        e.preventDefault();
        createBackup();
    });

    // Reset import form when modal is closed
    $('#importTasksModal').on('hidden.bs.modal', function() {
        resetImportForm();
    });

    // File input change handler to validate file type
    $('#csvFile').on('change', function() {
        validateImportFile();
    });

    // Add keyboard shortcut for export (Ctrl+Shift+E)
    $(document).on('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'E') {
            e.preventDefault();
            exportTasks();
        }
    });

    // Add keyboard shortcut for import (Ctrl+Shift+I)
    $(document).on('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            $('#importTasksModal').modal('show');
            prepareImportModal();
        }
    });

    // Add keyboard shortcut for backup (Ctrl+Shift+B)
    $(document).on('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'B') {
            e.preventDefault();
            createBackup();
        }
    });

    // Add sample CSV download link handler
    $('#download-sample-csv').on('click', function(e) {
        e.preventDefault();
        downloadSampleCSV();
    });

    // Add manage backups button handler
    $('#manage-backups-btn').on('click', function(e) {
        e.preventDefault();
        showBackupsModal();
    });
}

/**
 * Export tasks to CSV file
 */
function exportTasks() {
    showLoading('Exporting tasks...');
    
    // Create a hidden iframe to handle the file download
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    // Set up load and error handlers
    iframe.onload = function() {
        hideLoading();
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
        showSuccess('Tasks exported successfully');
    };
    
    iframe.onerror = function() {
        hideLoading();
        document.body.removeChild(iframe);
        showError('Failed to export tasks');
    };
    
    // Navigate iframe to export URL
    iframe.src = '/api/export';
}

/**
 * Prepare the import modal before showing
 */
function prepareImportModal() {
    // Reset the form
    resetImportForm();
    
    // Show sample CSV download link if not already present
    if ($('#download-sample-csv').length === 0) {
        const sampleLink = $('<a>', {
            id: 'download-sample-csv',
            href: '#',
            class: 'btn btn-sm btn-outline-secondary mt-2',
            text: 'Download Sample CSV'
        });
        $('#csvFile').after(sampleLink);
    }
}

/**
 * Download a sample CSV file
 */
function downloadSampleCSV() {
    const headers = 'id,task,priority,description,created_date,assignee,opened_date,status,completion_date\n';
    const sampleData = 
        'sample-id-1,Sample Task 1,High,This is a sample task description,2023-01-01T12:00:00,John Doe,2023-01-02T12:00:00,In Progress,\n' +
        'sample-id-2,Sample Task 2,Medium,Another sample task,2023-01-03T12:00:00,Jane Smith,,Not Started,\n' +
        'sample-id-3,Sample Task 3,Low,Third sample task,2023-01-05T12:00:00,John Doe,,Completed,2023-01-10T15:30:00\n';
    
    const csvContent = headers + sampleData;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_tasks.csv');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Import tasks from CSV file
 */
function importTasks() {
    // Check if file is selected
    const fileInput = document.getElementById('csvFile');
    if (!fileInput.files || fileInput.files.length === 0) {
        showImportError('Please select a CSV file');
        return;
    }
    
    // Validate file type
    if (!fileInput.files[0].name.toLowerCase().endsWith('.csv')) {
        showImportError('File must be a CSV file');
        return;
    }
    
    // Get import options
    const validateImport = document.getElementById('validateImport').checked;
    const replaceExisting = document.getElementById('replaceExisting').checked;
    
    // Confirm if replacing existing tasks
    if (replaceExisting) {
        if (!confirm('Warning: This will replace all existing tasks. Are you sure you want to continue?')) {
            return;
        }
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('validate', validateImport);
    formData.append('replace_existing', replaceExisting);
    
    // Show progress bar
    const progressBar = document.querySelector('#import-progress .progress-bar');
    document.getElementById('import-progress').style.display = 'block';
    progressBar.style.width = '0%';
    progressBar.setAttribute('aria-valuenow', '0');
    
    // Start progress animation
    importInProgress = true;
    let progress = 0;
    importProgressInterval = setInterval(() => {
        if (importInProgress) {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            updateImportProgress(progress);
        }
    }, 300);
    
    // Disable import button
    document.getElementById('importTasksBtn').disabled = true;
    
    // Send import request
    $.ajax({
        url: '/api/import',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            importInProgress = false;
            clearInterval(importProgressInterval);
            updateImportProgress(100);
            
            setTimeout(() => {
                document.getElementById('importTasksBtn').disabled = false;
                
                if (response.success) {
                    // Show detailed results
                    let resultMessage = `Successfully imported ${response.imported} tasks.`;
                    
                    if (response.skipped > 0) {
                        resultMessage += ` ${response.skipped} tasks skipped.`;
                    }
                    
                    if (response.errors > 0) {
                        resultMessage += ` ${response.errors} tasks had errors.`;
                        
                        // Show error details if available
                        if (response.details && response.details.errors && response.details.errors.length > 0) {
                            const errorList = $('<ul>', { class: 'mt-2 mb-0' });
                            
                            // Limit to first 5 errors to avoid overwhelming the user
                            const errorsToShow = response.details.errors.slice(0, 5);
                            
                            errorsToShow.forEach(error => {
                                errorList.append($('<li>').text(`Row ${error.row}: ${error.error}`));
                            });
                            
                            if (response.details.errors.length > 5) {
                                errorList.append($('<li>').text(`... and ${response.details.errors.length - 5} more errors`));
                            }
                            
                            // Create a container for the error details
                            const errorDetails = $('<div>', { class: 'mt-2' })
                                .append($('<p>', { class: 'mb-1', text: 'Error details:' }))
                                .append(errorList);
                            
                            showImportSuccess(resultMessage, errorDetails);
                        } else {
                            showImportSuccess(resultMessage);
                        }
                    } else {
                        showImportSuccess(resultMessage);
                    }
                    
                    // Reload tasks after successful import
                    if (window.taskCache) {
                        window.taskCache.clear();
                    }
                    loadTasks();
                    loadStats();
                    
                    // Close modal after 3 seconds on success if no errors
                    if (response.errors === 0) {
                        setTimeout(() => {
                            $('#importTasksModal').modal('hide');
                        }, 3000);
                    }
                } else {
                    showImportError(response.error || 'Import failed');
                }
            }, 500);
        },
        error: function(xhr, status, error) {
            importInProgress = false;
            clearInterval(importProgressInterval);
            document.getElementById('importTasksBtn').disabled = false;
            
            let errorMessage = 'Import failed';
            try {
                const response = JSON.parse(xhr.responseText);
                errorMessage = response.error || errorMessage;
            } catch (e) {
                console.error('Error parsing error response:', e);
            }
            
            showImportError(errorMessage);
        }
    });
}

/**
 * Create a backup of current tasks
 */
function createBackup() {
    showLoading('Creating backup...');
    
    $.ajax({
        url: '/api/backup',
        type: 'POST',
        contentType: 'application/json',
        success: function(response) {
            hideLoading();
            
            if (response.success) {
                showSuccess('Backup created successfully');
            } else {
                showError(response.error || 'Failed to create backup');
            }
        },
        error: function(xhr, status, error) {
            hideLoading();
            
            let errorMessage = 'Failed to create backup';
            try {
                const response = JSON.parse(xhr.responseText);
                errorMessage = response.error || errorMessage;
            } catch (e) {
                console.error('Error parsing error response:', e);
            }
            
            showError(errorMessage);
        }
    });
}

/**
 * Show backups management modal
 */
function showBackupsModal() {
    // Create modal if it doesn't exist
    if ($('#backupsModal').length === 0) {
        const modal = $(`
            <div class="modal fade" id="backupsModal" tabindex="-1" aria-labelledby="backupsModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="backupsModalLabel">Manage Backups</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div id="backups-loading" class="text-center py-3">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Loading backups...</span>
                                </div>
                                <p class="mt-2">Loading backups...</p>
                            </div>
                            <div id="backups-error" class="alert alert-danger" style="display: none;"></div>
                            <div id="backups-empty" class="text-center py-3" style="display: none;">
                                <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                                <p>No backups found</p>
                                <button type="button" class="btn btn-primary" id="create-backup-btn">
                                    <i class="fas fa-save"></i> Create Backup
                                </button>
                            </div>
                            <div id="backups-list" style="display: none;">
                                <div class="table-responsive">
                                    <table class="table table-striped table-hover">
                                        <thead>
                                            <tr>
                                                <th>Backup Date</th>
                                                <th>Tasks</th>
                                                <th>Size</th>
                                                <th class="text-end">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody id="backups-table-body">
                                            <!-- Backups will be listed here -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" id="refresh-backups-btn">
                                <i class="fas fa-sync-alt"></i> Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);
        
        $('body').append(modal);
        
        // Add event handlers
        $('#create-backup-btn').on('click', function() {
            createBackup();
            setTimeout(loadBackups, 1000);
        });
        
        $('#refresh-backups-btn').on('click', function() {
            loadBackups();
        });
    }
    
    // Show modal
    const backupsModal = new bootstrap.Modal(document.getElementById('backupsModal'));
    backupsModal.show();
    
    // Load backups
    loadBackups();
}

/**
 * Load list of backups
 */
function loadBackups() {
    // Show loading
    $('#backups-loading').show();
    $('#backups-error').hide();
    $('#backups-empty').hide();
    $('#backups-list').hide();
    
    // Fetch backups
    $.ajax({
        url: '/api/backups',
        type: 'GET',
        success: function(response) {
            $('#backups-loading').hide();
            
            if (response.success) {
                backupsList = response.backups;
                
                if (backupsList.length === 0) {
                    $('#backups-empty').show();
                } else {
                    // Populate table
                    const tableBody = $('#backups-table-body');
                    tableBody.empty();
                    
                    backupsList.forEach(backup => {
                        const date = new Date(backup.created);
                        const formattedDate = date.toLocaleString();
                        const formattedSize = formatFileSize(backup.size);
                        
                        const row = $('<tr>');
                        row.append($('<td>').text(formattedDate));
                        row.append($('<td>').text(backup.task_count));
                        row.append($('<td>').text(formattedSize));
                        
                        const actionsCell = $('<td>', { class: 'text-end' });
                        
                        // Restore button
                        const restoreBtn = $('<button>', {
                            type: 'button',
                            class: 'btn btn-sm btn-outline-primary me-1',
                            'data-backup-path': backup.path,
                            html: '<i class="fas fa-undo"></i> Restore'
                        });
                        
                        restoreBtn.on('click', function() {
                            const backupPath = $(this).data('backup-path');
                            restoreBackup(backupPath);
                            $('#backupsModal').modal('hide');
                        });
                        
                        // Delete button
                        const deleteBtn = $('<button>', {
                            type: 'button',
                            class: 'btn btn-sm btn-outline-danger',
                            'data-backup-path': backup.path,
                            html: '<i class="fas fa-trash"></i> Delete'
                        });
                        
                        deleteBtn.on('click', function() {
                            const backupPath = $(this).data('backup-path');
                            deleteBackup(backupPath);
                        });
                        
                        actionsCell.append(restoreBtn);
                        actionsCell.append(deleteBtn);
                        row.append(actionsCell);
                        
                        tableBody.append(row);
                    });
                    
                    $('#backups-list').show();
                }
            } else {
                $('#backups-error').text(response.error || 'Failed to load backups').show();
            }
        },
        error: function(xhr, status, error) {
            $('#backups-loading').hide();
            
            let errorMessage = 'Failed to load backups';
            try {
                const response = JSON.parse(xhr.responseText);
                errorMessage = response.error || errorMessage;
            } catch (e) {
                console.error('Error parsing error response:', e);
            }
            
            $('#backups-error').text(errorMessage).show();
        }
    });
}

/**
 * Delete a backup file
 * @param {string} backupPath - Path to backup file
 */
function deleteBackup(backupPath) {
    if (!confirm('Are you sure you want to delete this backup?')) {
        return;
    }
    
    $.ajax({
        url: '/api/backup/delete',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            backup_path: backupPath
        }),
        success: function(response) {
            if (response.success) {
                showSuccess('Backup deleted successfully');
                loadBackups();
            } else {
                showError(response.error || 'Failed to delete backup');
            }
        },
        error: function(xhr, status, error) {
            let errorMessage = 'Failed to delete backup';
            try {
                const response = JSON.parse(xhr.responseText);
                errorMessage = response.error || errorMessage;
            } catch (e) {
                console.error('Error parsing error response:', e);
            }
            
            showError(errorMessage);
        }
    });
}

/**
 * Restore from a backup file
 * @param {string} backupPath - Path to backup file
 */
function restoreBackup(backupPath) {
    if (!confirm('Are you sure you want to restore from this backup? Current tasks will be replaced.')) {
        return;
    }
    
    showLoading('Restoring from backup...');
    
    $.ajax({
        url: '/api/restore',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            backup_path: backupPath
        }),
        success: function(response) {
            hideLoading();
            
            if (response.success) {
                showSuccess('Backup restored successfully');
                
                // Reload tasks after successful restore
                if (window.taskCache) {
                    window.taskCache.clear();
                }
                loadTasks();
                loadStats();
            } else {
                showError(response.error || 'Failed to restore backup');
            }
        },
        error: function(xhr, status, error) {
            hideLoading();
            
            let errorMessage = 'Failed to restore backup';
            try {
                const response = JSON.parse(xhr.responseText);
                errorMessage = response.error || errorMessage;
            } catch (e) {
                console.error('Error parsing error response:', e);
            }
            
            showError(errorMessage);
        }
    });
}

/**
 * Update import progress bar
 * @param {number} percent - Progress percentage (0-100)
 */
function updateImportProgress(percent) {
    const progressBar = document.querySelector('#import-progress .progress-bar');
    const roundedPercent = Math.min(100, Math.round(percent));
    
    progressBar.style.width = `${roundedPercent}%`;
    progressBar.setAttribute('aria-valuenow', roundedPercent);
    progressBar.setAttribute('aria-label', `Import progress: ${roundedPercent}%`);
}

/**
 * Show import error message
 * @param {string} message - Error message
 */
function showImportError(message) {
    const resultElement = document.getElementById('import-result');
    resultElement.className = 'alert alert-danger';
    resultElement.textContent = message;
    resultElement.style.display = 'block';
}

/**
 * Show import success message
 * @param {string} message - Success message
 * @param {jQuery} [extraContent] - Optional extra content to append
 */
function showImportSuccess(message, extraContent) {
    const resultElement = document.getElementById('import-result');
    resultElement.className = 'alert alert-success';
    resultElement.textContent = message;
    
    if (extraContent) {
        $(resultElement).append(extraContent);
    }
    
    resultElement.style.display = 'block';
}

/**
 * Reset import form
 */
function resetImportForm() {
    document.getElementById('importTasksForm').reset();
    document.getElementById('import-progress').style.display = 'none';
    document.getElementById('import-result').style.display = 'none';
    document.getElementById('importTasksBtn').disabled = false;
    
    if (importProgressInterval) {
        clearInterval(importProgressInterval);
        importProgressInterval = null;
    }
    
    importInProgress = false;
}

/**
 * Validate import file
 */
function validateImportFile() {
    const fileInput = document.getElementById('csvFile');
    const importButton = document.getElementById('importTasksBtn');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        importButton.disabled = true;
        return;
    }
    
    const file = fileInput.files[0];
    const isValid = file.name.toLowerCase().endsWith('.csv');
    
    importButton.disabled = !isValid;
    
    if (!isValid) {
        showImportError('File must be a CSV file');
    } else {
        document.getElementById('import-result').style.display = 'none';
    }
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}