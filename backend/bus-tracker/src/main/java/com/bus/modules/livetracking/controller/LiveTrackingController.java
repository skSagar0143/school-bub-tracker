package com.bus.modules.livetracking.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.bus.modules.livetracking.dto.BusLocationRequest;
import com.bus.modules.livetracking.dto.LiveLocationResponse;
import com.bus.modules.livetracking.service.LiveTrackingService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/driver/live-tracking")
@Validated
public class LiveTrackingController {

    private final LiveTrackingService liveTrackingService;

    public LiveTrackingController(LiveTrackingService liveTrackingService) {
        this.liveTrackingService = liveTrackingService;
    }

    @PostMapping("/location")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAuthority('ROLE_DRIVER')")
    public LiveLocationResponse updateLocation(
            Authentication authentication,
            @Valid @RequestBody BusLocationRequest request) {
        UUID userId;
        try {
            userId = UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException exception) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Authenticated account does not have a valid user ID.");
        }
        return liveTrackingService.updateDriverLocation(userId, request);
    }
}
