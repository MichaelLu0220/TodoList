// ===== 任務詳情彈窗模組 =====
console.log("Loaded task-modal.js @", new Date().toISOString());

const TaskModal = (() => {

    /**
     * 顯示任務詳情
     */
    function showTaskDetails(task) {
        const modal = createModal(task);
        document.body.appendChild(modal);

        // 設置描述和評論功能
        DescriptionEditor.setup(task);
        CommentEditor.setup(task);

        // 設置其他事件監聽器
        setupModalEventListeners(modal, task);
    }

    /**
     * 創建模態框
     */
    function createModal(task) {
        const modal = document.createElement('div');
        modal.className = 'task-modal';

        const priorityInfo = Utils.getPriorityDisplay(task.priority);
        const completedDateText = task.completedDate
            ? Utils.formatDate(task.completedDate, DATE_CONFIG.completedOptions)
            : '—';

        // 生成描述和評論區域 HTML
        const descriptionSectionHTML = generateDescriptionSectionHTML(task);
        const commentSectionHTML = generateCommentSectionHTML(task);

        modal.innerHTML = `
        <div class="task-modal-content two-column">
            <span class="close-btn">&times;</span>
            <div class="task-left">
                <h2 id="taskTitle">${task.title}</h2>

                <!-- 描述區域 -->
                <div class="description-section">
                    <div id="descriptionContainer" data-task-id="${task.id}">
                        ${descriptionSectionHTML}
                    </div>
                </div>

                <div class="sub-task-placeholder">+ Add sub-task</div>

                <!-- 評論區域 -->
                <div class="comment-section">
                    <div class="comment-header">
                        <strong>Notes</strong>
                        <span class="comment-status" id="commentStatus"></span>
                    </div>
                    <div id="commentContainer" data-task-id="${task.id}">
                        ${commentSectionHTML}
                    </div>
                </div>
            </div>
            <div class="task-right">
                <div class="detail-item">
                    <strong>Due Date:</strong>
                    <span id="dueDateDisplay">${task.dueDate || '—'}</span>
                    ${DEVELOPER_MODE ? `<button id="editDateBtn" class="edit-small-btn">✏️</button>` : ''}
                </div>
                ${DEVELOPER_MODE ? `
                <div id="dateEditSection" class="hidden" style="margin-top: 8px;">
                    <input type="date" id="editDueDate" value="${task.dueDate || ''}" class="edit-date-input">
                    <div style="margin-top: 5px;">
                        <button id="saveDateBtn" class="save-small-btn">保存</button>
                        <button id="cancelDateBtn" class="cancel-small-btn">取消</button>
                    </div>
                </div>
                ` : ''}

                <div class="detail-item">
                    <strong>Priority:</strong>
                    <span style="color: ${priorityInfo.color};">
                        ${priorityInfo.emoji} ${priorityInfo.name}
                    </span>
                </div>
                <div class="detail-item"><strong>Reminder:</strong> ${task.reminder || '—'}</div>
                <div class="detail-item"><strong>Status:</strong> ${task.completed ? '✅ 已完成' : '⏳ 進行中'}</div>
                ${task.completed ? `<div class="detail-item"><strong>Completed:</strong> ${completedDateText}</div>` : ''}
                <div class="detail-item"><strong>Labels:</strong> (none)</div>

                ${task.completed ? `
                    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
                        <button id="resetTaskBtn" class="reset-btn">Reset to Incomplete</button>
                    </div>
                ` : ''}

                <!-- 開發者模式提示 -->
                ${DEVELOPER_MODE ? `
                <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #f0f0f0;">
                    <small style="color: #999; font-size: 11px;">💡 開發者模式：可編輯日期用於測試</small>
                </div>
                ` : ''}
            </div>
        </div>
    `;

        return modal;
    }

    /**
     * 設置模態框事件監聽器
     */
    function setupModalEventListeners(modal, task) {
        // 關閉按鈕
        modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());

        // 點擊模態框背景關閉
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Reset 按鈕事件監聽器
        if (task.completed) {
            const resetBtn = modal.querySelector('#resetTaskBtn');
            if (resetBtn) {
                resetBtn.addEventListener('click', async () => {
                    await resetTaskToIncomplete(task.id);
                    modal.remove();
                });
            }
        }

        // 開發者模式日期編輯功能
        if (DEVELOPER_MODE) {
            setupDateEditHandlers(task, modal);
        }
    }

    /**
     * 重置任務為未完成狀態
     */
    async function resetTaskToIncomplete(id) {
        try {
            await API.resetTaskToIncomplete(id);
            await TodoApp.loadTasks();
        } catch (error) {
            console.error('重置任務失敗:', error);
            alert('重置任務失敗，請重試');
        }
    }

    /**
     * 設置日期編輯處理器（開發者模式）
     */
    function setupDateEditHandlers(task, modal) {
        const editDateBtn = modal.querySelector('#editDateBtn');
        const dateEditSection = modal.querySelector('#dateEditSection');
        const dueDateDisplay = modal.querySelector('#dueDateDisplay');
        const editDueDate = modal.querySelector('#editDueDate');
        const saveDateBtn = modal.querySelector('#saveDateBtn');
        const cancelDateBtn = modal.querySelector('#cancelDateBtn');

        if (!editDateBtn) return;

        let originalDate = task.dueDate;

        // 點擊編輯按鈕
        editDateBtn.addEventListener('click', () => {
            dueDateDisplay.style.display = 'none';
            editDateBtn.style.display = 'none';
            dateEditSection.classList.remove('hidden');
            editDueDate.focus();
        });

        // 取消編輯
        cancelDateBtn.addEventListener('click', () => {
            editDueDate.value = originalDate || '';
            hideEditSection();
        });

        // 保存日期
        saveDateBtn.addEventListener('click', async () => {
            const newDate = editDueDate.value;
            if (newDate !== originalDate) {
                try {
                    await API.updateTaskDate(task.id, newDate);
                    modal.remove();
                    await TodoApp.loadTasks();
                } catch (error) {
                    console.error('更新日期失敗:', error);
                    alert('更新日期失敗，請重試');
                }
            } else {
                hideEditSection();
            }
        });

        // 按 Enter 保存，按 Escape 取消
        editDueDate.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveDateBtn.click();
            } else if (e.key === 'Escape') {
                cancelDateBtn.click();
            }
        });

        function hideEditSection() {
            dueDateDisplay.style.display = 'inline';
            editDateBtn.style.display = 'inline';
            dateEditSection.classList.add('hidden');
        }
    }

    /**
     * 生成描述區域 HTML
     */
    function generateDescriptionSectionHTML(task) {
        const hasDescription = task.description && task.description.trim() !== '';

        if (hasDescription) {
            return `
                <div class="description-display" id="descriptionDisplay">
                    <div class="description-text">${Utils.escapeHtml(task.description)}</div>
                </div>
            `;
        } else {
            return `
                <div class="description-empty" id="descriptionEmpty">
                    <div class="add-description-text">📝 添加描述</div>
                    <div class="add-description-hint">點擊添加任務詳細說明...</div>
                </div>
            `;
        }
    }

    /**
     * 生成評論區域 HTML
     */
    function generateCommentSectionHTML(task) {
        const hasComment = task.comment && task.comment.trim() !== '';

        if (hasComment) {
            const commentUpdatedDate = task.commentUpdatedDate
                ? new Date(task.commentUpdatedDate).toLocaleString('zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                })
                : '未知時間';

            return `
                <div class="comment-display" id="commentDisplay">
                    <div class="comment-text">${Utils.escapeHtml(task.comment)}</div>
                    <div class="comment-meta">
                        <span class="comment-timestamp">更新於 ${commentUpdatedDate}</span>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="comment-empty" id="commentEmpty">
                    <div class="add-comment-text">📝 添加筆記</div>
                    <div class="add-comment-hint">點擊開始記錄想法...</div>
                </div>
            `;
        }
    }

    // 返回公開方法
    return {
        showTaskDetails,
        createModal,
        setupModalEventListeners,
        resetTaskToIncomplete,
        generateDescriptionSectionHTML,
        generateCommentSectionHTML
    };
})();

// 全域匯出
window.TaskModal = TaskModal;