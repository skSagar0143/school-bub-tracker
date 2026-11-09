package com.bus.modules.trips.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bus.modules.trips.entity.TripStopEntity;

public interface TripStopRepository extends JpaRepository<TripStopEntity, Long> {
    List<TripStopEntity> findByTripIdOrderByStopOrderAsc(Long tripId);
    Optional<TripStopEntity> findByIdAndTripId(Long id, Long tripId);
}
