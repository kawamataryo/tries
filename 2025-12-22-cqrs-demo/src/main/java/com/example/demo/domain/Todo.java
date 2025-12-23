package com.example.demo.domain;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.example.demo.domain.events.DomainEvent;
import com.example.demo.domain.events.TodoCreatedEvent;
import com.example.demo.domain.events.TodoDeletedEvent;
import com.example.demo.domain.events.TodoCompletedEvent;

public class Todo {
    private UUID id;
    private String title;
    private String description;
    private boolean completed;
    private boolean deleted;
    private long version;
    private List<DomainEvent> uncommittedEvents = new ArrayList<>();

    private Todo() {}

    public static Todo fromEvents(List<DomainEvent> events) {
        Todo todo = new Todo();
        for (DomainEvent event : events) {
            todo.apply(event);
        }
        return todo;
    }

    public static Todo create(UUID id, String title, String description) {
        Todo todo = new Todo();
        todo.applyChange(new TodoCreatedEvent(id, title, description, 0L), true);
        return todo;
    }

    public void complete() {
        if (this.deleted) {
            throw new IllegalStateException("Cannot complete a deleted todo");
        }
        if (this.completed) {
            throw new IllegalStateException("Todo is already completed");
        }
        this.applyChange(new TodoCompletedEvent(this.id, this.version + 1), true);
    }

    public void delete() {
        if (this.deleted) {
            throw new IllegalStateException("Todo is already deleted");
        }
        this.applyChange(new TodoDeletedEvent(this.id, this.version + 1), true);
    }

    private void apply(DomainEvent event) {
        switch (event) {
            case TodoCreatedEvent e:
                this.id = e.getAggregateId();
                this.title = e.getTitle();
                this.description = e.getDescription();
                this.completed = false;
                this.deleted = false;
                this.version = e.getVersion();
                break;
            case TodoCompletedEvent e:
                this.completed = true;
                this.version = e.getVersion();
                break;
            case TodoDeletedEvent e:
                this.deleted = true;
                this.version = e.getVersion();
                break;
            default:
                throw new IllegalStateException("Unknown event type: " + event.getClass().getName());
        }
    }

    private void applyChange(DomainEvent event, boolean isNew) {
        this.apply(event);
        if (isNew) {
            this.uncommittedEvents.add(event);
        }
    }

    public List<DomainEvent> getUncommittedEvents() {
        return new ArrayList<>(this.uncommittedEvents);
    }

    public void clearUncommittedEvents() {
        this.uncommittedEvents.clear();
    }

    public UUID getId() {
        return this.id;
    }

    public String getTitle() {
        return this.title;
    }

    public String getDescription() {
        return this.description;
    }

    public boolean isCompleted() {
        return this.completed;
    }

    public boolean isDeleted() {
        return this.deleted;
    }

    public long getVersion() {
        return this.version;
    }
}
