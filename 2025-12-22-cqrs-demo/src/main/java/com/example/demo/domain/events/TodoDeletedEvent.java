package com.example.demo.domain.events;

import java.util.UUID;

public class TodoDeletedEvent extends DomainEvent {
    public TodoDeletedEvent(UUID todoId, Long version) {
        super(todoId, version);
    }
    
}
