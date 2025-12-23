package com.example.demo.infrastructure.readmodel;

import java.util.UUID;

import jakarta.persistence.*;

@Entity
@Table(name = "todo_read_model")
public class TodoReadModel {
    @Id
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private boolean completed;

    @Column(nullable = false)
    private boolean deleted;

    protected TodoReadModel() {}

    public TodoReadModel(UUID id, String title, String description, boolean completed, boolean deleted) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.completed = completed;
        this.deleted = deleted;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }
}
