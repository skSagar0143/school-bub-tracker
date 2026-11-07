package com.bus.modules.routestops.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.bus.modules.routestops.entity.RouteStopsEntity;
import com.bus.modules.routestops.service.RouteStopsService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/route-stop")
@RequiredArgsConstructor
public class RouteStopsController {

	private final RouteStopsService routeStopsService;

	@PostMapping
	public ResponseEntity<RouteStopsEntity> createStop(@RequestBody RouteStopsEntity stop) {

		return ResponseEntity.status(HttpStatus.CREATED).body(routeStopsService.createStop(stop));
	}

	@PutMapping("/{id}")
	public ResponseEntity<RouteStopsEntity> updateStop(@PathVariable Long id, @RequestBody RouteStopsEntity stop) {

		return ResponseEntity.ok(routeStopsService.updateStop(id, stop));
	}

	@GetMapping("/{id}")
	public ResponseEntity<RouteStopsEntity> getStopById(@PathVariable Long id) {

		return ResponseEntity.ok(routeStopsService.getStopById(id));
	}

	@GetMapping
	public ResponseEntity<List<RouteStopsEntity>> getAllStops() {

		return ResponseEntity.ok(routeStopsService.getAllStops());
	}

	@GetMapping("/route/{routeId}")
	public ResponseEntity<List<RouteStopsEntity>> getStopsByRouteId(@PathVariable Long routeId) {

		return ResponseEntity.ok(routeStopsService.getStopsByRouteId(routeId));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteStop(@PathVariable Long id) {

		routeStopsService.deleteStop(id);

		return ResponseEntity.noContent().build();
	}
}