package com.bus.modules.trips.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bus.modules.trips.entity.TripEntity;

public interface TripRepository extends JpaRepository<TripEntity, Long> {
    boolean existsByBusAssignmentIdAndTripDateAndTripType(Long busAssignmentId, LocalDate tripDate, String tripType);
    List<TripEntity> findBySchoolIdAndTripDateOrderByScheduledStartTimeAsc(Long schoolId, LocalDate tripDate);
    List<TripEntity> findBySchoolIdOrderByTripDateDescScheduledStartTimeAsc(Long schoolId);
    Optional<TripEntity> findByIdAndSchoolId(Long id, Long schoolId);
}
