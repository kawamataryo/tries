package com.example.demo.infrastructure.eventstore;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventStoreRepository extends JpaRepository<EventStoreEntity, Long> {
    List<EventStoreEntity> findByAggregateIdOrderByVersionAsc(UUID aggregateId);
}
