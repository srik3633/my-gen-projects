"""
Task data model and validation for Flask Todo App
"""
import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any


class Priority(Enum):
    """Task priority levels"""
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class Status(Enum):
    """Task status options"""
    NOT_STARTED = "Not Started"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    ON_HOLD = "On Hold"


class ValidationError(Exception):
    """Custom exception for validation errors"""
    pass


class Task:
    """Task model with validation"""
    
    def __init__(self, task: str, priority: str = "Medium", description: str = "", 
                 assignee: str = "", opened_date: Optional[str] = None, 
                 status: str = "Not Started", completion_date: Optional[str] = None,
                 task_id: Optional[str] = None, created_date: Optional[str] = None,
                 category: str = "", tags: str = ""):
        """
        Initialize a new task
        
        Args:
            task: Task title (required)
            priority: Task priority (Low, Medium, High, Critical)
            description: Task description (optional)
            assignee: Person assigned to task (optional)
            opened_date: When task was opened (optional)
            status: Task status (Not Started, In Progress, Completed, On Hold)
            completion_date: When task was completed (optional)
            task_id: Unique identifier (auto-generated if not provided)
            created_date: When task was created (auto-generated if not provided)
            category: Task category (optional)
            tags: Comma-separated tags (optional)
        """
        self.id = task_id or str(uuid.uuid4())
        self.task = task
        self.priority = priority
        self.description = description
        self.created_date = created_date or datetime.now().isoformat()
        self.assignee = assignee
        self.opened_date = opened_date
        self.status = status
        self.completion_date = completion_date
        self.category = category
        self.tags = tags
        
        # Validate the task data
        self.validate()
    
    def validate(self) -> None:
        """
        Validate all task fields
        
        Raises:
            ValidationError: If any field is invalid
        """
        errors = []
        
        # Validate required fields
        if not self.task or not self.task.strip():
            errors.append("Task title is required")
        
        # Validate task title length
        if self.task and len(self.task.strip()) > 200:
            errors.append("Task title must be 200 characters or less")
        
        # Validate priority
        try:
            Priority(self.priority)
        except ValueError:
            valid_priorities = [p.value for p in Priority]
            errors.append(f"Priority must be one of: {', '.join(valid_priorities)}")
        
        # Validate status
        try:
            Status(self.status)
        except ValueError:
            valid_statuses = [s.value for s in Status]
            errors.append(f"Status must be one of: {', '.join(valid_statuses)}")
        
        # Validate description length
        if self.description and len(self.description) > 1000:
            errors.append("Description must be 1000 characters or less")
        
        # Validate assignee length
        if self.assignee and len(self.assignee) > 100:
            errors.append("Assignee name must be 100 characters or less")
        
        # Validate category length
        if self.category and len(self.category) > 50:
            errors.append("Category must be 50 characters or less")
        
        # Validate tags format and length
        if self.tags:
            if len(self.tags) > 200:
                errors.append("Tags must be 200 characters or less")
            # Validate tag format (comma-separated, no special characters except spaces and hyphens)
            tag_list = [tag.strip() for tag in self.tags.split(',') if tag.strip()]
            for tag in tag_list:
                if not tag.replace(' ', '').replace('-', '').replace('_', '').isalnum():
                    errors.append(f"Tag '{tag}' contains invalid characters. Use only letters, numbers, spaces, hyphens, and underscores")
        
        # Validate date formats
        if self.created_date:
            if not self._is_valid_datetime(self.created_date):
                errors.append("Created date must be in ISO format (YYYY-MM-DDTHH:MM:SSZ)")
        
        if self.opened_date:
            if not self._is_valid_datetime(self.opened_date):
                errors.append("Opened date must be in ISO format (YYYY-MM-DDTHH:MM:SSZ)")
        
        if self.completion_date:
            if not self._is_valid_datetime(self.completion_date):
                errors.append("Completion date must be in ISO format (YYYY-MM-DDTHH:MM:SSZ)")
        
        # Validate business logic
        if self.status == Status.COMPLETED.value and not self.completion_date:
            errors.append("Completed tasks must have a completion date")
        
        if self.status != Status.COMPLETED.value and self.completion_date:
            errors.append("Only completed tasks can have a completion date")
        
        if errors:
            raise ValidationError("; ".join(errors))
    
    def _is_valid_datetime(self, date_string: str) -> bool:
        """
        Check if a string is a valid ISO datetime format
        
        Args:
            date_string: String to validate
            
        Returns:
            bool: True if valid datetime format
        """
        if not date_string:
            return False
        
        try:
            # Try to parse the datetime string directly
            if date_string.endswith('Z'):
                datetime.fromisoformat(date_string[:-1])
            elif '+' in date_string or date_string.count('-') > 2:
                # Handle timezone offsets
                datetime.fromisoformat(date_string.replace('Z', ''))
            else:
                datetime.fromisoformat(date_string)
            return True
        except ValueError:
            return False
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert task to dictionary
        
        Returns:
            dict: Task data as dictionary
        """
        return {
            'id': self.id,
            'task': self.task,
            'priority': self.priority,
            'description': self.description,
            'created_date': self.created_date,
            'assignee': self.assignee,
            'opened_date': self.opened_date,
            'status': self.status,
            'completion_date': self.completion_date,
            'category': self.category,
            'tags': self.tags
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Task':
        """
        Create task from dictionary
        
        Args:
            data: Dictionary containing task data
            
        Returns:
            Task: New task instance
        """
        return cls(
            task_id=data.get('id'),
            task=data.get('task', ''),
            priority=data.get('priority', 'Medium'),
            description=data.get('description', ''),
            created_date=data.get('created_date'),
            assignee=data.get('assignee', ''),
            opened_date=data.get('opened_date'),
            status=data.get('status', 'Not Started'),
            completion_date=data.get('completion_date'),
            category=data.get('category', ''),
            tags=data.get('tags', '')
        )
    
    def mark_completed(self) -> None:
        """
        Mark task as completed with current timestamp
        """
        self.status = Status.COMPLETED.value
        self.completion_date = datetime.now().isoformat()
        self.validate()
    
    def update_fields(self, **kwargs) -> None:
        """
        Update task fields and validate
        
        Args:
            **kwargs: Fields to update
        """
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        
        self.validate()
    
    def __str__(self) -> str:
        """String representation of task"""
        return f"Task(id={self.id}, task='{self.task}', status='{self.status}')"
    
    def __repr__(self) -> str:
        """Detailed string representation of task"""
        return (f"Task(id='{self.id}', task='{self.task}', priority='{self.priority}', "
                f"status='{self.status}', assignee='{self.assignee}')")


def generate_task_id() -> str:
    """
    Generate a unique task ID
    
    Returns:
        str: UUID string
    """
    return str(uuid.uuid4())


def format_datetime(dt: Optional[datetime] = None) -> str:
    """
    Format datetime to ISO string
    
    Args:
        dt: Datetime object (defaults to current time)
        
    Returns:
        str: ISO formatted datetime string
    """
    if dt is None:
        dt = datetime.now()
    return dt.isoformat()


def parse_datetime(date_string: str) -> Optional[datetime]:
    """
    Parse ISO datetime string
    
    Args:
        date_string: ISO formatted datetime string
        
    Returns:
        datetime: Parsed datetime object or None if invalid
    """
    if not date_string:
        return None
    
    try:
        if date_string.endswith('Z'):
            return datetime.fromisoformat(date_string[:-1])
        else:
            return datetime.fromisoformat(date_string.replace('Z', ''))
    except ValueError:
        return None