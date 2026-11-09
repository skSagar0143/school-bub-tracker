package com.bus.modules.busassignmentstops.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.bus.modules.busassignmentstops.entity.BusAssignmentStopEntity;

@Repository
public interface BusAssignmentStopRepository extends JpaRepository<BusAssignmentStopEntity, Long> {

    List<BusAssignmentStopEntity> findByBusAssignmentId(Long busAssignmentId);

    boolean existsByBusAssignmentIdAndRouteStopId(Long busAssignmentId, Long routeStopId);

    void deleteByBusAssignmentId(Long busAssignmentId);

    void deleteByBusAssignmentIdAndRouteStopId(Long busAssignmentId, Long routeStopId);
}
