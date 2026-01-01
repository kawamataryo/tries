package com.example.demo.domain.events;

import java.time.Instant;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class TodoCompletedEvent extends DomainEvent {
    public TodoCompletedEvent(UUID todoId, Long version) {
        super(todoId, version);
    }

    @JsonCreator
    public TodoCompletedEvent(
            @JsonProperty("eventId") UUID eventId,
            @JsonProperty("aggregateId") UUID aggregateId,
            @JsonProperty("occurredAt") Instant occurredAt,
            @JsonProperty("version") long version) {
        super(eventId, aggregateId, occurredAt, version);
    }
}
