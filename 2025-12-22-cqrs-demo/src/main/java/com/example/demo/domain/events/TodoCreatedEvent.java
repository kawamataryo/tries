package com.example.demo.domain.events;

import java.util.UUID;

public class TodoCreatedEvent extends DomainEvent {
    private final String title;
    private final String description;

    public TodoCreatedEvent(UUID todoId, String title, String description, Long version) {
        // eventIdがtodoIdになる
        super(todoId, version);
        this.title = title;
        this.description = description;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }
}
