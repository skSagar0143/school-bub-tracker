
package com.bus.modules.livetracking.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.bus.modules.livetracking.entity.BusLocationEntity;

public interface BusLocationRepository extends JpaRepository<BusLocationEntity, Long> {

	// Get the latest GPS location of a trip.
	Optional<BusLocationEntity> findTopBySchoolIdAndTripIdOrderByRecordedAtDesc(Long schoolId, Long tripId);

	// Get recent GPS history for a trip.
	List<BusLocationEntity> findBySchoolIdAndTripIdOrderByRecordedAtDesc(Long schoolId, Long tripId, Pageable pageable);

	// Get recent GPS history for a particular bus.
	List<BusLocationEntity> findBySchoolIdAndBusIdOrderByRecordedAtDesc(Long schoolId, Long busId, Pageable pageable);
}
