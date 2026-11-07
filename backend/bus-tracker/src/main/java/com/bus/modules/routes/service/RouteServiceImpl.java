package com.bus.modules.routes.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bus.modules.routes.entity.RoutesEntity;
import com.bus.modules.routes.repository.RouteRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class RouteServiceImpl implements RoutesService {

	private final RouteRepository routeRepository;

	@Override
	public RoutesEntity createRoute(RoutesEntity route) {

		if (routeRepository.existsBySchoolIdAndRouteCode(route.getSchoolId(), route.getRouteCode())) {
			throw new RuntimeException("Route code already exists for this school");
		}

		route.setStatus("ACTIVE");

		return routeRepository.save(route);
	}

	@Override
	public RoutesEntity updateRoute(Long id, RoutesEntity route) {

		RoutesEntity existingRoute = routeRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Route not found"));

		if (routeRepository.existsBySchoolIdAndRouteCodeAndIdNot(route.getSchoolId(), route.getRouteCode(), id)) {
			throw new RuntimeException("Route code already exists for this school");
		}

		existingRoute.setSchoolId(route.getSchoolId());
		existingRoute.setRouteCode(route.getRouteCode());
		existingRoute.setRouteName(route.getRouteName());
		existingRoute.setDescription(route.getDescription());
		existingRoute.setStartingPoint(route.getStartingPoint());
		existingRoute.setEndingPoint(route.getEndingPoint());
		existingRoute.setEstimatedDistance(route.getEstimatedDistance());
		existingRoute.setEstimatedDuration(route.getEstimatedDuration());
		existingRoute.setStartTime(route.getStartTime());
		existingRoute.setEndTime(route.getEndTime());

		return routeRepository.save(existingRoute);
	}

	@Override
	@Transactional(readOnly = true)
	public RoutesEntity getRouteById(Long id) {

		return routeRepository.findById(id).filter(route -> "ACTIVE".equals(route.getStatus()))
				.orElseThrow(() -> new RuntimeException("Route not found"));
	}

	@Override
	@Transactional(readOnly = true)
	public List<RoutesEntity> getAllRoutes() {

		return routeRepository.findByStatus("ACTIVE");
	}

	@Override
	@Transactional(readOnly = true)
	public List<RoutesEntity> getRoutesBySchoolId(Long schoolId) {

		return routeRepository.findBySchoolIdAndStatus(schoolId, "ACTIVE");
	}

	@Override
	public void deleteRoute(Long id) {

		RoutesEntity route = routeRepository.findById(id).orElseThrow(() -> new RuntimeException("Route not found"));

		route.setStatus("INACTIVE");

		routeRepository.save(route);
	}
}