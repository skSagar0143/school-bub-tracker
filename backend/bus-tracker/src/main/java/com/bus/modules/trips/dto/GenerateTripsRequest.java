package com.bus.modules.trips.dto;

import java.time.LocalDate;

public record GenerateTripsRequest(Long schoolId, LocalDate tripDate) {
}
