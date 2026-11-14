package com.bus.modules.livetracking.service.impl;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.bus.modules.drivers.entity.DriversEntity;
import com.bus.modules.drivers.repository.DriversRepository;
import com.bus.modules.livetracking.dto.BusLocationRequest;
import com.bus.modules.livetracking.dto.LiveLocationResponse;
import com.bus.modules.livetracking.entity.BusLocationEntity;
import com.bus.modules.livetracking.repository.BusLocationRepository;
import com.bus.modules.trips.entity.TripEntity;
import com.bus.modules.trips.repository.TripRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class LiveTrackingServiceImpl implements com.bus.modules.livetracking.service.LiveTrackingService {

    private static final long REDIS_TTL_SECONDS = 90;
    private static final long HISTORY_INTERVAL_SECONDS = 15;
    private static final long STATIONARY_CHECKPOINT_SECONDS = 120;
    private static final double MIN_MOVEMENT_METRES = 20.0;

    private final DriversRepository driversRepository;
    private final TripRepository tripRepository;
    private final BusLocationRepository locationRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public LiveTrackingServiceImpl(
            DriversRepository driversRepository,
            TripRepository tripRepository,
            BusLocationRepository locationRepository,
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper) {
        this.driversRepository = driversRepository;
        this.tripRepository = tripRepository;
        this.locationRepository = locationRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public LiveLocationResponse updateDriverLocation(UUID userId, BusLocationRequest request) {
        DriversEntity driver = driversRepository.findByUserId(userId)
                .filter(item -> "ACTIVE".equalsIgnoreCase(item.getStatus()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "No active driver profile is linked to this account."));

        TripEntity trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found."));

        if (!"IN_PROGRESS".equalsIgnoreCase(trip.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "GPS updates are allowed only for trips in progress.");
        }

        if (trip.getDriverId() == null || !trip.getDriverId().equals(driver.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not the currently assigned driver for this trip.");
        }

        LocalDateTime now = LocalDateTime.now();
        BusLocationEntity latest = locationRepository
                .findTopBySchoolIdAndTripIdOrderByRecordedAtDesc(trip.getSchoolId(), trip.getId())
                .orElse(null);

        BusLocationEntity current = new BusLocationEntity();
        current.setSchoolId(trip.getSchoolId());
        current.setTripId(trip.getId());
        current.setBusId(trip.getBusId());
        current.setDriverId(driver.getId());
        current.setLatitude(request.getLatitude());
        current.setLongitude(request.getLongitude());
        current.setAccuracy(request.getAccuracy());
        current.setSpeed(request.getSpeed());
        current.setHeading(request.getHeading());
        // Use backend time for ordering and throttling; the device timestamp is not trusted.
        current.setRecordedAt(now);
        current.setReceivedAt(now);

        boolean saveHistory = shouldSaveHistory(latest, current, now);
        if (saveHistory) {
            locationRepository.save(current);
        }

        LiveLocationResponse response = new LiveLocationResponse(
                trip.getId(), trip.getBusId(), current.getLatitude(), current.getLongitude(),
                current.getAccuracy(), current.getSpeed(), current.getHeading(), now,
                saveHistory, "Location received successfully.");

        try {
            String key = "school:" + trip.getSchoolId() + ":live:trip:" + trip.getId();
            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(response),
                    Duration.ofSeconds(REDIS_TTL_SECONDS));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize the latest bus location.", exception);
        }

        return response;
    }

    private boolean shouldSaveHistory(BusLocationEntity previous, BusLocationEntity current, LocalDateTime now) {
        if (previous == null) {
            return true;
        }

        long elapsedSeconds = ChronoUnit.SECONDS.between(previous.getRecordedAt(), now);
        if (elapsedSeconds < HISTORY_INTERVAL_SECONDS) {
            return false;
        }

        double distanceMetres = distanceInMetres(
                previous.getLatitude().doubleValue(), previous.getLongitude().doubleValue(),
                current.getLatitude().doubleValue(), current.getLongitude().doubleValue());

        return distanceMetres >= MIN_MOVEMENT_METRES
                || elapsedSeconds >= STATIONARY_CHECKPOINT_SECONDS;
    }

    private double distanceInMetres(double lat1, double lon1, double lat2, double lon2) {
        final double earthRadiusMetres = 6_371_000.0;
        double latitudeDelta = Math.toRadians(lat2 - lat1);
        double longitudeDelta = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);
        return earthRadiusMetres * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
