from flask import Flask, render_template, jsonify, request, send_from_directory, send_file, Response
import os
import io
from datetime import datetime
from csv_manager import CSVManager, CSVManagerError
from models import Task, ValidationError
from csv_export_import import CSVExportImport, CSVExportImportError


app = Flask(__name__)

# Basic configuration
app.config['SECRET_KEY'] = 'dev-secret-key-change-in-production'
app.config['CSV_FILE'] = 'tasks.csv'

# Initialize CSV manager
csv_manager = CSVManager(app.config['CSV_FILE'])
csv_export_import = CSVExportImport(csv_manager)

def get_csv_manager():
    """Get the CSV manager instance, allowing for test overrides"""
    return getattr(app, 'csv_manager', csv_manager)

def get_csv_export_import():
    """Get the CSV export/import instance, allowing for test overrides"""
    return getattr(app, 'csv_export_import', csv_export_import)



@app.route('/')
def index():
    """Serve the main page"""
    return render_template('index.html')

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks"""
    try:
        # Check if this is just a ping request to check connectivity
        if request.args.get('ping') == '1':
            return jsonify({'success': True, 'ping': 'pong'})
            
        manager = get_csv_manager()
        tasks = manager.read_tasks()
        
        # Convert datetime objects to ISO strings for JSON serialization
        for task in tasks:
            for field in ['created_date', 'opened_date', 'completion_date']:
                if task.get(field) and isinstance(task[field], datetime):
                    task[field] = task[field].isoformat()
        
        return jsonify({
            'success': True,
            'tasks': tasks,
            'count': len(tasks)
        })
    
    except CSVManagerError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new task"""
    try:
        # Check for offline header - if present, return a special response
        if request.headers.get('X-Offline-Mode') == 'true':
            return jsonify({
                'success': False,
                'error': 'You are offline. This request requires network connectivity.',
                'offline': True
            }), 503
            
        # Get JSON data from request
        try:
            data = request.get_json(force=True)
        except Exception:
            return jsonify({
                'success': False,
                'error': 'Invalid JSON data'
            }), 400
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Create and validate task
        task = Task.from_dict(data)
        task_dict = task.to_dict()
        
        # Add task to CSV
        manager = get_csv_manager()
        task_id = manager.add_task(task_dict)
        
        return jsonify({
            'success': True,
            'message': 'Task created successfully',
            'task_id': task_id,
            'task': task_dict
        }), 201
    
    except ValidationError as e:
        return jsonify({
            'success': False,
            'error': f'Validation error: {str(e)}'
        }), 400
    
    except CSVManagerError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }),500

@app.route('/api/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    """Update an existing task"""
    try:
        # Check for offline header - if present, return a special response
        if request.headers.get('X-Offline-Mode') == 'true':
            return jsonify({
                'success': False,
                'error': 'You are offline. This request requires network connectivity.',
                'offline': True
            }), 503
            
        # Get JSON data from request
        try:
            data = request.get_json(force=True)
        except Exception:
            return jsonify({
                'success': False,
                'error': 'Invalid JSON data'
            }), 400
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Check if task exists
        manager = get_csv_manager()
        existing_task = manager.get_task_by_id(task_id)
        if not existing_task:
            return jsonify({
                'success': False,
                'error': 'Task not found'
            }), 404
        
        # Check for conflict (if client provides a timestamp)
        if data.get('_last_modified') and existing_task.get('_last_modified'):
            client_timestamp = data.get('_last_modified')
            server_timestamp = existing_task.get('_last_modified')
            
            if client_timestamp < server_timestamp:
                return jsonify({
                    'success': False,
                    'error': 'Conflict: Task was modified by another user',
                    'conflict': True,
                    'server_task': existing_task
                }), 409
        
        # Merge existing data with updates
        updated_data = existing_task.copy()
        updated_data.update(data)
        updated_data['id'] = task_id  # Ensure ID doesn't change
        updated_data['_last_modified'] = datetime.now().isoformat()  # Add timestamp for conflict detection
        
        # Validate updated task
        task = Task.from_dict(updated_data)
        task_dict = task.to_dict()
        
        # Update task in CSV
        success = manager.update_task(task_id, task_dict)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Task not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Task updated successfully',
            'task': task_dict
        })
    
    except ValidationError as e:
        return jsonify({
            'success': False,
            'error': f'Validation error: {str(e)}'
        }), 400
    
    except CSVManagerError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task"""
    try:
        # Check for offline header - if present, return a special response
        if request.headers.get('X-Offline-Mode') == 'true':
            return jsonify({
                'success': False,
                'error': 'You are offline. This request requires network connectivity.',
                'offline': True
            }), 503
            
        # Check if task exists
        manager = get_csv_manager()
        existing_task = manager.get_task_by_id(task_id)
        if not existing_task:
            return jsonify({
                'success': False,
                'error': 'Task not found'
            }), 404
        
        # Delete task from CSV
        success = manager.delete_task(task_id)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Task not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Task deleted successfully'
        })
    
    except CSVManagerError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get task statistics for charts"""
    try:
        manager = get_csv_manager()
        tasks = manager.read_tasks()
        
        # Initialize counters
        stats = {
            'by_status': {},
            'by_priority': {},
            'by_assignee': {}
        }
        
        # Count tasks by status
        for task in tasks:
            status = task.get('status', 'Not Started')
            stats['by_status'][status] = stats['by_status'].get(status, 0) + 1
        
        # Count tasks by priority
        for task in tasks:
            priority = task.get('priority', 'Medium')
            stats['by_priority'][priority] = stats['by_priority'].get(priority, 0) + 1
        
        # Count tasks by assignee
        for task in tasks:
            assignee = task.get('assignee') or ''
            assignee = assignee.strip() if assignee else ''
            if not assignee:
                assignee = 'Unassigned'
            stats['by_assignee'][assignee] = stats['by_assignee'].get(assignee, 0) + 1
        
        # Count tasks by category
        stats['by_category'] = {}
        for task in tasks:
            category = task.get('category') or ''
            category = category.strip() if category else ''
            if not category:
                category = 'Uncategorized'
            stats['by_category'][category] = stats['by_category'].get(category, 0) + 1
        
        # Count tasks by tags
        stats['by_tags'] = {}
        for task in tasks:
            tags = task.get('tags') or ''
            if tags.strip():
                tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
                for tag in tag_list:
                    stats['by_tags'][tag] = stats['by_tags'].get(tag, 0) + 1
        
        return jsonify({
            'success': True,
            'stats': stats
        })
    
    except CSVManagerError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@app.route('/api/categories', methods=['GET'])
def create_backup():
    """Create a backup of the current tasks"""
    try:
        # Check for offline header - if present, return a special response
        if request.headers.get('X-Offline-Mode') == 'true':
            return jsonify({
                'success': False,
                'error': 'You are offline. This request requires network connectivity.',
                'offline': True
            }), 503
            
        exporter = get_csv_export_import()
        backup_path = exporter.create_backup()
        
        return jsonify({
            'success': True,
            'message': 'Backup created successfully',
            'backup_path': backup_path
        })
    
    except CSVExportImportError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@app.route('/api/restore', methods=['POST'])
def restore_backup():
    """Restore tasks from a backup file"""
    try:
        # Check for offline header - if present, return a special response
        if request.headers.get('X-Offline-Mode') == 'true':
            return jsonify({
                'success': False,
                'error': 'You are offline. This request requires network connectivity.',
                'offline': True
            }), 503
            
        # Get backup path from request
        data = request.get_json(force=True)
        backup_path = data.get('backup_path')
        
        if not backup_path:
            return jsonify({
                'success': False,
                'error': 'No backup path provided'
            }), 400
        
        # Restore from backup
        exporter = get_csv_export_import()
        success = exporter.restore_from_backup(backup_path)
        
        return jsonify({
            'success': success,
            'message': 'Backup restored successfully'
        })
    
    except CSVExportImportError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all unique categories"""
    try:
        manager = get_csv_manager()
        tasks = manager.read_tasks()
        
        categories = set()
        for task in tasks:
            category = task.get('category', '').strip()
            if category:
                categories.add(category)
        
        return jsonify({
            'success': True,
            'categories': sorted(list(categories))
        })
    
    except CSVManagerError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@app.route('/api/tags', methods=['GET'])
def get_tags():
    """Get all unique tags"""
    try:
        manager = get_csv_manager()
        tasks = manager.read_tasks()
        
        tags = set()
        for task in tasks:
            task_tags = task.get('tags') or ''
            if isinstance(task_tags, str) and task_tags.strip():
                tag_list = [tag.strip() for tag in task_tags.split(',') if tag.strip()]
                tags.update(tag_list)
        
        return jsonify({
            'success': True,
            'tags': sorted(list(tags))
        })
    
    except CSVManagerError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@app.route('/api/backups', methods=['GET'])
def list_backups():
    """List all available backups"""
    try:
        # Check for offline header - if present, return a special response
        if request.headers.get('X-Offline-Mode') == 'true':
            return jsonify({
                'success': False,
                'error': 'You are offline. This request requires network connectivity.',
                'offline': True
            }), 503
            
        exporter = get_csv_export_import()
        backups = exporter.list_backups()
        
        return jsonify({
            'success': True,
            'backups': backups
        })
    
    except CSVExportImportError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@app.route('/api/backup/delete', methods=['POST'])
def delete_backup():
    """Delete a backup file"""
    try:
        # Check for offline header - if present, return a special response
        if request.headers.get('X-Offline-Mode') == 'true':
            return jsonify({
                'success': False,
                'error': 'You are offline. This request requires network connectivity.',
                'offline': True
            }), 503
            
        # Get backup path from request
        data = request.get_json(force=True)
        backup_path = data.get('backup_path')
        
        if not backup_path:
            return jsonify({
                'success': False,
                'error': 'No backup path provided'
            }), 400
        
        # Delete backup
        exporter = get_csv_export_import()
        success = exporter.delete_backup(backup_path)
        
        return jsonify({
            'success': success,
            'message': 'Backup deleted successfully'
        })
    
    except CSVExportImportError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@app.route('/api/preferences', methods=['GET'])
def get_preferences():
    """Get user preferences"""
    try:
        # For now, preferences are stored client-side only
        # This endpoint can be used for server-side preference storage in the future
        return jsonify({
            'success': True,
            'message': 'Preferences are stored client-side',
            'preferences': {}
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@app.route('/api/preferences', methods=['POST'])
def save_preferences():
    """Save user preferences"""
    try:
        # Get JSON data from request
        try:
            data = request.get_json(force=True)
        except Exception:
            return jsonify({
                'success': False,
                'error': 'Invalid JSON data'
            }), 400
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No preferences data provided'
            }), 400
        
        # For now, just acknowledge the save
        # In the future, this could store preferences server-side
        return jsonify({
            'success': True,
            'message': 'Preferences saved successfully (client-side storage)'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)