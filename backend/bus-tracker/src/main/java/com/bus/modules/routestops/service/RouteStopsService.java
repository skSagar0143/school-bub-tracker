package com.bus.modules.routestops.service;

import java.util.List;

import com.bus.modules.routestops.entity.RouteStopsEntity;

public interface RouteStopsService {

	RouteStopsEntity createStop(RouteStopsEntity stop);

	RouteStopsEntity updateStop(Long id, RouteStopsEntity stop);

	RouteStopsEntity getStopById(Long id);

	List<RouteStopsEntity> getAllStops();

	List<RouteStopsEntity> getStopsByRouteId(Long routeId);

	void deleteStop(Long id);
}