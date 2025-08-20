console.log("Loaded todo.js @", new Date().toISOString());
const TodoApp = (() => {
    const API_URL = '/api/todos';

    const overdueTasksEl = document.getElementById('overdueTasks');
    const todayTasksEl = document.getElementById('todayTasks');
    const taskCountEl = document.getElementById('taskCount');
    const todayLabelEl = document.getElementById('todayLabel');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const addTaskForm = document.getElementById('addTaskForm');
    const taskTitleInput = document.getElementById('taskTitleInput');
    const taskDescInput = document.getElementById('taskDescInput');
    const cancelTaskBtn = document.getElementById('cancelTaskBtn');
    const submitTaskBtn = document.getElementById('submitTaskBtn');

    // 新增欄位
    const dateSelect = document.getElementById('dateSelect');
    const customDateInput = document.getElementById('customDateInput');
    const prioritySelect = document.getElementById('prioritySelect');
    const reminderSelect = document.getElementById('reminderSelect');
    const customReminderInput = document.getElementById('customReminderInput');

    function init() {
        todayLabelEl.textContent = new Date().toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', weekday: 'long'
        });
        loadTasks();
        setupAddTaskInput();
        setupSelectHandlers();
    }

    function setupSelectHandlers() {
        // 日期選擇
        dateSelect.addEventListener('change', () => {
            if (dateSelect.value === 'custom') {
                customDateInput.classList.remove('hidden');
            } else {
                customDateInput.classList.add('hidden');
            }
        });

        // Reminder 選擇
        reminderSelect.addEventListener('change', () => {
            if (reminderSelect.value === 'custom') {
                customReminderInput.classList.remove('hidden');
            } else {
                customReminderInput.classList.add('hidden');
            }
        });
    }

    function setupAddTaskInput() {
        addTaskBtn.addEventListener('click', () => {
            addTaskBtn.style.display = 'none';
            addTaskForm.classList.remove('hidden');
            taskTitleInput.focus();
        });

        cancelTaskBtn.addEventListener('click', () => {
            resetAddTaskForm();
        });

        submitTaskBtn.addEventListener('click', () => {
            const title = taskTitleInput.value.trim();
            const description = taskDescInput.value.trim();

            // 日期計算
            let dueDate = null;
            if (dateSelect.value === 'today') {
                dueDate = new Date().toISOString().split('T')[0];
            } else if (dateSelect.value === 'tomorrow') {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                dueDate = d.toISOString().split('T')[0];
            } else if (dateSelect.value === 'custom' && customDateInput.value) {
                dueDate = customDateInput.value;
            }

            // Reminder
            let reminder = '';
            if (reminderSelect.value === '1h') {
                const d = new Date();
                d.setHours(d.getHours() + 1);
                reminder = d.toISOString();
            } else if (reminderSelect.value === 'tomorrow9') {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                d.setHours(9, 0, 0, 0);
                reminder = d.toISOString();
            } else if (reminderSelect.value === 'custom' && customReminderInput.value) {
                const d = new Date();
                const [hh, mm] = customReminderInput.value.split(':');
                d.setHours(hh, mm, 0, 0);
                reminder = d.toISOString();
            }

            if (title) {
                addTask(title, description, dueDate, prioritySelect.value, reminder);
            }
        });
    }

    async function loadTasks() {
        const res = await fetch(API_URL);
        const tasks = await res.json();

        const overdue = sortTasksByPriority(tasks.filter(t => t.overdue));
        const today = sortTasksByPriority(tasks.filter(t => !t.overdue));

        renderTasks(overdueTasksEl, overdue);
        renderTasks(todayTasksEl, today);

        taskCountEl.textContent = `${tasks.length} tasks`;
    }

    function sortTasksByPriority(tasks) {
        const order = { high: 1, medium: 2, normal: 4 };
        return tasks.sort((a, b) => (order[a.priority] || 99) - (order[b.priority] || 99));
    }

    function renderTasks(container, tasks) {
        container.innerHTML = '';
        tasks.forEach(task => {
            const div = document.createElement('div');

            // 构建任务的 CSS 类名
            let taskClasses = 'task';
            if (task.completed) {
                taskClasses += ' completed';
            }
            if (task.priority) {
                taskClasses += ` priority-${task.priority}`;
            }

            div.className = taskClasses;

            // 获取优先级的视觉提示文字 (用于tooltip)
            const getPriorityText = (priority) => {
                const priorityMap = {
                    'normal': '普通',
                    'medium': '優先',
                    'high': '緊急'
                };
                return priorityMap[priority] || '';
            };

            // 方案1: 只使用颜色条纹 (推荐)
            div.innerHTML = `
                <input type="checkbox" ${task.completed ? 'checked' : ''}
                    onchange="TodoApp.toggleTask(${task.id})">
                <span>${task.title}</span>
                <small style="margin-left:auto; color:#888;" title="${getPriorityText(task.priority)}">
                    ${task.dueDate || ''}
                </small>
            `;

            // 方案2: 如果你想要小圆点图标，使用这个版本
            /*
            div.innerHTML = `
                <input type="checkbox" ${task.completed ? 'checked' : ''}
                    onchange="TodoApp.toggleTask(${task.id})">
                ${task.priority ? `<div class="priority-icon ${task.priority}" title="${getPriorityText(task.priority)}"></div>` : ''}
                <span>${task.title}</span>
                <small style="margin-left:auto; color:#888;">
                    ${task.dueDate || ''}
                </small>
            `;
            */

            // 为任务添加点击事件
            div.addEventListener('click', (e) => {
                if (e.target.tagName.toLowerCase() !== 'input') {
                    showTaskDetails(task);
                }
            });

            container.appendChild(div);
        });
    }

    function showTaskDetails(task) {
        const modal = document.createElement('div');
        modal.className = 'task-modal';

        modal.innerHTML = `
        <div class="task-modal-content two-column">
            <span class="close-btn">&times;</span>
            <div class="task-left">
                <h2 id="taskTitle">${task.title}</h2>
                <p class="task-desc">${task.description || 'No description'}</p>
                <div class="sub-task-placeholder">+ Add sub-task</div>
                <div class="comment-box">
                    <textarea placeholder="Comment"></textarea>
                </div>
            </div>
            <div class="task-right">
                <div class="detail-item"><strong>Date:</strong> ${task.dueDate || '—'}</div>
                <div class="detail-item"><strong>Priority:</strong> ${task.priority || '—'}</div>
                <div class="detail-item"><strong>Reminder:</strong> ${task.reminder || '—'}</div>
                <div class="detail-item"><strong>Labels:</strong> (none)</div>
            </div>
        </div>
    `;
        document.body.appendChild(modal);

        modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());
    }

    // ===== 优化后的 showTaskDetails 函数 (可选) =====
    function showTaskDetails(task) {
        const modal = document.createElement('div');
        modal.className = 'task-modal';

        // 获取优先级的显示名称和颜色
        const getPriorityDisplay = (priority) => {
            const priorityMap = {
                'normal': { name: '普通', color: '#4CAF50', emoji: '🟢' },
                'medium': { name: '優先', color: '#FF9800', emoji: '🟡' },
                'high': { name: '緊急', color: '#FF5722', emoji: '🟠' }
            };
            return priorityMap[priority] || { name: '未设置', color: '#999', emoji: '⚪' };
        };

        const priorityInfo = getPriorityDisplay(task.priority);

        modal.innerHTML = `
            <div class="task-modal-content two-column">
                <span class="close-btn">&times;</span>
                <div class="task-left">
                    <h2 id="taskTitle">${task.title}</h2>
                    <p class="task-desc">${task.description || 'No description'}</p>
                    <div class="sub-task-placeholder">+ Add sub-task</div>
                    <div class="comment-box">
                        <textarea placeholder="Comment"></textarea>
                    </div>
                </div>
                <div class="task-right">
                    <div class="detail-item"><strong>Date:</strong> ${task.dueDate || '—'}</div>
                    <div class="detail-item">
                        <strong>Priority:</strong>
                        <span style="color: ${priorityInfo.color};">
                            ${priorityInfo.emoji} ${priorityInfo.name}
                        </span>
                    </div>
                    <div class="detail-item"><strong>Reminder:</strong> ${task.reminder || '—'}</div>
                    <div class="detail-item"><strong>Labels:</strong> (none)</div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());
    }

    async function saveTaskEdit(task, modal) {
        await fetch(`${API_URL}/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        modal.remove();
        loadTasks();
    }

    async function toggleTask(id) {
        await fetch(`${API_URL}/${id}`, { method: 'PATCH' });
        loadTasks();
    }

    async function addTask(title, description, dueDate, priority, reminder) {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, dueDate, priority, reminder })
        });
        resetAddTaskForm();
        loadTasks();
    }

    function resetAddTaskForm() {
        taskTitleInput.value = '';
        taskDescInput.value = '';
        customDateInput.value = '';
        customReminderInput.value = '';

        // 回歸預設值
        dateSelect.value = 'today';
        customDateInput.classList.add('hidden');
        prioritySelect.value = 'normal';
        reminderSelect.value = '';
        customReminderInput.classList.add('hidden');

        addTaskForm.classList.add('hidden');
        addTaskBtn.style.display = 'block';
    }

    return { init, toggleTask };
})();

document.addEventListener('DOMContentLoaded', TodoApp.init);
