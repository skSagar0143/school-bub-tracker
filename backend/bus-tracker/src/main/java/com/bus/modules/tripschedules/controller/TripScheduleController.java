package com.bus.modules.tripschedules.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.bus.modules.tripschedules.dto.TripScheduleRequest;
import com.bus.modules.tripschedules.dto.TripScheduleResponse;
import com.bus.modules.tripschedules.service.TripScheduleService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/trip-schedules")
@RequiredArgsConstructor
public class TripScheduleController {

    private final TripScheduleService tripScheduleService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TripScheduleResponse createSchedule(@RequestBody TripScheduleRequest request) {
        return TripScheduleResponse.from(tripScheduleService.createSchedule(request));
    }

    @PutMapping("/{id}")
    public TripScheduleResponse updateSchedule(
            @PathVariable Long id,
            @RequestBody TripScheduleRequest request) {
        return TripScheduleResponse.from(tripScheduleService.updateSchedule(id, request));
    }

    @GetMapping("/{id}")
    public TripScheduleResponse getScheduleById(@PathVariable Long id) {
        return TripScheduleResponse.from(tripScheduleService.getScheduleById(id));
    }

    @GetMapping("/school/{schoolId}")
    public List<TripScheduleResponse> getSchedulesBySchool(@PathVariable Long schoolId) {
        return tripScheduleService.getSchedulesBySchool(schoolId)
                .stream().map(TripScheduleResponse::from).toList();
    }

    @GetMapping("/bus-assignment/{busAssignmentId}")
    public List<TripScheduleResponse> getSchedulesByBusAssignment(@PathVariable Long busAssignmentId) {
        return tripScheduleService.getSchedulesByBusAssignment(busAssignmentId)
                .stream().map(TripScheduleResponse::from).toList();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateSchedule(@PathVariable Long id) {
        tripScheduleService.deactivateSchedule(id);
    }
}
