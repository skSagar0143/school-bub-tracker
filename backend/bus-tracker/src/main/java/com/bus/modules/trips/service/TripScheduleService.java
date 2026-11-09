package com.bus.modules.trips.service;

import java.util.List;

import com.bus.modules.trips.dto.TripScheduleRequest;
import com.bus.modules.trips.dto.TripScheduleResponse;

public interface TripScheduleService {

	TripScheduleResponse createSchedule(TripScheduleRequest request);

	TripScheduleResponse updateSchedule(Long id, TripScheduleRequest request);

	TripScheduleResponse getScheduleById(Long id);

	List<TripScheduleResponse> getSchedulesBySchool(Long schoolId);

	List<TripScheduleResponse> getSchedulesByBusAssignment(Long busAssignmentId);

	void deleteSchedule(Long id);
}