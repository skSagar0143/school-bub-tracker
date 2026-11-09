package com.bus.modules.driverabsences.services;

import java.util.List;

import com.bus.modules.driverabsences.entity.DriverAbsenceEntity;

public interface DriverAbsenceService {

    DriverAbsenceEntity markAbsent(Long driverId, Long schoolId, java.time.LocalDate startDate,
                                   java.time.LocalDate endDate, String reason);

    List<DriverAbsenceEntity> getDriverAbsences(Long driverId);
}
