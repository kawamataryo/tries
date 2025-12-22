package com.example.demo.infrastructure.eventstore;

import java.util.List;
import java.util.UUID;

import com.example.demo.domain.events.DomainEvent;

public interface EventStore {
    void save(List<DomainEvent> events);
    List<DomainEvent> getEvents(UUID aggregateId);
}
