package com.bus.modules.tripschedules.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.bus.modules.tripschedules.entity.TripScheduleEntity;

@Repository
public interface TripScheduleRepository extends JpaRepository<TripScheduleEntity, Long> {

    List<TripScheduleEntity> findBySchoolIdOrderByStartTimeAsc(Long schoolId);

    List<TripScheduleEntity> findByBusAssignmentIdOrderByStartTimeAsc(Long busAssignmentId);

    List<TripScheduleEntity> findBySchoolIdAndStatusOrderByStartTimeAsc(Long schoolId, String status);
}
