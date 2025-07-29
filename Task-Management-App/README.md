# Flask Todo App

A modern, professional task management application built with Flask, featuring an elegant web interface with interactive charts, advanced filtering, and comprehensive task management capabilities.

## ✨ Features

### 🎯 **Core Task Management**
- **Full CRUD Operations**: Create, read, update, and delete tasks with ease
- **Inline Editing**: Click-to-edit functionality for quick task updates
- **Priority System**: Set task priorities (Critical, High, Medium, Low) with color-coded badges
- **Status Tracking**: Track progress (Not Started, In Progress, On Hold, Completed)
- **Date Management**: Created, opened, and completion date tracking

### 🎨 **Modern UI/UX**
- **Professional Design**: Clean, modern interface with Bootstrap 5
- **Colorful Tags**: Beautiful, tag-shaped badges with automatic color assignment
- **Responsive Layout**: Mobile-friendly design that works on all devices
- **Interactive Charts**: Real-time data visualization with Chart.js
- **Hover Effects**: Smooth animations and professional micro-interactions

### 🔍 **Advanced Features**
- **Smart Filtering**: Filter by priority, status, assignee, category, and tags
- **Real-time Search**: Instant search across task names and descriptions
- **Data Visualization**: Interactive charts showing task distribution and statistics
- **CSV Storage**: Reliable data persistence with atomic file operations
- **Category & Tag System**: Organize tasks with categories and multiple tags

## 🚀 Quick Start

### Prerequisites
- Python 3.7 or higher
- pip (Python package installer)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd flask-todo-app
```

2. **Create and activate virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Run the application:**
```bash
python app.py
```

5. **Open your browser:**
Navigate to `http://localhost:5000`

## 📁 Project Structure

```
flask-todo-app/
├── app.py                    # Main Flask application & API routes
├── models.py                 # Task data models and validation
├── csv_manager.py            # CSV file operations with atomic writes
├── requirements.txt          # Python dependencies
├── .gitignore               # Git ignore rules
├── static/
│   ├── css/
│   │   └── style.css        # Professional styling & responsive design
│   └── js/
│       ├── app.js           # Core JavaScript functionality
│       ├── filter-sort.js   # Advanced filtering and sorting
│       ├── export-import.js # CSV export/import features
│       ├── preferences.js   # User preferences management
│       └── categories-tags.js # Category and tag management
├── templates/
│   └── index.html           # Main application template
├── tasks.csv                # Task data storage (CSV format)
└── README.md                # Project documentation
```

## 🎮 Usage Guide

### ➕ **Adding Tasks**
1. Click the **"Add Task"** button in the header
2. Fill in task details in the modal form:
   - Task name (required)
   - Description, priority, status
   - Assignee, category, tags
   - Opened and completion dates
3. Click **"Add Task"** to save

### ✏️ **Editing Tasks**
1. Click the **edit icon** (pencil) on any task row
2. Table cells become editable inputs and dropdowns
3. Make your changes directly in the table
4. Click the **save icon** (checkmark) to save changes
5. Click the **cancel icon** (X) to discard changes

### 🗑️ **Deleting Tasks**
1. Click the **delete icon** (trash) on any task row
2. Confirm deletion in the popup dialog
3. Task is permanently removed

### 🔍 **Filtering & Search**
- **Search Bar**: Type to search across task names and descriptions
- **Priority Filter**: Filter by Critical, High, Medium, or Low priority
- **Status Filter**: Filter by task completion status
- **Assignee Filter**: Filter by person assigned to tasks
- **Category Filter**: Filter by task categories
- **Tags Filter**: Filter by task tags

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | Retrieve all tasks |
| `POST` | `/api/tasks` | Create a new task |
| `PUT` | `/api/tasks/<id>` | Update an existing task |
| `DELETE` | `/api/tasks/<id>` | Delete a task |
| `GET` | `/api/stats` | Get task statistics for charts |

## 🎨 Design Features

- **Color-coded Priority Badges**: Visual priority identification
- **Tag-shaped Labels**: Professional tag design with automatic colors
- **Interactive Charts**: Doughnut and bar charts for data visualization
- **Smooth Animations**: Hover effects and transitions
- **Professional Typography**: Clean, readable fonts and spacing
- **Responsive Grid**: Works perfectly on desktop, tablet, and mobile

## 🔧 Technical Details

- **Backend**: Flask (Python web framework)
- **Frontend**: Bootstrap 5, jQuery, Chart.js
- **Data Storage**: CSV files with atomic write operations
- **Validation**: Comprehensive server-side and client-side validation
- **Error Handling**: Graceful error handling with user feedback
- **Performance**: Optimized for fast loading and smooth interactions

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.