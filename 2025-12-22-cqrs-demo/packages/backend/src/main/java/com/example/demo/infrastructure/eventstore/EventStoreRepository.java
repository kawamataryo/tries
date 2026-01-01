package com.example.demo.infrastructure.eventstore;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EventStoreRepository extends JpaRepository<EventStoreEntity, Long> {
    // 集約IDでイベントを取得
    List<EventStoreEntity> findByAggregateIdOrderByVersionAsc(UUID aggregateId);

    // 集約IDで最新バージョンを取得
    @org.springframework.data.jpa.repository.Query("SELECT MAX(e.version) FROM EventStoreEntity e WHERE e.aggregateId = :aggregateId")
    Optional<Long> findMaxVersionByAggregateId(@Param("aggregateId") UUID aggregateId);
}
