package com.micp.todolist.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
public class Todo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;   // 任務描述

    private boolean completed;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    private String priority;      // 低/中/高/緊急

    private LocalDateTime reminder; // 提醒時間

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
    }

    public Todo(String title, boolean completed, LocalDate dueDate, String description, String priority, LocalDateTime reminder) {
        this.title = title;
        this.completed = completed;
        this.createdDate = LocalDateTime.now();
        this.dueDate = dueDate != null ? dueDate : LocalDate.now();
        this.description = description;
        this.priority = (priority != null) ? priority : "low";
        this.reminder = reminder;
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
        return dueDate.equals(LocalDate.now()) ||
                (dueDate.isBefore(LocalDate.now()) && completed);
    }
}
