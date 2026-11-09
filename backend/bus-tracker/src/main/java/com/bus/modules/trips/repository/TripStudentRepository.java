package com.bus.modules.trips.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bus.modules.trips.entity.TripStudentEntity;

public interface TripStudentRepository extends JpaRepository<TripStudentEntity, Long> {
    List<TripStudentEntity> findByTripIdOrderByStopNameAscStudentNameAsc(Long tripId);
    Optional<TripStudentEntity> findByIdAndTripId(Long id, Long tripId);
}
