
package com.bus.modules.livetracking.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bus.modules.drivers.entity.DriversEntity;
import com.bus.modules.drivers.repository.DriversRepository;
import com.bus.modules.livetracking.dto.BusLocationRequest;
import com.bus.modules.livetracking.entity.BusLocationEntity;
import com.bus.modules.livetracking.repository.BusLocationRepository;
import com.bus.modules.trips.entity.TripEntity;
import com.bus.modules.trips.repository.TripRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import tools.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class BusLocationServiceImpl implements BusLocationService {

	private final DriversRepository driversRepository;
	private final TripRepository tripRepository;
	private final BusLocationRepository busLocationRepository;
	private final StringRedisTemplate redisTemplate;
	private final ObjectMapper objectMapper;

	@Override
	public void updateDriverLocation(UUID userId, BusLocationRequest request) {

		// 1. Find the active driver linked to the logged-in user.
		DriversEntity driver = driversRepository.findByUserId(userId)
				.filter(item -> "ACTIVE".equalsIgnoreCase(item.getStatus()))
				.orElseThrow(() -> new IllegalArgumentException("No active driver profile is linked to this account."));

		// 2. Find and validate the driver's active trip.
		// School ID, driver ID and status are checked directly in the query.
		TripEntity trip = tripRepository
				.findByIdAndSchoolIdAndDriverIdAndStatus(request.getTripId(), driver.getSchoolId(), driver.getId(),
						"IN_PROGRESS")
				.orElseThrow(() -> new IllegalArgumentException("No active trip found for this driver."));

		// 3. Check the most recently saved location for this trip.
		var lastLocation = busLocationRepository.findTopBySchoolIdAndTripIdOrderByRecordedAtDesc(trip.getSchoolId(),
				trip.getId());

		// 4. Avoid saving duplicate coordinates.
		if (lastLocation.isPresent()) {

			BusLocationEntity previous = lastLocation.get();

			boolean sameLatitude = previous.getLatitude().compareTo(request.getLatitude()) == 0;

			boolean sameLongitude = previous.getLongitude().compareTo(request.getLongitude()) == 0;

			if (sameLatitude && sameLongitude) {
				updateLatestLocationInRedis(previous);
				return;
			}
		}

		// 5. Create the GPS history record.
		BusLocationEntity location = new BusLocationEntity();

		// These IDs come from trusted database records.
		// Never accept them from the driver's phone.
		location.setSchoolId(trip.getSchoolId());
		location.setTripId(trip.getId());
		location.setBusId(trip.getBusId());
		location.setDriverId(driver.getId());

		// GPS information received from the driver's device.
		location.setLatitude(request.getLatitude());
		location.setLongitude(request.getLongitude());
		location.setAccuracy(request.getAccuracy());
		location.setSpeed(request.getSpeed());
		location.setHeading(request.getHeading());

		// Always use backend time.
		location.setRecordedAt(LocalDateTime.now());

		// receivedAt is automatically populated by @PrePersist
		// in BusLocationEntity.
		BusLocationEntity savedLocation = busLocationRepository.save(location);
		updateLatestLocationInRedis(savedLocation);
	}

	private void updateLatestLocationInRedis(BusLocationEntity location) {

		try {
			Map<String, Object> data = new HashMap<>();

			data.put("schoolId", location.getSchoolId());
			data.put("tripId", location.getTripId());
			data.put("busId", location.getBusId());
			data.put("driverId", location.getDriverId());
			data.put("latitude", location.getLatitude());
			data.put("longitude", location.getLongitude());
			data.put("accuracy", location.getAccuracy());
			data.put("speed", location.getSpeed());
			data.put("heading", location.getHeading());
			data.put("recordedAt", location.getRecordedAt());

			String key = "bus:live:location:trip:" + location.getTripId();

			String json = objectMapper.writeValueAsString(data);

			redisTemplate.opsForValue().set(key, json, Duration.ofSeconds(90));

		} catch (Exception e) {
			log.error("Failed to update latest bus location in Redis", e);
		}
	}

	@Override
	public Optional<Map<String, Object>> getLatestTripLocation(UUID userId, Long tripId) {

		// 1. Find the active driver.
		DriversEntity driver = driversRepository.findByUserId(userId)
				.filter(item -> "ACTIVE".equalsIgnoreCase(item.getStatus()))
				.orElseThrow(() -> new IllegalArgumentException("No active driver profile found."));

		// 2. Verify that this trip belongs to the driver's school
		// and that the driver is assigned to it.
		tripRepository.findByIdAndSchoolIdAndDriverId(tripId, driver.getSchoolId(), driver.getId())
				.orElseThrow(() -> new IllegalArgumentException("Trip not found or access denied."));

		// 3. Read the latest location from Redis.
		String key = "bus:live:location:trip:" + tripId;

		String json = redisTemplate.opsForValue().get(key);

		if (json == null || json.isBlank()) {
			return Optional.empty();
		}

		try {
			@SuppressWarnings("unchecked")
			Map<String, Object> data = objectMapper.readValue(json, Map.class);

			return Optional.of(data);

		} catch (Exception e) {
			log.error("Failed to read live location for trip {}", tripId, e);
			return Optional.empty();
		}
	}

}
