package com.bus.modules.routestops.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bus.modules.routestops.entity.RouteStopsEntity;
import com.bus.modules.routestops.repository.RouteStopsRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class RouteStopsServiceImpl implements RouteStopsService {
	private final RouteStopsRepository routeStopsRepository;

	@Override
	public RouteStopsEntity createStop(RouteStopsEntity stop) {
		if (routeStopsRepository.existsByRouteIdAndStopOrder(stop.getRouteId(), stop.getStopOrder())) {
			throw new RuntimeException("This stop order already exists for the selected route");
		}

		stop.setStatus("ACTIVE");

		return routeStopsRepository.save(stop);
	}

	@Override
	public RouteStopsEntity updateStop(Long id, RouteStopsEntity stop) {
		RouteStopsEntity existingStop = getStopById(id);

		if (routeStopsRepository.existsByRouteIdAndStopOrderAndIdNot(stop.getRouteId(), stop.getStopOrder(), id)) {
			throw new RuntimeException("This stop order already exists for the selected route");
		}

		existingStop.setRouteId(stop.getRouteId());
		existingStop.setStopName(stop.getStopName());
		existingStop.setStopAddress(stop.getStopAddress());
		existingStop.setStopOrder(stop.getStopOrder());
		existingStop.setLatitude(stop.getLatitude());
		existingStop.setLongitude(stop.getLongitude());
		existingStop.setEstimatedArrivalTime(stop.getEstimatedArrivalTime());
		existingStop.setPickupAllowed(stop.getPickupAllowed());
		existingStop.setDropAllowed(stop.getDropAllowed());

		return routeStopsRepository.save(existingStop);
	}

	@Override
	@Transactional(readOnly = true)
	public RouteStopsEntity getStopById(Long id) {

		return routeStopsRepository.findById(id).filter(stop -> "ACTIVE".equals(stop.getStatus()))
				.orElseThrow(() -> new RuntimeException("Route stop not found"));
	}

	@Override
	@Transactional(readOnly = true)
	public List<RouteStopsEntity> getAllStops() {

		return routeStopsRepository.findByStatus("ACTIVE");
	}

	@Override
	@Transactional(readOnly = true)
	public List<RouteStopsEntity> getStopsByRouteId(Long routeId) {

		return routeStopsRepository.findByRouteIdAndStatusOrderByStopOrderAsc(routeId, "ACTIVE");
	}

	@Override
	public void deleteStop(Long id) {
		RouteStopsEntity stop = getStopById(id);

		stop.setStatus("INACTIVE");

		routeStopsRepository.save(stop);
	}

}
