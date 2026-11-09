
package com.bus.modules.livetracking.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class BusLocationRequest {

	// The active trip being tracked
	private Long tripId;

	// GPS coordinates
	private BigDecimal latitude;
	private BigDecimal longitude;

	// GPS accuracy in meters
	private Double accuracy;

	// Speed in meters per second
	private Double speed;

	// Direction in degrees (0-360)
	private Double heading;

	// Time when the phone captured this location
	private LocalDateTime recordedAt;
}
