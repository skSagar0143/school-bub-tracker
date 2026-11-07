package com.bus.modules.driverassignments.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bus.modules.busses.entity.BusEntity;
import com.bus.modules.busses.repository.BusRepository;
import com.bus.modules.driverassignments.entity.DriverAssignmentEntity;
import com.bus.modules.driverassignments.repository.DriverAssignmentRepository;
import com.bus.modules.drivers.entity.DriversEntity;
import com.bus.modules.drivers.repository.DriversRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class DriverAssignmentServiceImpl implements DriverAssignmentService {

    private final DriverAssignmentRepository assignmentRepository;
    private final BusRepository busRepository;
    private final DriversRepository driversRepository;

    @Override
    public DriverAssignmentEntity createAssignment(DriverAssignmentEntity assignment) {
        validateAssignment(assignment, null);
        assignment.setStatus("ACTIVE");
        return assignmentRepository.save(assignment);
    }

    @Override
    public DriverAssignmentEntity updateAssignment(Long id, DriverAssignmentEntity request) {
        DriverAssignmentEntity existing = getAssignmentById(id);
        validateAssignment(request, id);

        existing.setSchoolId(request.getSchoolId());
        existing.setBusId(request.getBusId());
        existing.setDriverId(request.getDriverId());
        existing.setStartDate(request.getStartDate());
        existing.setEndDate(request.getEndDate());
        existing.setRemarks(request.getRemarks());

        return assignmentRepository.save(existing);
    }

    private void validateAssignment(DriverAssignmentEntity assignment, Long excludeId) {
        if (assignment.getSchoolId() == null || assignment.getBusId() == null
                || assignment.getDriverId() == null || assignment.getStartDate() == null) {
            throw new IllegalArgumentException("School, bus, driver and start date are required");
        }
        if (assignment.getEndDate() != null && assignment.getEndDate().isBefore(assignment.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        BusEntity bus = busRepository.findById(assignment.getBusId())
                .orElseThrow(() -> new IllegalArgumentException("Bus not found"));
        DriversEntity driver = driversRepository.findById(assignment.getDriverId())
                .orElseThrow(() -> new IllegalArgumentException("Driver not found"));

        if (!"ACTIVE".equals(bus.getStatus())) {
            throw new IllegalArgumentException("Only active buses can be assigned");
        }
        if (!"ACTIVE".equals(driver.getStatus())) {
            throw new IllegalArgumentException("Only active drivers can be assigned");
        }
        if (!bus.getSchoolId().equals(assignment.getSchoolId())
                || !driver.getSchoolId().equals(assignment.getSchoolId())) {
            throw new IllegalArgumentException("Bus, driver and assignment must belong to the same school");
        }

        if (assignmentRepository.existsOverlappingActiveAssignmentForBus(
                assignment.getBusId(), assignment.getStartDate(), assignment.getEndDate(), excludeId)) {
            throw new IllegalArgumentException("This bus already has an overlapping active driver assignment");
        }
        if (assignmentRepository.existsOverlappingActiveAssignmentForDriver(
                assignment.getDriverId(), assignment.getStartDate(), assignment.getEndDate(), excludeId)) {
            throw new IllegalArgumentException("This driver already has an overlapping active bus assignment");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public DriverAssignmentEntity getAssignmentById(Long id) {
        return assignmentRepository.findById(id)
                .filter(item -> "ACTIVE".equals(item.getStatus()))
                .orElseThrow(() -> new IllegalArgumentException("Driver assignment not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DriverAssignmentEntity> getAllAssignments() {
        return assignmentRepository.findByStatusOrderByStartDateDesc("ACTIVE");
    }

    @Override
    @Transactional(readOnly = true)
    public List<DriverAssignmentEntity> getAssignmentsByBusId(Long busId) {
        return assignmentRepository.findByBusIdOrderByStartDateDesc(busId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DriverAssignmentEntity> getAssignmentsByDriverId(Long driverId) {
        return assignmentRepository.findByDriverIdOrderByStartDateDesc(driverId);
    }

    @Override
    public void deleteAssignment(Long id) {
        DriverAssignmentEntity assignment = getAssignmentById(id);
        assignment.setStatus("INACTIVE");
        assignmentRepository.save(assignment);
    }
}
