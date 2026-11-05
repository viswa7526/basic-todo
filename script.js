const taskInput = document.getElementById('taskInput');
const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const progressSummary = document.getElementById('progressSummary');
const progressTrack = document.getElementById('progressTrack');
const progressBar = document.getElementById('progressBar');
const progressValue = document.getElementById('progressValue');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const filterButtons = document.querySelectorAll('.filter-btn');
const STORAGE_KEY = 'myTasks';
let currentFilter = 'all';

function loadTasks() {
    try {
        const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!Array.isArray(savedTasks)) return [];

        return savedTasks.filter((task) =>
            task &&
            typeof task.text === 'string' &&
            typeof task.completed === 'boolean'
        );
    } catch (error) {
        console.warn('Failed to read saved tasks:', error);
        return [];
    }
}

let tasks = loadTasks();

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.warn('Failed to save tasks:', error);
    }
}

function createIcon(pathMarkup) {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '1.8');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.setAttribute('aria-hidden', 'true');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathMarkup);
    icon.appendChild(path);
    return icon;
}

function renderEmptyState() {
    const emptyState = document.createElement('li');
    emptyState.className = 'empty-state';

    const iconWrap = document.createElement('span');
    iconWrap.className = 'empty-icon';
    iconWrap.appendChild(createIcon('M9 11l2 2 4-4M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z'));

    const title = document.createElement('p');
    title.className = 'empty-title';
    const message = document.createElement('p');
    message.className = 'empty-message';

    if (tasks.length === 0) {
        title.textContent = 'Your list is clear';
        message.textContent = 'Add a task above to get started.';
    } else if (currentFilter === 'active') {
        title.textContent = 'All caught up';
        message.textContent = 'You have no active tasks right now.';
    } else {
        title.textContent = 'Nothing completed just yet';
        message.textContent = 'Completed tasks will show up here.';
    }

    emptyState.append(iconWrap, title, message);
    taskList.appendChild(emptyState);
}

function renderTasks() {
    taskList.replaceChildren();

    const visibleTasks = tasks
        .map((task, index) => ({ task, index }))
        .filter(({ task }) => {
            if (currentFilter === 'active') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true;
        });

    if (visibleTasks.length === 0) {
        renderEmptyState();
    } else {
        visibleTasks.forEach(({ task, index }) => {
            const item = document.createElement('li');
            item.className = 'task-item';
            item.dataset.index = index;
            if (task.completed) item.classList.add('completed');

            const checkbox = document.createElement('input');
            checkbox.className = 'task-check';
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'active' : 'completed'}`);

            const text = document.createElement('span');
            text.className = 'task-text';
            text.textContent = task.text;

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn';
            deleteButton.type = 'button';
            deleteButton.setAttribute('aria-label', `Delete "${task.text}"`);
            deleteButton.appendChild(createIcon('M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6'));

            item.append(checkbox, text, deleteButton);
            taskList.appendChild(item);
        });
    }

    const completedCount = tasks.filter((task) => task.completed).length;
    const remainingCount = tasks.length - completedCount;
    const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

    taskCount.textContent = `${remainingCount} ${remainingCount === 1 ? 'task' : 'tasks'} left`;
    progressSummary.textContent = tasks.length === 0
        ? 'No tasks yet'
        : `${completedCount} of ${tasks.length} completed`;
    progressBar.style.width = `${progress}%`;
    progressValue.textContent = `${progress}%`;
    progressTrack.setAttribute('aria-valuenow', progress);
    clearCompletedBtn.hidden = completedCount === 0;

    saveTasks();
}

taskForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = taskInput.value.trim();
    if (!text) {
        taskInput.focus();
        return;
    }

    tasks.push({ text, completed: false });
    taskInput.value = '';
    currentFilter = 'all';
    filterButtons.forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.filter === currentFilter));
    });
    renderTasks();
    taskInput.focus();
});

filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
        currentFilter = button.dataset.filter;
        filterButtons.forEach((filterButton) => {
            filterButton.setAttribute('aria-pressed', String(filterButton === button));
        });
        renderTasks();
    });
});

taskList.addEventListener('change', (event) => {
    if (!event.target.matches('.task-check')) return;
    const item = event.target.closest('.task-item');
    const task = tasks[Number(item.dataset.index)];
    if (!task) return;
    task.completed = event.target.checked;
    renderTasks();
});

taskList.addEventListener('click', (event) => {
    const deleteButton = event.target.closest('.delete-btn');
    if (!deleteButton) return;
    const item = deleteButton.closest('.task-item');
    tasks.splice(Number(item.dataset.index), 1);
    renderTasks();
});

clearCompletedBtn.addEventListener('click', () => {
    tasks = tasks.filter((task) => !task.completed);
    renderTasks();
});

renderTasks();
