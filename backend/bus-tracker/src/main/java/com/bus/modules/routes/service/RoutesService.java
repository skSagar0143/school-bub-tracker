package com.bus.modules.routes.service;

import java.util.List;

import com.bus.modules.routes.entity.RoutesEntity;

public interface RoutesService {

	RoutesEntity createRoute(RoutesEntity route);

	RoutesEntity updateRoute(Long id, RoutesEntity route);

	RoutesEntity getRouteById(Long id);

	List<RoutesEntity> getAllRoutes();

	List<RoutesEntity> getRoutesBySchoolId(Long schoolId);

	void deleteRoute(Long id);
}