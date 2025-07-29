/**
 * User Preferences and Customization Manager
 */

class PreferencesManager {
    constructor() {
        this.preferences = {
            theme: 'light',
            tableColumns: {
                task: true,
                priority: true,
                description: true,
                created_date: true,
                assignee: true,
                opened_date: true,
                status: true,
                completion_date: true,
                category: true,
                tags: true
            },
            chartTypes: {
                status: 'doughnut',
                priority: 'bar',
                assignee: 'horizontalBar'
            }
        };
        this.init();
    }
    
    init() {
        this.loadPreferences();
        this.applyTheme();
        this.setupEventListeners();
        this.createPreferencesModal();
    }
    
    loadPreferences() {
        try {
            const saved = localStorage.getItem('taskManagerPreferences');
            if (saved) {
                const savedPrefs = JSON.parse(saved);
                this.preferences = { ...this.preferences, ...savedPrefs };
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    }
    
    savePreferences() {
        try {
            localStorage.setItem('taskManagerPreferences', JSON.stringify(this.preferences));
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }
    
    applyTheme() {
        // Apply theme logic here
    }
    
    applyTableColumnVisibility() {
        // Apply column visibility logic here
    }
    
    setupEventListeners() {
        // Setup event listeners
    }
    
    createPreferencesModal() {
        // Create modal HTML
    }
    
    getChartType(chartName) {
        return this.preferences.chartTypes[chartName] || 'bar';
    }
    
    isColumnVisible(columnName) {
        return this.preferences.tableColumns[columnName] !== false;
    }
}

// Initialize preferences manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.preferencesManager = new PreferencesManager();
});
