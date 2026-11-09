package com.bus.modules.trips.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TripScheduleRequest {

	private Long schoolId;

	private Long busAssignmentId;

	private String tripType;

	private LocalTime startTime;

	private LocalDate effectiveFrom;

	private LocalDate effectiveUntil;

	private String operatingDays;

	private String status;

	private String remarks;
}