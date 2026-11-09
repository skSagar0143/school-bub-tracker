package com.bus.modules.tripschedules.service;

import java.util.List;

import com.bus.modules.tripschedules.dto.TripScheduleRequest;
import com.bus.modules.tripschedules.entity.TripScheduleEntity;

public interface TripScheduleService {

    TripScheduleEntity createSchedule(TripScheduleRequest request);

    TripScheduleEntity updateSchedule(Long id, TripScheduleRequest request);

    TripScheduleEntity getScheduleById(Long id);

    List<TripScheduleEntity> getSchedulesBySchool(Long schoolId);

    List<TripScheduleEntity> getSchedulesByBusAssignment(Long busAssignmentId);

    void deactivateSchedule(Long id);
}
