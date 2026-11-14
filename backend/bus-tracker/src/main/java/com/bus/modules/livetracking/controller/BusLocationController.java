package com.bus.modules.livetracking.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.bus.modules.livetracking.dto.BusLocationRequest;
import com.bus.modules.livetracking.service.BusLocationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/driver")
@RequiredArgsConstructor
public class BusLocationController {

	private final BusLocationService busLocationService;

	@PostMapping("/location")
	@ResponseStatus(HttpStatus.ACCEPTED)
	@PreAuthorize("hasAuthority('ROLE_DRIVER')")
	public void updateLocation(@Valid @RequestBody BusLocationRequest request, Authentication authentication) {

		UUID userId = UUID.fromString(authentication.getName());

		busLocationService.updateDriverLocation(userId, request);
	}
}