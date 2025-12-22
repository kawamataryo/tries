package com.example.demo.domain.events;

import java.time.Instant;
import java.util.UUID;

// イベントの基底クラス
public abstract class DomainEvent {
    private final UUID eventId;
    private final UUID aggregateId;
    private final Instant occurredAt;
    private final long version;

    protected DomainEvent(UUID aggregateId, long version) {
        this.aggregateId = aggregateId;
        this.version = version;
        this.eventId = UUID.randomUUID();
        this.occurredAt = Instant.now();
    }

    public UUID getEventId() {
        return eventId;
    }

    public UUID getAggregateId() {
        return aggregateId;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }

    public long getVersion() {
        return version;
    }
}
