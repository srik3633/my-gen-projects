// Categories and Tags Management for Flask Todo App

// Global variables for categories and tags
let allCategories = [];
let allTags = [];
let categoryChart = null;

// Initialize categories and tags functionality
function initializeCategoriesAndTags() {
    loadCategoriesAndTags();
    setupCategoryTagFilters();
    setupCategoryTagInputs();
}

// Load categories and tags from server
async function loadCategoriesAndTags() {
    try {
        // Load categories
        const categoriesResponse = await fetch('/api/categories');
        if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json();
            if (categoriesData.success) {
                allCategories = categoriesData.categories;
                updateCategoryOptions();
            }
        }

        // Load tags
        const tagsResponse = await fetch('/api/tags');
        if (tagsResponse.ok) {
            const tagsData = await tagsResponse.json();
            if (tagsData.success) {
                allTags = tagsData.tags;
                updateTagOptions();
            }
        }
    } catch (error) {
        console.error('Error loading categories and tags:', error);
    }
}

// Update category filter and input options
function updateCategoryOptions() {
    // Update category filter dropdown
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        // Clear existing options except "All Categories"
        while (categoryFilter.children.length > 1) {
            categoryFilter.removeChild(categoryFilter.lastChild);
        }
        
        // Add category options
        allCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    // Update category suggestions datalist
    const categorySuggestions = document.getElementById('category-suggestions');
    if (categorySuggestions) {
        categorySuggestions.innerHTML = '';
        allCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            categorySuggestions.appendChild(option);
        });
    }
}

// Update tag filter options
function updateTagOptions() {
    const tagsFilter = document.getElementById('tags-filter');
    if (tagsFilter) {
        // Clear existing options except "All Tags"
        while (tagsFilter.children.length > 1) {
            tagsFilter.removeChild(tagsFilter.lastChild);
        }
        
        // Add tag options
        allTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            tagsFilter.appendChild(option);
        });
    }
}

// Setup category and tag filter event listeners
function setupCategoryTagFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const tagsFilter = document.getElementById('tags-filter');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }

    if (tagsFilter) {
        tagsFilter.addEventListener('change', applyFilters);
    }
}

// Setup category and tag input enhancements
function setupCategoryTagInputs() {
    const taskTags = document.getElementById('taskTags');
    
    if (taskTags) {
        // Add tag suggestions and validation
        taskTags.addEventListener('input', function(e) {
            validateTagInput(e.target);
        });

        // Add tag autocomplete functionality
        setupTagAutocomplete(taskTags);
    }
}

// Validate tag input format
function validateTagInput(input) {
    const value = input.value;
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    let isValid = true;
    let errorMessage = '';
    
    // Check each tag for valid characters
    for (const tag of tags) {
        if (!tag.match(/^[a-zA-Z0-9\s\-_]+$/)) {
            isValid = false;
            errorMessage = 'Tags can only contain letters, numbers, spaces, hyphens, and underscores';
            break;
        }
    }
    
    // Check total length
    if (value.length > 200) {
        isValid = false;
        errorMessage = 'Tags must be 200 characters or less';
    }
    
    // Update input validation state
    if (isValid) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    } else {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        
        // Show error message
        let feedback = input.parentNode.querySelector('.invalid-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            input.parentNode.appendChild(feedback);
        }
        feedback.textContent = errorMessage;
    }
    
    return isValid;
}

// Setup tag autocomplete functionality
function setupTagAutocomplete(input) {
    let currentSuggestions = [];
    
    input.addEventListener('input', function(e) {
        const value = e.target.value;
        const cursorPos = e.target.selectionStart;
        
        // Find the current tag being typed
        const beforeCursor = value.substring(0, cursorPos);
        const lastCommaIndex = beforeCursor.lastIndexOf(',');
        const currentTag = beforeCursor.substring(lastCommaIndex + 1).trim();
        
        if (currentTag.length > 0) {
            // Filter tags that start with current input
            currentSuggestions = allTags.filter(tag => 
                tag.toLowerCase().startsWith(currentTag.toLowerCase()) &&
                !value.includes(tag) // Don't suggest already used tags
            );
            
            showTagSuggestions(input, currentSuggestions, currentTag);
        } else {
            hideTagSuggestions();
        }
    });
    
    // Handle keyboard navigation for suggestions
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Tab' && currentSuggestions.length > 0) {
            e.preventDefault();
            selectTagSuggestion(input, currentSuggestions[0]);
        }
    });
}

// Show tag suggestions dropdown
function showTagSuggestions(input, suggestions, currentTag) {
    hideTagSuggestions(); // Remove any existing suggestions
    
    if (suggestions.length === 0) return;
    
    const dropdown = document.createElement('div');
    dropdown.className = 'tag-suggestions-dropdown';
    dropdown.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #ccc;
        border-top: none;
        max-height: 150px;
        overflow-y: auto;
        z-index: 1000;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;
    
    suggestions.slice(0, 5).forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'tag-suggestion-item';
        item.style.cssText = `
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid #eee;
        `;
        item.textContent = suggestion;
        
        item.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f8f9fa';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'white';
        });
        
        item.addEventListener('click', function() {
            selectTagSuggestion(input, suggestion);
        });
        
        dropdown.appendChild(item);
    });
    
    // Position dropdown relative to input
    const inputContainer = input.parentNode;
    inputContainer.style.position = 'relative';
    inputContainer.appendChild(dropdown);
}

// Hide tag suggestions dropdown
function hideTagSuggestions() {
    const existing = document.querySelector('.tag-suggestions-dropdown');
    if (existing) {
        existing.remove();
    }
}

// Select a tag suggestion
function selectTagSuggestion(input, suggestion) {
    const value = input.value;
    const cursorPos = input.selectionStart;
    const beforeCursor = value.substring(0, cursorPos);
    const afterCursor = value.substring(cursorPos);
    
    const lastCommaIndex = beforeCursor.lastIndexOf(',');
    const beforeTag = beforeCursor.substring(0, lastCommaIndex + 1);
    const afterTag = afterCursor;
    
    // Insert the suggestion
    const newValue = beforeTag + (beforeTag.endsWith(',') ? ' ' : '') + suggestion + ', ' + afterTag;
    input.value = newValue;
    
    // Position cursor after the inserted tag
    const newCursorPos = beforeTag.length + suggestion.length + 2;
    input.setSelectionRange(newCursorPos, newCursorPos);
    
    hideTagSuggestions();
    input.focus();
}

// Create category chart
function createCategoryChart(stats) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    const categoryData = stats.by_category || {};
    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);

    // Show/hide empty state
    const emptyState = document.getElementById('category-chart-empty');
    const chartContainer = document.getElementById('category-chart-container');
    
    if (labels.length === 0) {
        ctx.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    } else {
        ctx.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
    }

    // Destroy existing chart
    if (categoryChart) {
        categoryChart.destroy();
    }

    // Create new chart
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
                    '#4BC0C0', '#FF6384'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 10,
                        usePointStyle: true
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
            animation: {
                duration: PERFORMANCE_CONFIG?.CHART_ANIMATION_DURATION || 200
            }
        }
    });
}

// Update category chart
function updateCategoryChart(stats) {
    createCategoryChart(stats);
}

// Add visual indicators for categories and tags in table rows
function addCategoryTagIndicators(row, task) {
    // Add category indicator
    const categoryCell = row.querySelector('[data-field="category"]');
    if (categoryCell && task.category) {
        categoryCell.innerHTML = `
            <span class="badge bg-primary category-badge" title="Category: ${escapeHtml(task.category)}">
                <i class="fas fa-folder" aria-hidden="true"></i> ${escapeHtml(task.category)}
            </span>
        `;
    }

    // Add tags indicators
    const tagsCell = row.querySelector('[data-field="tags"]');
    if (tagsCell && task.tags) {
        const tags = task.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        const tagBadges = tags.map(tag => 
            `<span class="badge bg-secondary tag-badge me-1" title="Tag: ${escapeHtml(tag)}">
                <i class="fas fa-tag" aria-hidden="true"></i> ${escapeHtml(tag)}
            </span>`
        ).join('');
        tagsCell.innerHTML = tagBadges;
    }
}

// Filter tasks by category and tags
function filterTasksByCategoryAndTags(tasks) {
    const categoryFilter = document.getElementById('category-filter')?.value || '';
    const tagsFilter = document.getElementById('tags-filter')?.value || '';

    return tasks.filter(task => {
        // Category filter
        if (categoryFilter) {
            const taskCategory = task.category || '';
            if (taskCategory !== categoryFilter) {
                return false;
            }
        }

        // Tags filter
        if (tagsFilter) {
            const taskTags = task.tags || '';
            const tagList = taskTags.split(',').map(tag => tag.trim()).filter(tag => tag);
            if (!tagList.includes(tagsFilter)) {
                return false;
            }
        }

        return true;
    });
}

// Clear category and tag filters
function clearCategoryTagFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const tagsFilter = document.getElementById('tags-filter');

    if (categoryFilter) categoryFilter.value = '';
    if (tagsFilter) tagsFilter.value = '';
}

// Export functions for use in other scripts
window.CategoriesAndTags = {
    initialize: initializeCategoriesAndTags,
    loadCategoriesAndTags,
    updateCategoryChart,
    addCategoryTagIndicators,
    filterTasksByCategoryAndTags,
    clearCategoryTagFilters,
    validateTagInput
};