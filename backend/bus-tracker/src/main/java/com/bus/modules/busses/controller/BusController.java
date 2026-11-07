
package com.bus.modules.busses.controller;

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

import com.bus.modules.busses.entity.BusEntity;
import com.bus.modules.busses.services.BusServices;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/bus")
@RequiredArgsConstructor
public class BusController {

	private final BusServices busServices;

	@PostMapping
	public ResponseEntity<BusEntity> createBus(@RequestBody BusEntity bus) {

		return ResponseEntity.status(HttpStatus.CREATED).body(busServices.createBus(bus));
	}

	@GetMapping
	public ResponseEntity<List<BusEntity>> getAllBuses() {

		return ResponseEntity.ok(busServices.getAllBuses());
	}

	@GetMapping("/{id}")
	public ResponseEntity<BusEntity> getBusById(@PathVariable Long id) {

		return ResponseEntity.ok(busServices.getBusById(id));
	}

	@GetMapping("/school/{schoolId}")
	public ResponseEntity<List<BusEntity>> getBusesBySchoolId(@PathVariable Long schoolId) {

		return ResponseEntity.ok(busServices.getBusesBySchoolId(schoolId));
	}

	@PutMapping("/{id}")
	public ResponseEntity<BusEntity> updateBus(@PathVariable Long id, @RequestBody BusEntity bus) {

		return ResponseEntity.ok(busServices.updateBus(id, bus));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<String> deleteBus(@PathVariable Long id) {

		busServices.deleteBus(id);

		return ResponseEntity.ok("Bus deactivated successfully");
	}
}
