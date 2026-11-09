package com.bus.modules.livetracking.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class BusLocationRequest {

	// The active trip being tracked
	@NotNull(message = "Trip ID is required.")
	@Positive(message = "Trip ID must be greater than zero.")
	private Long tripId;

	// GPS coordinates
	@NotNull(message = "Latitude is required.")
	@DecimalMin(value = "-90.0", message = "Latitude must be at least -90.")
	@DecimalMax(value = "90.0", message = "Latitude must be at most 90.")
	private BigDecimal latitude;

	@NotNull(message = "Longitude is required.")
	@DecimalMin(value = "-180.0", message = "Longitude must be at least -180.")
	@DecimalMax(value = "180.0", message = "Longitude must be at most 180.")
	private BigDecimal longitude;

	// GPS accuracy in meters
	@PositiveOrZero(message = "Accuracy cannot be negative.")
	private Double accuracy;

	// Speed in meters per second
	@PositiveOrZero(message = "Speed cannot be negative.")
	private Double speed;

	// Direction in degrees (0-360)
	@DecimalMin(value = "0.0", message = "Heading must be between 0 and 360 degrees.")
	@DecimalMax(value = "360.0", message = "Heading must be between 0 and 360 degrees.")
	private Double heading;

	// Optional device capture time. The backend will use server time when absent.
	private LocalDateTime recordedAt;
}
