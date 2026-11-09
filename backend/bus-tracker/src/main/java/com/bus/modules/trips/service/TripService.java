package com.bus.modules.trips.service;

import java.time.LocalDate;
import java.util.List;

import com.bus.modules.trips.dto.GenerateTripsRequest;
import com.bus.modules.trips.dto.TripResponse;
import com.bus.modules.trips.dto.UpdateTripChildStatusRequest;
import com.bus.modules.trips.dto.UpdateTripStatusRequest;

public interface TripService {
    List<TripResponse> generateTrips(GenerateTripsRequest request);
    List<TripResponse> getTripsBySchoolAndDate(Long schoolId, LocalDate tripDate);
    TripResponse getTrip(Long tripId);
    TripResponse updateTripStatus(Long tripId, UpdateTripStatusRequest request);
    TripResponse updateStopStatus(Long tripId, Long stopId, UpdateTripChildStatusRequest request);
    TripResponse updateStudentStatus(Long tripId, Long tripStudentId, UpdateTripChildStatusRequest request);
}
