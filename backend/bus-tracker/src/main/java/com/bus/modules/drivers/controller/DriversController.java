package com.bus.modules.drivers.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bus.modules.drivers.entity.DriversEntity;
import com.bus.modules.drivers.services.DriversService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/driver")
@RequiredArgsConstructor
public class DriversController {

	private final DriversService driversService;

	@PostMapping
	public ResponseEntity<DriversEntity> createDriver(@RequestBody DriversEntity driver) {

		return ResponseEntity.status(HttpStatus.CREATED).body(driversService.createDriver(driver));
	}

	@PutMapping("/{id}")
	public ResponseEntity<DriversEntity> updateDriver(@PathVariable Long id, @RequestBody DriversEntity driver) {

		return ResponseEntity.ok(driversService.updateDriver(id, driver));
	}

	@GetMapping("/{id}")
	public ResponseEntity<DriversEntity> getDriverById(@PathVariable Long id) {

		return ResponseEntity.ok(driversService.getDriverById(id));
	}

	@GetMapping
	public ResponseEntity<List<DriversEntity>> getAllDrivers() {

		return ResponseEntity.ok(driversService.getAllDrivers());
	}

	@GetMapping("/school/{schoolId}")
	public ResponseEntity<List<DriversEntity>> getDriversBySchoolId(@PathVariable Long schoolId) {

		return ResponseEntity.ok(driversService.getDriversBySchoolId(schoolId));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteDriver(@PathVariable Long id) {

		driversService.deleteDriver(id);

		return ResponseEntity.noContent().build();
	}
}