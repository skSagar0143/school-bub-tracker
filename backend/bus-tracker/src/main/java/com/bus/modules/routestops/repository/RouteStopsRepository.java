package com.bus.modules.routestops.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bus.modules.routestops.entity.RouteStopsEntity;

public interface RouteStopsRepository extends JpaRepository<RouteStopsEntity, Long> {

	boolean existsByRouteIdAndStopOrder(Long routeId, Integer stopOrder);

	boolean existsByRouteIdAndStopOrderAndIdNot(Long routeId, Integer stopOrder, Long id);

	List<RouteStopsEntity> findByRouteIdAndStatusOrderByStopOrderAsc(Long routeId, String status);

	List<RouteStopsEntity> findByStatus(String status);
}