package com.bus.modules.busassignmentstops.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bus.modules.busassignmentstops.service.BusAssignmentStopService;
import com.bus.modules.routestops.entity.RouteStopsEntity;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/bus-assignment-stops")
@RequiredArgsConstructor
public class BusAssignmentStopController {

    private final BusAssignmentStopService assignmentStopService;

    @GetMapping("/assignment/{busAssignmentId}")
    public ResponseEntity<List<RouteStopsEntity>> getStops(@PathVariable Long busAssignmentId) {
        return ResponseEntity.ok(assignmentStopService.getStopsByBusAssignment(busAssignmentId));
    }

    @PutMapping("/assignment/{busAssignmentId}")
    public ResponseEntity<List<RouteStopsEntity>> replaceStops(
            @PathVariable Long busAssignmentId, @RequestBody ReplaceStopsRequest request) {
        return ResponseEntity.ok(
                assignmentStopService.replaceStops(busAssignmentId, request.getRouteStopIds()));
    }

    @PostMapping("/assignment/{busAssignmentId}/stop/{routeStopId}")
    public ResponseEntity<RouteStopsEntity> addStop(
            @PathVariable Long busAssignmentId, @PathVariable Long routeStopId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assignmentStopService.addStop(busAssignmentId, routeStopId));
    }

    @DeleteMapping("/assignment/{busAssignmentId}/stop/{routeStopId}")
    public ResponseEntity<Void> removeStop(
            @PathVariable Long busAssignmentId, @PathVariable Long routeStopId) {
        assignmentStopService.removeStop(busAssignmentId, routeStopId);
        return ResponseEntity.noContent().build();
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class ReplaceStopsRequest {
        private List<Long> routeStopIds;
    }
}
