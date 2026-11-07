package com.bus.modules.routes.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.bus.modules.routes.entity.RoutesEntity;
import com.bus.modules.routes.service.RoutesService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/route")
@RequiredArgsConstructor
public class RouteController {

	private final RoutesService routesService;

	@PostMapping
	public ResponseEntity<RoutesEntity> createRoute(@RequestBody RoutesEntity route) {

		return ResponseEntity.status(HttpStatus.CREATED).body(routesService.createRoute(route));
	}

	@PutMapping("/{id}")
	public ResponseEntity<RoutesEntity> updateRoute(@PathVariable Long id, @RequestBody RoutesEntity route) {

		return ResponseEntity.ok(routesService.updateRoute(id, route));
	}

	@GetMapping("/{id}")
	public ResponseEntity<RoutesEntity> getRouteById(@PathVariable Long id) {

		return ResponseEntity.ok(routesService.getRouteById(id));
	}

	@GetMapping
	public ResponseEntity<List<RoutesEntity>> getAllRoutes() {

		return ResponseEntity.ok(routesService.getAllRoutes());
	}

	@GetMapping("/school/{schoolId}")
	public ResponseEntity<List<RoutesEntity>> getRoutesBySchoolId(@PathVariable Long schoolId) {

		return ResponseEntity.ok(routesService.getRoutesBySchoolId(schoolId));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteRoute(@PathVariable Long id) {

		routesService.deleteRoute(id);

		return ResponseEntity.noContent().build();
	}
}