package com.bus.modules.livetracking.controller;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.bus.modules.livetracking.service.BusLocationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tracking")
@RequiredArgsConstructor
public class BusTrackingController {

	private final BusLocationService busLocationService;

	@GetMapping("/trips/{tripId}/location")
	@PreAuthorize("hasAuthority('ROLE_DRIVER')")
	public Map<String, Object> getLatestLocation(@PathVariable Long tripId, Authentication authentication) {

		UUID userId = UUID.fromString(authentication.getName());

		return busLocationService.getLatestTripLocation(userId, tripId).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Live bus location is not available."));
	}
}