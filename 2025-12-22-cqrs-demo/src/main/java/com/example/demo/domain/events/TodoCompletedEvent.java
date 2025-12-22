package com.example.demo.domain.events;

import java.util.UUID;

public class TodoCompletedEvent extends DomainEvent {
    public TodoCompletedEvent(UUID todoId, Long version) {
        super(todoId, version);
    }
}
