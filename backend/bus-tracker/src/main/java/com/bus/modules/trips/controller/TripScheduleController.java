package com.bus.modules.trips.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.bus.modules.trips.dto.TripScheduleRequest;
import com.bus.modules.trips.dto.TripScheduleResponse;
import com.bus.modules.trips.service.TripScheduleService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/trip-schedules")
@RequiredArgsConstructor
public class TripScheduleController {

	private final TripScheduleService service;

	@PostMapping
	public ResponseEntity<TripScheduleResponse> createSchedule(@RequestBody TripScheduleRequest request) {

		return ResponseEntity.status(HttpStatus.CREATED).body(service.createSchedule(request));
	}

	@PutMapping("/{id}")
	public ResponseEntity<TripScheduleResponse> updateSchedule(@PathVariable Long id,
			@RequestBody TripScheduleRequest request) {

		return ResponseEntity.ok(service.updateSchedule(id, request));
	}

	@GetMapping("/{id}")
	public ResponseEntity<TripScheduleResponse> getScheduleById(@PathVariable Long id) {

		return ResponseEntity.ok(service.getScheduleById(id));
	}

	@GetMapping("/school/{schoolId}")
	public ResponseEntity<List<TripScheduleResponse>> getSchedulesBySchool(@PathVariable Long schoolId) {

		return ResponseEntity.ok(service.getSchedulesBySchool(schoolId));
	}

	@GetMapping("/bus-assignment/{busAssignmentId}")
	public ResponseEntity<List<TripScheduleResponse>> getSchedulesByBusAssignment(@PathVariable Long busAssignmentId) {

		return ResponseEntity.ok(service.getSchedulesByBusAssignment(busAssignmentId));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteSchedule(@PathVariable Long id) {

		service.deleteSchedule(id);

		return ResponseEntity.noContent().build();
	}
}