let tasks = [];
let taskIdCounter = 1;
let currentFilter = 'all';

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadTasks();
    updateStats();
    displayTasks();
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('taskDate').value = today;
    
    // Add enter key listener for task input
    document.getElementById('taskInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });
});

function addTask() {
    const taskInput = document.getElementById('taskInput');
    const taskDate = document.getElementById('taskDate');
    const taskTime = document.getElementById('taskTime');
    
    const taskText = taskInput.value.trim();
    
    if (!taskText) {
        taskInput.focus();
        return;
    }
    
    const task = {
        id: taskIdCounter++,
        text: taskText,
        completed: false,
        date: taskDate.value,
        time: taskTime.value,
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(task);
    
    // Clear inputs
    taskInput.value = '';
    taskTime.value = '';
    
    // Keep today's date selected
    const today = new Date().toISOString().split('T')[0];
    taskDate.value = today;
    
    saveTasks();
    updateStats();
    displayTasks();
    taskInput.focus();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        updateStats();
        displayTasks();
    }
}

function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        updateStats();
        displayTasks();
    }
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const taskElement = document.querySelector(`[data-task-id="${id}"]`);
    const existingForm = taskElement.querySelector('.edit-form');
    
    if (existingForm) {
        existingForm.remove();
        return;
    }
    
    const editForm = document.createElement('div');
    editForm.className = 'edit-form';
    editForm.innerHTML = `
        <input type="text" class="edit-input" value="${task.text}" maxlength="200">
        <div class="edit-datetime-group">
            <input type="date" class="edit-datetime-input" value="${task.date}">
            <input type="time" class="edit-datetime-input" value="${task.time}">
        </div>
        <button class="action-btn save-btn" onclick="saveEdit(${id})">Save</button>
        <button class="action-btn cancel-btn" onclick="cancelEdit(${id})">Cancel</button>
    `;
    
    taskElement.appendChild(editForm);
    editForm.querySelector('.edit-input').focus();
}

function saveEdit(id) {
    const task = tasks.find(t => t.id === id);
    const taskElement = document.querySelector(`[data-task-id="${id}"]`);
    const editForm = taskElement.querySelector('.edit-form');
    
    const newText = editForm.querySelector('.edit-input').value.trim();
    const newDate = editForm.querySelector('.edit-datetime-input').value;
    const newTime = editForm.querySelectorAll('.edit-datetime-input')[1].value;
    
    if (!newText) return;
    
    task.text = newText;
    task.date = newDate;
    task.time = newTime;
    
    saveTasks();
    displayTasks();
}

function cancelEdit(id) {
    const taskElement = document.querySelector(`[data-task-id="${id}"]`);
    const editForm = taskElement.querySelector('.edit-form');
    if (editForm) {
        editForm.remove();
    }
}

function filterTasks(filter) {
    currentFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    displayTasks();
}

function getFilteredTasks() {
    const today = new Date().toISOString().split('T')[0];
    
    switch (currentFilter) {
        case 'pending':
            return tasks.filter(task => !task.completed);
        case 'completed':
            return tasks.filter(task => task.completed);
        case 'today':
            return tasks.filter(task => task.date === today);
        case 'overdue':
            return tasks.filter(task => {
                if (task.completed) return false;
                if (!task.date) return false;
                return task.date < today;
            });
        default:
            return tasks;
    }
}

function displayTasks() {
    const tasksList = document.getElementById('tasksList');
    const filteredTasks = getFilteredTasks();
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>No tasks found</h3>
                <p>${getEmptyStateMessage()}</p>
            </div>
        `;
        return;
    }
    
    tasksList.innerHTML = filteredTasks.map(task => createTaskHTML(task)).join('');
}

function getEmptyStateMessage() {
    switch (currentFilter) {
        case 'pending':
            return 'All tasks are completed! 🎉';
        case 'completed':
            return 'No completed tasks yet.';
        case 'today':
            return 'No tasks scheduled for today.';
        case 'overdue':
            return 'No overdue tasks! You\'re up to date! ✅';
        default:
            return 'Add your first task above to get started!';
    }
}

function createTaskHTML(task) {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = task.date && task.date < today && !task.completed;
    const isToday = task.date === today;
    
    return `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
            <div class="task-header">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(${task.id})">
                    ${task.completed ? '✓' : ''}
                </div>
                <div class="task-text">${task.text}</div>
                <div class="task-actions">
                    <button class="action-btn edit-btn" onclick="editTask(${task.id})">Edit</button>
                    <button class="action-btn delete-btn" onclick="deleteTask(${task.id})">Delete</button>
                </div>
            </div>
            ${(task.date || task.time) ? `
                <div class="task-datetime">
                    ${task.date ? `<span class="datetime-badge ${isOverdue ? 'overdue' : isToday ? 'today' : ''}">📅 ${formatDate(task.date)}</span>` : ''}
                    ${task.time ? `<span class="datetime-badge">🕐 ${formatTime(task.time)}</span>` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const taskDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (taskDateOnly.getTime() === dateOnly.getTime()) {
        return 'Today';
    } else if (taskDateOnly.getTime() === tomorrowOnly.getTime()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
    }
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour12 = hours % 12 || 12;
    const ampm = hours < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${ampm}`;
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    
    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
}

function saveTasks() {
    const tasksData = JSON.stringify(tasks);
    // Store in memory instead of localStorage
    window.tasksData = tasksData;
}

function loadTasks() {
    try {
        // Load from memory instead of localStorage
        if (window.tasksData) {
            tasks = JSON.parse(window.tasksData);
            taskIdCounter = Math.max(...tasks.map(t => t.id), 0) + 1;
        }
    } catch (error) {
        console.log('No saved tasks found
