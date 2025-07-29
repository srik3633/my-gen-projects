import csv
import os
import uuid
import tempfile
import shutil
import time
import platform
from datetime import datetime
from typing import List, Dict, Optional, Any
from contextlib import contextmanager

# Import file locking based on platform
try:
    import fcntl
    HAS_FCNTL = True
except ImportError:
    # Windows doesn't have fcntl, we'll use msvcrt
    try:
        import msvcrt
        HAS_MSVCRT = True
    except ImportError:
        HAS_MSVCRT = False
    HAS_FCNTL = False


class CSVManager:
    """
    CSV file manager for task data with CRUD operations, file locking,
    and comprehensive error handling.
    """
    
    def __init__(self, csv_file_path: str = 'tasks.csv'):
        self.csv_file_path = csv_file_path
        self.headers = [
            'id', 'task', 'priority', 'description', 'created_date',
            'assignee', 'opened_date', 'status', 'completion_date',
            'category', 'tags'
        ]
        self._ensure_csv_exists()
    
    def _ensure_csv_exists(self):
        """Create CSV file with headers if it doesn't exist or is empty."""
        if not os.path.exists(self.csv_file_path) or os.path.getsize(self.csv_file_path) == 0:
            try:
                with open(self.csv_file_path, 'w', newline='', encoding='utf-8') as file:
                    writer = csv.writer(file)
                    writer.writerow(self.headers)
            except (IOError, OSError) as e:
                raise CSVManagerError(f"Failed to create CSV file: {str(e)}")
    
    @contextmanager
    def _file_lock(self, file_handle, lock_type='exclusive'):
        """
        Context manager for file locking to handle concurrent access.
        Uses fcntl on Unix-like systems and msvcrt on Windows.
        """
        locked = False
        try:
            if HAS_FCNTL:
                # Unix-like systems (Linux, macOS)
                lock_flag = fcntl.LOCK_EX if lock_type == 'exclusive' else fcntl.LOCK_SH
                fcntl.flock(file_handle.fileno(), lock_flag)
                locked = True
            elif HAS_MSVCRT:
                # Windows systems
                retry_count = 0
                max_retries = 10
                while retry_count < max_retries:
                    try:
                        if lock_type == 'exclusive':
                            msvcrt.locking(file_handle.fileno(), msvcrt.LK_NBLCK, 1)
                        else:
                            # Shared locks not directly supported in msvcrt, use exclusive
                            msvcrt.locking(file_handle.fileno(), msvcrt.LK_NBLCK, 1)
                        locked = True
                        break
                    except IOError:
                        retry_count += 1
                        time.sleep(0.1)
                
                if not locked:
                    raise CSVManagerError("Could not acquire file lock after retries")
            
            yield file_handle
            
        finally:
            if locked:
                if HAS_FCNTL:
                    fcntl.flock(file_handle.fileno(), fcntl.LOCK_UN)
                elif HAS_MSVCRT:
                    try:
                        msvcrt.locking(file_handle.fileno(), msvcrt.LK_UNLCK, 1)
                    except IOError:
                        pass  # File might already be unlocked
    
    def _validate_csv_structure(self, file_path: str) -> bool:
        """Validate that CSV file has correct headers."""
        try:
            # If file is empty, it's valid (we'll add headers)
            if os.path.getsize(file_path) == 0:
                return True
                
            with open(file_path, 'r', encoding='utf-8') as file:
                reader = csv.reader(file)
                headers = next(reader, None)
                return headers == self.headers
        except (IOError, OSError, StopIteration):
            return False
    
    def _parse_task_row(self, row: List[str]) -> Optional[Dict[str, Any]]:
        """Parse a CSV row into a task dictionary with proper type conversion."""
        if len(row) != len(self.headers):
            return None
        
        try:
            task = {}
            for i, header in enumerate(self.headers):
                value = row[i].strip() if row[i] else None
                
                if header in ['created_date', 'opened_date', 'completion_date']:
                    # Handle datetime fields - keep as strings for consistency
                    if value and value.strip():
                        task[header] = value.strip()
                    else:
                        task[header] = None
                else:
                    task[header] = value
            
            return task
        except (ValueError, IndexError):
            return None
    
    def _format_task_row(self, task: Dict[str, Any]) -> List[str]:
        """Format a task dictionary into a CSV row."""
        row = []
        for header in self.headers:
            value = task.get(header, '')
            
            if header in ['created_date', 'opened_date', 'completion_date']:
                # Format datetime fields
                if isinstance(value, datetime):
                    row.append(value.isoformat())
                elif value and str(value).strip():
                    # Handle string dates (ISO format or other valid date strings)
                    row.append(str(value).strip())
                else:
                    # Empty or None values
                    row.append('')
            else:
                row.append(str(value) if value is not None else '')
        
        return row
    
    def read_tasks(self) -> List[Dict[str, Any]]:
        """
        Read all tasks from CSV file with error handling.
        Returns list of task dictionaries.
        """
        tasks = []
        
        try:
            # Ensure CSV exists and has proper structure
            self._ensure_csv_exists()
            
            # Validate CSV structure
            if not self._validate_csv_structure(self.csv_file_path):
                raise CSVManagerError("CSV file has invalid structure")
            
            with open(self.csv_file_path, 'r', encoding='utf-8') as file:
                with self._file_lock(file, 'shared'):  # Shared lock for reading
                    reader = csv.reader(file)
                    next(reader)  # Skip headers
                    
                    for row_num, row in enumerate(reader, start=2):
                        if not any(row):  # Skip empty rows
                            continue
                        
                        task = self._parse_task_row(row)
                        if task:
                            tasks.append(task)
                        else:
                            print(f"Warning: Skipping invalid row {row_num} in CSV file")
            
            return tasks
            
        except (IOError, OSError) as e:
            raise CSVManagerError(f"Failed to read CSV file: {str(e)}")
        except Exception as e:
            raise CSVManagerError(f"Unexpected error reading CSV: {str(e)}")
    
    def write_tasks(self, tasks: List[Dict[str, Any]]) -> None:
        """
        Write all tasks to CSV file with atomic operation and file locking.
        """
        try:
            # Write to temporary file first for atomic operation
            temp_file = tempfile.NamedTemporaryFile(
                mode='w', 
                delete=False, 
                newline='', 
                encoding='utf-8',
                dir=os.path.dirname(self.csv_file_path) or '.'
            )
            
            try:
                with self._file_lock(temp_file, 'exclusive'):
                    writer = csv.writer(temp_file)
                    writer.writerow(self.headers)
                    
                    for task in tasks:
                        row = self._format_task_row(task)
                        writer.writerow(row)
                
                temp_file.close()
                
                # Atomically replace the original file
                shutil.move(temp_file.name, self.csv_file_path)
                
            except Exception:
                # Clean up temp file if something goes wrong
                temp_file.close()
                if os.path.exists(temp_file.name):
                    os.unlink(temp_file.name)
                raise
                
        except (IOError, OSError) as e:
            raise CSVManagerError(f"Failed to write CSV file: {str(e)}")
        except Exception as e:
            raise CSVManagerError(f"Unexpected error writing CSV: {str(e)}")
    
    def add_task(self, task_data: Dict[str, Any]) -> str:
        """
        Add a new task to CSV file.
        Returns the generated task ID.
        """
        # Generate ID if not provided
        if 'id' not in task_data or not task_data['id']:
            task_data['id'] = str(uuid.uuid4())
        
        # Set created_date if not provided
        if 'created_date' not in task_data or not task_data['created_date']:
            task_data['created_date'] = datetime.now()
        
        # Read existing tasks
        tasks = self.read_tasks()
        
        # Check for duplicate ID
        if any(task['id'] == task_data['id'] for task in tasks):
            raise CSVManagerError(f"Task with ID {task_data['id']} already exists")
        
        # Add new task
        tasks.append(task_data)
        
        # Write back to file
        self.write_tasks(tasks)
        
        return task_data['id']
    
    def update_task(self, task_id: str, task_data: Dict[str, Any]) -> bool:
        """
        Update an existing task in CSV file.
        Returns True if task was found and updated, False otherwise.
        """
        tasks = self.read_tasks()
        
        # Find and update the task
        task_found = False
        for i, task in enumerate(tasks):
            if task['id'] == task_id:
                # Preserve the original ID and created_date
                task_data['id'] = task_id
                if 'created_date' not in task_data:
                    task_data['created_date'] = task['created_date']
                
                tasks[i] = task_data
                task_found = True
                break
        
        if not task_found:
            return False
        
        # Write back to file
        self.write_tasks(tasks)
        return True
    
    def delete_task(self, task_id: str) -> bool:
        """
        Delete a task from CSV file.
        Returns True if task was found and deleted, False otherwise.
        """
        tasks = self.read_tasks()
        
        # Find and remove the task
        original_count = len(tasks)
        tasks = [task for task in tasks if task['id'] != task_id]
        
        if len(tasks) == original_count:
            return False  # Task not found
        
        # Write back to file
        self.write_tasks(tasks)
        return True
    
    def get_task_by_id(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific task by ID.
        Returns task dictionary or None if not found.
        """
        tasks = self.read_tasks()
        
        for task in tasks:
            if task['id'] == task_id:
                return task
        
        return None
    
    def get_task_count(self) -> int:
        """Get the total number of tasks."""
        return len(self.read_tasks())
    
    def validate_task_data(self, task_data: Dict[str, Any]) -> List[str]:
        """
        Validate task data and return list of error messages.
        Returns empty list if data is valid.
        """
        errors = []
        
        # Required fields
        if not task_data.get('task', '').strip():
            errors.append("Task title is required")
        
        # Priority validation
        valid_priorities = ['Low', 'Medium', 'High', 'Critical']
        if 'priority' in task_data and task_data['priority'] not in valid_priorities:
            errors.append(f"Priority must be one of: {', '.join(valid_priorities)}")
        
        # Status validation
        valid_statuses = ['Not Started', 'In Progress', 'Completed', 'On Hold']
        if 'status' in task_data and task_data['status'] not in valid_statuses:
            errors.append(f"Status must be one of: {', '.join(valid_statuses)}")
        
        # Date validation
        date_fields = ['created_date', 'opened_date', 'completion_date']
        for field in date_fields:
            if field in task_data and task_data[field] is not None:
                if not isinstance(task_data[field], datetime):
                    try:
                        datetime.fromisoformat(str(task_data[field]).replace('Z', '+00:00'))
                    except ValueError:
                        errors.append(f"{field} must be a valid datetime")
        
        return errors


class CSVManagerError(Exception):
    """Custom exception for CSV manager errors."""
    pass