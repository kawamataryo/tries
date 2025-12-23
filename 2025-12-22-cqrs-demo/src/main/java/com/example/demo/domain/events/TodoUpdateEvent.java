package com.example.demo.domain.events;

import java.time.Instant;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class TodoUpdateEvent extends DomainEvent {
    private final String title;
    private final String description;

    public TodoUpdateEvent(UUID todoId, String title, String description, Long version) {
        super(todoId, version);
        this.title = title;
        this.description = description;
    }

    @JsonCreator
    public TodoUpdateEvent(
            @JsonProperty("eventId") UUID eventId,
            @JsonProperty("aggregateId") UUID aggregateId,
            @JsonProperty("occurredAt") Instant occurredAt,
            @JsonProperty("version") long version,
            @JsonProperty("title") String title,
            @JsonProperty("description") String description) {
        super(eventId, aggregateId, occurredAt, version);
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
