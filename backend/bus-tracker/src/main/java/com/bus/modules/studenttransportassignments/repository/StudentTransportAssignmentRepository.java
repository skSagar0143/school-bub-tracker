package com.bus.modules.studenttransportassignments.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.bus.modules.studenttransportassignments.entity.StudentTransportAssignmentEntity;

public interface StudentTransportAssignmentRepository
        extends JpaRepository<StudentTransportAssignmentEntity, Long> {

    List<StudentTransportAssignmentEntity> findByStatusOrderByStartDateDesc(String status);

    List<StudentTransportAssignmentEntity> findByStudentIdOrderByStartDateDesc(Long studentId);

    List<StudentTransportAssignmentEntity> findByRouteIdOrderByStartDateDesc(Long routeId);

    @Query("""
            SELECT COUNT(a)
            FROM StudentTransportAssignmentEntity a
            WHERE a.status = 'ACTIVE'
              AND a.morningBusAssignmentId = :busAssignmentId
              AND (:excludeId IS NULL OR a.id <> :excludeId)
              AND (:endDate IS NULL OR a.startDate <= :endDate)
              AND (a.endDate IS NULL OR a.endDate >= :startDate)
            """)
    long countMorningOccupancy(
            @Param("busAssignmentId") Long busAssignmentId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeId") Long excludeId);

    @Query("""
            SELECT COUNT(a)
            FROM StudentTransportAssignmentEntity a
            WHERE a.status = 'ACTIVE'
              AND a.afternoonBusAssignmentId = :busAssignmentId
              AND (:excludeId IS NULL OR a.id <> :excludeId)
              AND (:endDate IS NULL OR a.startDate <= :endDate)
              AND (a.endDate IS NULL OR a.endDate >= :startDate)
            """)
    long countAfternoonOccupancy(
            @Param("busAssignmentId") Long busAssignmentId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeId") Long excludeId);

    @Query("""
            SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
            FROM StudentTransportAssignmentEntity a
            WHERE a.studentId = :studentId
              AND a.status = 'ACTIVE'
              AND (:excludeId IS NULL OR a.id <> :excludeId)
              AND (:endDate IS NULL OR a.startDate <= :endDate)
              AND (a.endDate IS NULL OR a.endDate >= :startDate)
            """)
    boolean existsOverlappingActiveAssignment(
            @Param("studentId") Long studentId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeId") Long excludeId);
}