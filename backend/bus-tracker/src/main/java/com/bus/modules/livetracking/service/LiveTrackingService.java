package com.bus.modules.livetracking.service;

import java.util.UUID;

import com.bus.modules.livetracking.dto.BusLocationRequest;
import com.bus.modules.livetracking.dto.LiveLocationResponse;

public interface LiveTrackingService {

    LiveLocationResponse updateDriverLocation(UUID userId, BusLocationRequest request);
}
