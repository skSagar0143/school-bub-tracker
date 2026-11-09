package com.bus.modules.trips.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bus.modules.trips.entity.TripScheduleEntity;

public interface TripScheduleRepository extends JpaRepository<TripScheduleEntity, Long> {

	List<TripScheduleEntity> findBySchoolIdAndStatusOrderByStartTimeAsc(Long schoolId, String status);

	List<TripScheduleEntity> findByBusAssignmentIdAndTripTypeAndStatus(Long busAssignmentId, String tripType,
			String status);
}