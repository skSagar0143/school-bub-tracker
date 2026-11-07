package com.bus.modules.routes.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bus.modules.routes.entity.RoutesEntity;

public interface RouteRepository extends JpaRepository<RoutesEntity, Long> {

	boolean existsBySchoolIdAndRouteCode(Long schoolId, String routeCode);

	boolean existsBySchoolIdAndRouteCodeAndIdNot(Long schoolId, String routeCode, Long id);

	List<RoutesEntity> findByStatus(String status);

	List<RoutesEntity> findBySchoolIdAndStatus(Long schoolId, String status);
}