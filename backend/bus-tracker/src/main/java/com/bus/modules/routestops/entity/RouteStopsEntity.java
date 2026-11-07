package com.bus.modules.routestops.entity;

import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "route_stops", uniqueConstraints = {
		@UniqueConstraint(name = "uk_route_stop_order", columnNames = { "route_id", "stop_order" }) })
public class RouteStopsEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "route_id", nullable = false)
	private Long routeId;

	@Column(name = "stop_name", nullable = false, length = 150)
	private String stopName;

	@Column(name = "stop_address", length = 500)
	private String stopAddress;

	@Column(name = "stop_order", nullable = false)
	private Integer stopOrder;

	private Double latitude;

	private Double longitude;

	private LocalTime estimatedArrivalTime;

	@Column(nullable = false)
	private Boolean pickupAllowed = true;

	@Column(nullable = false)
	private Boolean dropAllowed = true;

	@Column(nullable = false, length = 20)
	private String status = "ACTIVE";

	private LocalDateTime createdAt;

	private LocalDateTime updatedAt;

	@PrePersist
	protected void onCreate() {
		createdAt = LocalDateTime.now();
		updatedAt = LocalDateTime.now();

		if (status == null) {
			status = "ACTIVE";
		}

		if (pickupAllowed == null) {
			pickupAllowed = true;
		}

		if (dropAllowed == null) {
			dropAllowed = true;
		}
	}

	@PreUpdate
	protected void onUpdate() {
		updatedAt = LocalDateTime.now();
	}
}