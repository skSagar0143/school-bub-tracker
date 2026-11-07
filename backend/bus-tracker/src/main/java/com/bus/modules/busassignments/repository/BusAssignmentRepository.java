package com.bus.modules.busassignments.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.bus.modules.busassignments.entity.BusAssignmentEntity;

@Repository
public interface BusAssignmentRepository extends JpaRepository<BusAssignmentEntity, Long> {

    List<BusAssignmentEntity> findByStatusOrderByStartDateDesc(String status);

    List<BusAssignmentEntity> findByBusIdOrderByStartDateDesc(Long busId);

    List<BusAssignmentEntity> findByRouteIdOrderByStartDateDesc(Long routeId);

    @Query("""
        SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
        FROM BusAssignmentEntity a
        WHERE a.status = 'ACTIVE'
          AND a.busId = :busId
          AND (:excludeId IS NULL OR a.id <> :excludeId)
          AND (:endDate IS NULL OR a.startDate <= :endDate)
          AND (a.endDate IS NULL OR a.endDate >= :startDate)
        """)
    boolean existsOverlappingActiveAssignmentForBus(
        @Param("busId") Long busId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("excludeId") Long excludeId
    );

    @Query("""
        SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
        FROM BusAssignmentEntity a
        WHERE a.status = 'ACTIVE'
          AND a.routeId = :routeId
          AND (:excludeId IS NULL OR a.id <> :excludeId)
          AND (:endDate IS NULL OR a.startDate <= :endDate)
          AND (a.endDate IS NULL OR a.endDate >= :startDate)
        """)
    boolean existsOverlappingActiveAssignmentForRoute(
        @Param("routeId") Long routeId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("excludeId") Long excludeId
    );
}
