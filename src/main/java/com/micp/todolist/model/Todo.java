package com.micp.todolist.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;

@Entity
public class Todo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;   // 任務描述

    @Column(columnDefinition = "TEXT")
    private String comment;       // 任務筆記/評論

    @Column(name = "comment_updated_date")
    private LocalDateTime commentUpdatedDate; // 評論最後更新時間

    private boolean completed;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    private String priority;      // 低/中/高/緊急

    private LocalDateTime reminder; // 提醒時間

    @Column(name = "completed_date")
    private LocalDateTime completedDate; // 完成時間

    public Todo() {
        this.createdDate = LocalDateTime.now();
        this.dueDate = LocalDate.now(); // 默認當天截止
        this.priority = "low";          // 默認為低
    }

    public Todo(String title, boolean completed) {
        this.title = title;
        this.completed = completed;
        this.createdDate = LocalDateTime.now();
        this.dueDate = LocalDate.now();
        this.priority = "low";
        if (completed) {
            this.completedDate = LocalDateTime.now();
        }
    }

    public Todo(String title, boolean completed, LocalDate dueDate, String description, String priority, LocalDateTime reminder) {
        this.title = title;
        this.completed = completed;
        this.createdDate = LocalDateTime.now();
        this.dueDate = dueDate != null ? dueDate : LocalDate.now();
        this.description = description;
        this.priority = (priority != null) ? priority : "low";
        this.reminder = reminder;
        if (completed) {
            this.completedDate = LocalDateTime.now();
        }
    }

    // ===== Getters and Setters =====
    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
        // 當設置完成狀態時，更新完成時間
        if (completed && this.completedDate == null) {
            this.completedDate = LocalDateTime.now();
        } else if (!completed) {
            // 當任務變回未完成時，清空完成時間
            this.completedDate = null;
        }
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
        // 當設置評論時，自動更新評論時間
        if (comment != null && !comment.trim().isEmpty()) {
            this.commentUpdatedDate = LocalDateTime.now();
        } else {
            this.commentUpdatedDate = null;
        }
    }

    public LocalDateTime getCommentUpdatedDate() {
        return commentUpdatedDate;
    }

    public void setCommentUpdatedDate(LocalDateTime commentUpdatedDate) {
        this.commentUpdatedDate = commentUpdatedDate;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public LocalDateTime getReminder() {
        return reminder;
    }

    public void setReminder(LocalDateTime reminder) {
        this.reminder = reminder;
    }

    public LocalDateTime getCompletedDate() {
        return completedDate;
    }

    public void setCompletedDate(LocalDateTime completedDate) {
        this.completedDate = completedDate;
    }

    /**
     * 判斷任務是否過期
     * 過期條件：未完成 且 截止日期在今天之前
     */
    public boolean isOverdue() {
        if (completed || dueDate == null) {
            return false;
        }
        return dueDate.isBefore(LocalDate.now());
    }

    /**
     * 判斷任務是否是今天的
     * 今天任務條件：截止日期是今天 或 (截止日期在今天之前但已完成)
     */
    public boolean isDueToday() {
        if (dueDate == null) {
            return false;
        }
        // 如果是已完成的任務，則不算今天的任務（會被歸類到當月完成）
        if (completed) {
            return false;
        }
        return dueDate.equals(LocalDate.now());
    }

    /**
     * 判斷任務是否為當月完成
     * 當月完成條件：已完成 且 完成時間在當月
     */
    public boolean isCompletedThisMonth() {
        if (!completed || completedDate == null) {
            return false;
        }
        YearMonth currentMonth = YearMonth.now();
        YearMonth completedMonth = YearMonth.from(completedDate);
        return currentMonth.equals(completedMonth);
    }
}