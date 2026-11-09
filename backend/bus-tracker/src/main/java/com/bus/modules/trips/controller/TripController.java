package com.bus.modules.trips.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.bus.modules.trips.dto.GenerateTripsRequest;
import com.bus.modules.trips.dto.TripResponse;
import com.bus.modules.trips.dto.UpdateTripChildStatusRequest;
import com.bus.modules.trips.dto.UpdateTripStatusRequest;
import com.bus.modules.trips.service.TripService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    public List<TripResponse> generateTrips(@RequestBody GenerateTripsRequest request) {
        return tripService.generateTrips(request);
    }

    @GetMapping("/school/{schoolId}")
    public List<TripResponse> getTripsBySchool(
            @PathVariable Long schoolId,
            @RequestParam(required = false) LocalDate date) {
        return tripService.getTripsBySchoolAndDate(schoolId, date);
    }

    @GetMapping("/{tripId}")
    public TripResponse getTrip(@PathVariable Long tripId) {
        return tripService.getTrip(tripId);
    }

    @PatchMapping("/{tripId}/status")
    public TripResponse updateTripStatus(
            @PathVariable Long tripId,
            @RequestBody UpdateTripStatusRequest request) {
        return tripService.updateTripStatus(tripId, request);
    }

    @PatchMapping("/{tripId}/stops/{stopId}/status")
    public TripResponse updateStopStatus(
            @PathVariable Long tripId,
            @PathVariable Long stopId,
            @RequestBody UpdateTripChildStatusRequest request) {
        return tripService.updateStopStatus(tripId, stopId, request);
    }

    @PatchMapping("/{tripId}/students/{tripStudentId}/status")
    public TripResponse updateStudentStatus(
            @PathVariable Long tripId,
            @PathVariable Long tripStudentId,
            @RequestBody UpdateTripChildStatusRequest request) {
        return tripService.updateStudentStatus(tripId, tripStudentId, request);
    }
}
