package com.bus.modules.busassignmentstops.service;

import java.util.List;

import com.bus.modules.routestops.entity.RouteStopsEntity;

public interface BusAssignmentStopService {

    List<RouteStopsEntity> getStopsByBusAssignment(Long busAssignmentId);

    List<RouteStopsEntity> replaceStops(Long busAssignmentId, List<Long> routeStopIds);

    RouteStopsEntity addStop(Long busAssignmentId, Long routeStopId);

    void removeStop(Long busAssignmentId, Long routeStopId);
}
