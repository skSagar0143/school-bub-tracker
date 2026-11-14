
package com.bus.modules.livetracking.service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.bus.modules.livetracking.dto.BusLocationRequest;

public interface BusLocationService {

	void updateDriverLocation(UUID userId, BusLocationRequest request);

	Optional<Map<String, Object>> getLatestTripLocation(UUID userId, Long tripId);
}
