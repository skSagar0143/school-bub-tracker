package com.bus.modules.trips.dto;

import java.time.LocalTime;
import com.bus.modules.trips.entity.TripStopEntity;

public record TripStopResponse(
    Long id, Long routeStopId, String stopName, String stopAddress, Integer stopOrder,
    Double latitude, Double longitude, LocalTime estimatedArrivalTime, String status,
    java.time.LocalDateTime arrivedAt, java.time.LocalDateTime departedAt, String remarks
) {
    public static TripStopResponse from(TripStopEntity e) {
        return new TripStopResponse(e.getId(), e.getRouteStopId(), e.getStopName(), e.getStopAddress(),
            e.getStopOrder(), e.getLatitude(), e.getLongitude(), e.getEstimatedArrivalTime(),
            e.getStatus(), e.getArrivedAt(), e.getDepartedAt(), e.getRemarks());
    }
}
