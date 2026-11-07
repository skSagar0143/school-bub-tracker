package com.bus.modules.driverassignments.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.bus.modules.driverassignments.entity.DriverAssignmentEntity;

@Repository
public interface DriverAssignmentRepository extends JpaRepository<DriverAssignmentEntity, Long> {

    List<DriverAssignmentEntity> findByStatusOrderByStartDateDesc(String status);

    List<DriverAssignmentEntity> findByBusIdOrderByStartDateDesc(Long busId);

    List<DriverAssignmentEntity> findByDriverIdOrderByStartDateDesc(Long driverId);

    @Query("""
        SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
        FROM DriverAssignmentEntity a
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
        FROM DriverAssignmentEntity a
        WHERE a.status = 'ACTIVE'
          AND a.driverId = :driverId
          AND (:excludeId IS NULL OR a.id <> :excludeId)
          AND (:endDate IS NULL OR a.startDate <= :endDate)
          AND (a.endDate IS NULL OR a.endDate >= :startDate)
        """)
    boolean existsOverlappingActiveAssignmentForDriver(
        @Param("driverId") Long driverId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("excludeId") Long excludeId
    );
}
