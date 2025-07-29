"""
CSV Export/Import functionality for Flask Todo App
"""
import os
import io
import csv
import shutil
from datetime import datetime
from typing import Dict, List, Any, Tuple, Optional


class CSVExportImportError(Exception):
    """Custom exception for CSV export/import operations"""
    pass


class CSVExportImport:
    """Handles CSV export and import operations for tasks"""
    
    def __init__(self, csv_manager):
        """Initialize with CSV manager instance"""
        self.csv_manager = csv_manager
        self.backup_dir = 'backups'
        
        # Create backup directory if it doesn't exist
        if not os.path.exists(self.backup_dir):
            os.makedirs(self.backup_dir)
    
    def export_tasks_to_csv(self) -> Tuple[io.StringIO, str]:
        """
        Export all tasks to CSV format
        
        Returns:
            Tuple of (StringIO object with CSV content, filename)
        """
        try:
            tasks = self.csv_manager.read_tasks()
            
            # Create StringIO object for CSV content
            output = io.StringIO()
            
            if tasks:
                # Get headers from the first task
                headers = list(tasks[0].keys())
                
                # Write CSV content
                writer = csv.DictWriter(output, fieldnames=headers)
                writer.writeheader()
                writer.writerows(tasks)
            else:
                # Write empty CSV with standard headers
                headers = ['id', 'task', 'priority', 'description', 'created_date', 
                          'assignee', 'opened_date', 'status', 'completion_date', 
                          'category', 'tags']
                writer = csv.DictWriter(output, fieldnames=headers)
                writer.writeheader()
            
            # Generate filename with timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'tasks_export_{timestamp}.csv'
            
            return output, filename
            
        except Exception as e:
            raise CSVExportImportError(f"Failed to export tasks: {str(e)}")
    
    def import_tasks_from_csv(self, csv_content: str, validate: bool = True, 
                             replace_existing: bool = False) -> Dict[str, Any]:
        """
        Import tasks from CSV content
        
        Args:
            csv_content: CSV content as string
            validate: Whether to validate task data
            replace_existing: Whether to replace existing tasks
            
        Returns:
            Dictionary with import results
        """
        try:
            # Create backup before import
            backup_path = self.create_backup()
            
            # Parse CSV content
            csv_reader = csv.DictReader(io.StringIO(csv_content))
            imported_tasks = []
            skipped_tasks = []
            error_tasks = []
            
            for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 for header
                try:
                    # Clean up the row data
                    task_data = {}
                    for key, value in row.items():
                        if key and value is not None:
                            task_data[key.strip()] = str(value).strip() if value else ''
                    
                    # Validate required fields
                    if not task_data.get('task'):
                        error_tasks.append({
                            'row': row_num,
                            'error': 'Missing required field: task',
                            'data': task_data
                        })
                        continue
                    
                    # Add default values for missing fields
                    task_data.setdefault('priority', 'Medium')
                    task_data.setdefault('status', 'Not Started')
                    task_data.setdefault('description', '')
                    task_data.setdefault('assignee', '')
                    task_data.setdefault('category', '')
                    task_data.setdefault('tags', '')
                    
                    # Set created_date if not provided
                    if not task_data.get('created_date'):
                        task_data['created_date'] = datetime.now().isoformat()
                    
                    imported_tasks.append(task_data)
                    
                except Exception as e:
                    error_tasks.append({
                        'row': row_num,
                        'error': str(e),
                        'data': row
                    })
            
            # Import tasks
            if replace_existing:
                # Clear existing tasks and add imported ones
                self.csv_manager.write_tasks(imported_tasks)
                imported_count = len(imported_tasks)
            else:
                # Add imported tasks to existing ones
                existing_tasks = self.csv_manager.read_tasks()
                existing_ids = {task.get('id') for task in existing_tasks}
                
                new_tasks = []
                for task in imported_tasks:
                    if task.get('id') not in existing_ids:
                        new_tasks.append(task)
                    else:
                        skipped_tasks.append(task)
                
                # Add new tasks
                for task in new_tasks:
                    self.csv_manager.add_task(task)
                
                imported_count = len(new_tasks)
            
            return {
                'imported': imported_count,
                'skipped': len(skipped_tasks),
                'errors': len(error_tasks),
                'backup_path': backup_path,
                'skipped_details': skipped_tasks,
                'error_details': error_tasks
            }
            
        except Exception as e:
            raise CSVExportImportError(f"Failed to import tasks: {str(e)}")
    
    def create_backup(self) -> str:
        """
        Create a backup of the current CSV file
        
        Returns:
            Path to the backup file
        """
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_filename = f'tasks_backup_{timestamp}.csv'
            backup_path = os.path.join(self.backup_dir, backup_filename)
            
            # Copy current CSV file to backup location
            if os.path.exists(self.csv_manager.csv_file_path):
                shutil.copy2(self.csv_manager.csv_file_path, backup_path)
            else:
                # Create empty backup file if original doesn't exist
                with open(backup_path, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    headers = ['id', 'task', 'priority', 'description', 'created_date', 
                              'assignee', 'opened_date', 'status', 'completion_date', 
                              'category', 'tags']
                    writer.writerow(headers)
            
            return backup_path
            
        except Exception as e:
            raise CSVExportImportError(f"Failed to create backup: {str(e)}")
    
    def restore_from_backup(self, backup_path: str) -> bool:
        """
        Restore tasks from a backup file
        
        Args:
            backup_path: Path to the backup file
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if not os.path.exists(backup_path):
                raise CSVExportImportError(f"Backup file not found: {backup_path}")
            
            # Create a backup of current state before restore
            current_backup = self.create_backup()
            
            # Copy backup file to current CSV location
            shutil.copy2(backup_path, self.csv_manager.csv_file_path)
            
            return True
            
        except Exception as e:
            raise CSVExportImportError(f"Failed to restore from backup: {str(e)}")
    
    def list_backups(self) -> List[Dict[str, Any]]:
        """
        List all available backup files
        
        Returns:
            List of backup file information
        """
        try:
            backups = []
            
            if os.path.exists(self.backup_dir):
                for filename in os.listdir(self.backup_dir):
                    if filename.endswith('.csv') and filename.startswith('tasks_backup_'):
                        filepath = os.path.join(self.backup_dir, filename)
                        stat = os.stat(filepath)
                        
                        backups.append({
                            'filename': filename,
                            'path': filepath,
                            'size': stat.st_size,
                            'created': datetime.fromtimestamp(stat.st_ctime).isoformat(),
                            'modified': datetime.fromtimestamp(stat.st_mtime).isoformat()
                        })
            
            # Sort by creation time, newest first
            backups.sort(key=lambda x: x['created'], reverse=True)
            
            return backups
            
        except Exception as e:
            raise CSVExportImportError(f"Failed to list backups: {str(e)}")
    
    def delete_backup(self, backup_path: str) -> bool:
        """
        Delete a backup file
        
        Args:
            backup_path: Path to the backup file to delete
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if not os.path.exists(backup_path):
                return False
            
            # Security check: ensure the path is within backup directory
            abs_backup_path = os.path.abspath(backup_path)
            abs_backup_dir = os.path.abspath(self.backup_dir)
            
            if not abs_backup_path.startswith(abs_backup_dir):
                raise CSVExportImportError("Invalid backup path")
            
            os.remove(backup_path)
            return True
            
        except Exception as e:
            raise CSVExportImportError(f"Failed to delete backup: {str(e)}")