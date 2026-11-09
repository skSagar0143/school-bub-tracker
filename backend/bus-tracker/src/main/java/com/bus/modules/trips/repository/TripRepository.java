package com.bus.modules.trips.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bus.modules.trips.entity.TripEntity;

public interface TripRepository extends JpaRepository<TripEntity, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("""
            SELECT t
            FROM TripEntity t
            WHERE t.busAssignmentId = :busAssignmentId
              AND t.tripDate = :tripDate
              AND t.tripType = :tripType
            """)
    List<TripEntity> findExistingTripForUpdate(
            @org.springframework.data.repository.query.Param("busAssignmentId") Long busAssignmentId,
            @org.springframework.data.repository.query.Param("tripDate") LocalDate tripDate,
            @org.springframework.data.repository.query.Param("tripType") String tripType);
    List<TripEntity> findBySchoolIdAndTripDateOrderByScheduledStartTimeAsc(Long schoolId, LocalDate tripDate);
    List<TripEntity> findBySchoolIdOrderByTripDateDescScheduledStartTimeAsc(Long schoolId);
    Optional<TripEntity> findByIdAndSchoolId(Long id, Long schoolId);
}
